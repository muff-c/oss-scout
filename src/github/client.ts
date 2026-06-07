import { Octokit } from "@octokit/rest";
import type { FetchOptions, IssueState, ScoutIssue } from "../core/types.js";

type LabelLike = string | { name?: string | null };

type RepoIssueResponse = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  labels?: LabelLike[];
  comments?: number;
  assignees?: Array<{ login?: string | null }>;
  created_at: string;
  updated_at: string;
  body?: string | null;
  pull_request?: unknown;
};

type SearchIssueResponse = RepoIssueResponse & {
  repository_url: string;
};

type RepoIssueClient = {
  rest: {
    issues: {
      listForRepo(params: Record<string, unknown>): Promise<{ data: RepoIssueResponse[] }>;
    };
  };
};

type SearchIssueClient = {
  rest: {
    search: {
      issuesAndPullRequests(params: Record<string, unknown>): Promise<{ data: { items: SearchIssueResponse[] } }>;
    };
  };
};

export function createOctokitFromEnv(): Octokit {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return new Octokit(token ? { auth: token } : {});
}

export async function fetchRepoIssues(client: RepoIssueClient, repository: string, options: FetchOptions): Promise<ScoutIssue[]> {
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

export async function searchIssues(client: SearchIssueClient, query: string, options: FetchOptions): Promise<ScoutIssue[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  const response = await client.rest.search.issuesAndPullRequests({
    q: normalizedQuery,
    per_page: options.limit,
    sort: "updated",
    order: "desc"
  });

  return response.data.items.map((issue) => mapSearchIssue(issue));
}

function parseRepository(repository: string): [string, string] {
  const [owner, repo] = repository.split("/");
  if (!owner || !repo || repository.split("/").length !== 2) {
    throw new Error(`Repository must be in owner/name format. Received: ${repository}`);
  }

  return [owner, repo];
}

function normalizeSearchQuery(query: string): string {
  const parts = [query.trim()];
  if (!/\bis:issue\b/.test(query)) {
    parts.push("is:issue");
  }
  if (!/\bis:open\b/.test(query)) {
    parts.push("is:open");
  }
  return parts.join(" ");
}

function mapRepoIssue(issue: RepoIssueResponse, repository: string): ScoutIssue {
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

function mapSearchIssue(issue: SearchIssueResponse): ScoutIssue {
  return mapRepoIssue(issue, repositoryFromApiUrl(issue.repository_url));
}

function normalizeLabels(labels: LabelLike[]): string[] {
  return labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(isString)
    .filter((label) => label.length > 0);
}

function normalizeState(state: string): IssueState {
  return state === "closed" ? "closed" : "open";
}

function repositoryFromApiUrl(repositoryUrl: string): string {
  const match = repositoryUrl.match(/\/repos\/([^/]+\/[^/]+)$/);
  if (!match) {
    throw new Error(`Could not parse repository from ${repositoryUrl}`);
  }

  return match[1];
}

function isString(value: string | null | undefined): value is string {
  return typeof value === "string";
}
