import type { RankedIssue } from "../core/types.js";
export type ReportOptions = {
    title?: string;
};
export declare function formatMarkdownReport(issues: RankedIssue[], options?: ReportOptions): string;
export declare function formatJsonReport(issues: RankedIssue[]): string;
