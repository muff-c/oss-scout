import { Command } from "commander";
import pc from "picocolors";
import { rankIssues } from "../core/scoring.js";
import type { FetchOptions, ScoreWeights, ScoutIssue } from "../core/types.js";
import { createOctokitFromEnv, fetchRepoIssues, searchIssues } from "../github/client.js";
import { formatJsonReport, formatMarkdownReport } from "../report/formatters.js";

type Dependencies = {
  write: (text: string) => void;
  createOctokit: () => unknown;
  fetchRepoIssues: (client: unknown, repository: string, options: FetchOptions) => Promise<ScoutIssue[]>;
  searchIssues: (client: unknown, query: string, options: FetchOptions) => Promise<ScoutIssue[]>;
};

type CommandOptions = {
  limit?: string;
  json?: boolean;
  markdown?: boolean;
  weights?: string;
};

export async function runCli(argv: string[], dependencies: Partial<Dependencies> = {}): Promise<void> {
  const deps: Dependencies = {
    write: (text) => process.stdout.write(text),
    createOctokit: createOctokitFromEnv,
    fetchRepoIssues: fetchRepoIssues as Dependencies["fetchRepoIssues"],
    searchIssues: searchIssues as Dependencies["searchIssues"],
    ...dependencies
  };

  const program = new Command();
  program
    .name("oss-scout")
    .description("Read-only GitHub issue scouting for maintainers and contributors.")
    .exitOverride()
    .showHelpAfterError()
    .configureOutput({
      writeOut: deps.write,
      writeErr: deps.write
    });

  program
    .command("repo")
    .argument("<owner/name>", "GitHub repository to scan")
    .option("--limit <count>", "maximum issues to inspect", "30")
    .option("--weights <json>", "JSON object of scoring weights by signal key")
    .option("--json", "print JSON")
    .option("--markdown", "print Markdown", true)
    .action(async (repository: string, options: CommandOptions) => {
      const issues = await deps.fetchRepoIssues(deps.createOctokit(), repository, parseFetchOptions(options));
      deps.write(renderReport(issues, options));
    });

  program
    .command("search")
    .argument("<query>", "GitHub issue search query")
    .option("--limit <count>", "maximum issues to inspect", "30")
    .option("--weights <json>", "JSON object of scoring weights by signal key")
    .option("--json", "print JSON")
    .option("--markdown", "print Markdown", true)
    .action(async (query: string, options: CommandOptions) => {
      const issues = await deps.searchIssues(deps.createOctokit(), query, parseFetchOptions(options));
      deps.write(renderReport(issues, options));
    });

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "commander.helpDisplayed") {
      return;
    }
    throw error;
  }
}

function parseFetchOptions(options: CommandOptions): FetchOptions {
  const limit = Number.parseInt(options.limit ?? "30", 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("--limit must be an integer between 1 and 100");
  }

  return { limit };
}

function renderReport(issues: ScoutIssue[], options: CommandOptions): string {
  const ranked = rankIssues(issues, { weights: parseScoreWeights(options.weights) });
  if (options.json) {
    return formatJsonReport(ranked);
  }

  return formatMarkdownReport(ranked, { title: "oss-scout report" });
}

function parseScoreWeights(rawWeights: string | undefined): Partial<ScoreWeights> | undefined {
  if (!rawWeights) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawWeights);
  } catch {
    throw new Error("--weights must be a JSON object with numeric values");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("--weights must be a JSON object with numeric values");
  }

  const weights: Partial<ScoreWeights> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("--weights must be a JSON object with numeric values");
    }
    weights[key] = value;
  }

  return weights;
}

export function formatCliError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `${pc.red("error")} ${message}\n`;
}
