import type { FetchOptions, ScoutIssue } from "../core/types.js";
type Dependencies = {
    write: (text: string) => void;
    createOctokit: () => unknown;
    fetchRepoIssues: (client: unknown, repository: string, options: FetchOptions) => Promise<ScoutIssue[]>;
    searchIssues: (client: unknown, query: string, options: FetchOptions) => Promise<ScoutIssue[]>;
};
export declare function runCli(argv: string[], dependencies?: Partial<Dependencies>): Promise<void>;
export declare function formatCliError(error: unknown): string;
export {};
