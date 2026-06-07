import type { FetchOptions, ScoutIssue } from "../core/types.js";
type ActionCore = {
    getInput: (name: string, options?: {
        required?: boolean;
    }) => string;
    setOutput: (name: string, value: string) => void;
    setFailed: (message: string) => void;
    summary: {
        addRaw: (text: string) => {
            write: () => Promise<unknown>;
        };
        write: () => Promise<unknown>;
    };
};
type ActionDependencies = {
    core: ActionCore;
    createOctokit: () => unknown;
    fetchRepoIssues: (client: unknown, repository: string, options: FetchOptions) => Promise<ScoutIssue[]>;
    searchIssues: (client: unknown, query: string, options: FetchOptions) => Promise<ScoutIssue[]>;
};
export declare function runAction(dependencies?: Partial<ActionDependencies>): Promise<void>;
export {};
