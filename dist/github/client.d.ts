import { Octokit } from "@octokit/rest";
import type { FetchOptions, ScoutIssue } from "../core/types.js";
type LabelLike = string | {
    name?: string | null;
};
type RepoIssueResponse = {
    number: number;
    title: string;
    html_url: string;
    state: string;
    labels?: LabelLike[];
    comments?: number;
    assignees?: Array<{
        login?: string | null;
    }>;
    created_at: string;
    updated_at: string;
    body?: string | null;
    pull_request?: unknown;
};
type SearchIssueResponse = RepoIssueResponse & {
    repository_url: string;
};
type TimelineIssueResponse = {
    html_url?: string | null;
    state?: string | null;
    pull_request?: unknown;
};
type TimelineEventResponse = {
    source?: {
        issue?: TimelineIssueResponse | null;
    } | null;
};
type RepoIssueClient = {
    rest: {
        issues: {
            listForRepo(params: Record<string, unknown>): Promise<{
                data: RepoIssueResponse[];
            }>;
            listEventsForTimeline(params: Record<string, unknown>): Promise<{
                data: TimelineEventResponse[];
            }>;
        };
    };
};
type SearchIssueClient = {
    rest: {
        issues: {
            listEventsForTimeline(params: Record<string, unknown>): Promise<{
                data: TimelineEventResponse[];
            }>;
        };
        search: {
            issuesAndPullRequests(params: Record<string, unknown>): Promise<{
                data: {
                    items: SearchIssueResponse[];
                };
            }>;
        };
    };
};
export declare function createOctokitFromEnv(): Octokit;
export declare function fetchRepoIssues(client: RepoIssueClient, repository: string, options: FetchOptions): Promise<ScoutIssue[]>;
export declare function searchIssues(client: SearchIssueClient, query: string, options: FetchOptions): Promise<ScoutIssue[]>;
export {};
