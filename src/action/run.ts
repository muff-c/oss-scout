import { appendFileSync } from "node:fs";
import { appendFile } from "node:fs/promises";
import { rankIssues } from "../core/scoring.js";
import type { FetchOptions, ScoutIssue } from "../core/types.js";
import { createOctokitFromEnv, fetchRepoIssues, searchIssues } from "../github/client.js";
import { formatMarkdownReport } from "../report/formatters.js";

type ActionCore = {
  getInput: (name: string, options?: { required?: boolean }) => string;
  setOutput: (name: string, value: string) => void;
  setFailed: (message: string) => void;
  summary: {
    addRaw: (text: string) => { write: () => Promise<unknown> };
    write: () => Promise<unknown>;
  };
};

type ActionDependencies = {
  core: ActionCore;
  createOctokit: () => unknown;
  fetchRepoIssues: (client: unknown, repository: string, options: FetchOptions) => Promise<ScoutIssue[]>;
  searchIssues: (client: unknown, query: string, options: FetchOptions) => Promise<ScoutIssue[]>;
};

export async function runAction(dependencies: Partial<ActionDependencies> = {}): Promise<void> {
  const deps: ActionDependencies = {
    core: createFileCommandCore(),
    createOctokit: createOctokitFromEnv,
    fetchRepoIssues: fetchRepoIssues as ActionDependencies["fetchRepoIssues"],
    searchIssues: searchIssues as ActionDependencies["searchIssues"],
    ...dependencies
  };

  try {
    const repo = deps.core.getInput("repo");
    const query = deps.core.getInput("query");
    const limit = parseLimit(deps.core.getInput("limit") || "30");
    const client = deps.createOctokit();
    const issues = repo
      ? await deps.fetchRepoIssues(client, repo, { limit })
      : await deps.searchIssues(client, query || "label:good-first-issue", { limit });
    const ranked = rankIssues(issues);
    const report = formatMarkdownReport(ranked, { title: "oss-scout report" });

    await deps.core.summary.addRaw(report).write();
    deps.core.setOutput("issue-count", String(ranked.length));
  } catch (error) {
    deps.core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

function parseLimit(rawLimit: string): number {
  const limit = Number.parseInt(rawLimit, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("limit must be an integer between 1 and 100");
  }

  return limit;
}

function createFileCommandCore(): ActionCore {
  return {
    getInput(name) {
      return process.env[`INPUT_${name.replaceAll("-", "_").toUpperCase()}`] ?? "";
    },
    setOutput(name, value) {
      const outputPath = process.env.GITHUB_OUTPUT;
      if (!outputPath) {
        return;
      }
      appendFileSync(outputPath, `${name}=${value}\n`, "utf8");
    },
    setFailed(message) {
      process.exitCode = 1;
      process.stderr.write(`${message}\n`);
    },
    summary: {
      addRaw(text) {
        return {
          async write() {
            const summaryPath = process.env.GITHUB_STEP_SUMMARY;
            if (summaryPath) {
              await appendFile(summaryPath, text, "utf8");
            } else {
              process.stdout.write(text);
            }
          }
        };
      },
      async write() {
        return undefined;
      }
    }
  };
}
