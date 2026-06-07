import type { RankedIssue, ScoreOptions, ScoutIssue } from "./types.js";
export declare function scoreIssue(issue: ScoutIssue, options?: ScoreOptions): RankedIssue;
export declare function rankIssues(issues: ScoutIssue[], options?: ScoreOptions): RankedIssue[];
