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
    const issues = response.data.filter((issue) => !issue.pull_request).map((issue) => mapRepoIssue(issue, repository));
    return addLinkedPullRequests(client, owner, repo, issues);
}
export async function searchIssues(client, query, options) {
    const normalizedQuery = normalizeSearchQuery(query);
    const response = await client.rest.search.issuesAndPullRequests({
        q: normalizedQuery,
        per_page: options.limit,
        sort: "updated",
        order: "desc"
    });
    const issues = response.data.items.map((issue) => mapSearchIssue(issue));
    return Promise.all(issues.map(async (issue) => {
        const [owner, repo] = parseRepository(issue.repository);
        return {
            ...issue,
            linkedPullRequests: await fetchLinkedPullRequests(client, owner, repo, issue.number)
        };
    }));
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
async function addLinkedPullRequests(client, owner, repo, issues) {
    return Promise.all(issues.map(async (issue) => ({
        ...issue,
        linkedPullRequests: await fetchLinkedPullRequests(client, owner, repo, issue.number)
    })));
}
async function fetchLinkedPullRequests(client, owner, repo, issueNumber) {
    const response = await client.rest.issues.listEventsForTimeline({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100
    });
    const linkedPullRequests = response.data
        .map((event) => event.source?.issue)
        .filter(isPullRequestReference)
        .map((pullRequest) => ({
        url: pullRequest.html_url,
        state: normalizeState(pullRequest.state)
    }));
    return uniquePullRequests(linkedPullRequests);
}
function isPullRequestReference(issue) {
    if (!issue) {
        return false;
    }
    return Boolean(issue.pull_request) && isString(issue.html_url) && isString(issue.state);
}
function uniquePullRequests(pullRequests) {
    const seen = new Set();
    return pullRequests.filter((pullRequest) => {
        if (seen.has(pullRequest.url)) {
            return false;
        }
        seen.add(pullRequest.url);
        return true;
    });
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