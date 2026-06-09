import { Command } from "commander";
import pc from "picocolors";
import { rankIssues } from "../core/scoring.js";
import { createOctokitFromEnv, fetchRepoIssues, searchIssues } from "../github/client.js";
import { formatJsonReport, formatMarkdownReport } from "../report/formatters.js";
export async function runCli(argv, dependencies = {}) {
    const deps = {
        write: (text) => process.stdout.write(text),
        createOctokit: createOctokitFromEnv,
        fetchRepoIssues: fetchRepoIssues,
        searchIssues: searchIssues,
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
        .action(async (repository, options) => {
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
        .action(async (query, options) => {
        const issues = await deps.searchIssues(deps.createOctokit(), query, parseFetchOptions(options));
        deps.write(renderReport(issues, options));
    });
    try {
        await program.parseAsync(argv, { from: "user" });
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "commander.helpDisplayed") {
            return;
        }
        throw error;
    }
}
function parseFetchOptions(options) {
    const limit = Number.parseInt(options.limit ?? "30", 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("--limit must be an integer between 1 and 100");
    }
    return { limit };
}
function renderReport(issues, options) {
    const ranked = rankIssues(issues, { weights: parseScoreWeights(options.weights) });
    if (options.json) {
        return formatJsonReport(ranked);
    }
    return formatMarkdownReport(ranked, { title: "oss-scout report" });
}
function parseScoreWeights(rawWeights) {
    if (!rawWeights) {
        return undefined;
    }
    let parsed;
    try {
        parsed = JSON.parse(rawWeights);
    }
    catch {
        throw new Error("--weights must be a JSON object with numeric values");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("--weights must be a JSON object with numeric values");
    }
    const weights = {};
    for (const [key, value] of Object.entries(parsed)) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error("--weights must be a JSON object with numeric values");
        }
        weights[key] = value;
    }
    return weights;
}
export function formatCliError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return `${pc.red("error")} ${message}\n`;
}
//# sourceMappingURL=run.js.map