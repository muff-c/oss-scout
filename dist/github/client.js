import { Octokit } from "@octokit/rest";
export function createOctokitFromEnv() {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    return new Octokit(token ? { auth: token } : {});
}
export async function fetchRepoIssues(client, repository, options) {
    const [owner, repo] = parseRepository(repository);
    const response = await client.rest.issues.listForRepo({
        owner,
        repo,
        state: "open",
        per_page: options.limit,
        sort: "updated",
        direction: "desc"
    });
    return response.data.filter((issue) => !issue.pull_request).map((issue) => mapRepoIssue(issue, repository));
}
export async function searchIssues(client, query, options) {
    const normalizedQuery = normalizeSearchQuery(query);
    const response = await client.rest.search.issuesAndPullRequests({
        q: normalizedQuery,
        per_page: options.limit,
        sort: "updated",
        order: "desc"
    });
    return response.data.items.map((issue) => mapSearchIssue(issue));
}
function parseRepository(repository) {
    const [owner, repo] = repository.split("/");
    if (!owner || !repo || repository.split("/").length !== 2) {
        throw new Error(`Repository must be in owner/name format. Received: ${repository}`);
    }
    return [owner, repo];
}
function normalizeSearchQuery(query) {
    const parts = [query.trim()];
    if (!/\bis:issue\b/.test(query)) {
        parts.push("is:issue");
    }
    if (!/\bis:open\b/.test(query)) {
        parts.push("is:open");
    }
    return parts.join(" ");
}
function mapRepoIssue(issue, repository) {
    return {
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        repository,
        state: normalizeState(issue.state),
        labels: normalizeLabels(issue.labels ?? []),
        comments: issue.comments ?? 0,
        assignees: (issue.assignees ?? []).map((assignee) => assignee.login).filter(isString),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        body: issue.body ?? "",
        linkedPullRequests: []
    };
}
function mapSearchIssue(issue) {
    return mapRepoIssue(issue, repositoryFromApiUrl(issue.repository_url));
}
function normalizeLabels(labels) {
    return labels
        .map((label) => (typeof label === "string" ? label : label.name))
        .filter(isString)
        .filter((label) => label.length > 0);
}
function normalizeState(state) {
    return state === "closed" ? "closed" : "open";
}
function repositoryFromApiUrl(repositoryUrl) {
    const match = repositoryUrl.match(/\/repos\/([^/]+\/[^/]+)$/);
    if (!match) {
        throw new Error(`Could not parse repository from ${repositoryUrl}`);
    }
    return match[1];
}
function isString(value) {
    return typeof value === "string";
}
//# sourceMappingURL=client.js.map