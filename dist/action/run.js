import { appendFileSync } from "node:fs";
import { appendFile } from "node:fs/promises";
import { rankIssues } from "../core/scoring.js";
import { createOctokitFromEnv, fetchRepoIssues, searchIssues } from "../github/client.js";
import { formatMarkdownReport } from "../report/formatters.js";
export async function runAction(dependencies = {}) {
    const deps = {
        core: createFileCommandCore(),
        createOctokit: createOctokitFromEnv,
        fetchRepoIssues: fetchRepoIssues,
        searchIssues: searchIssues,
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
    }
    catch (error) {
        deps.core.setFailed(error instanceof Error ? error.message : String(error));
    }
}
function parseLimit(rawLimit) {
    const limit = Number.parseInt(rawLimit, 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("limit must be an integer between 1 and 100");
    }
    return limit;
}
function createFileCommandCore() {
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
                        }
                        else {
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
//# sourceMappingURL=run.js.map