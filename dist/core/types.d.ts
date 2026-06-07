export type IssueState = "open" | "closed";
export type PullRequestReference = {
    url: string;
    state: IssueState;
};
export type ScoutIssue = {
    number: number;
    title: string;
    url: string;
    repository: string;
    state: IssueState;
    labels: string[];
    comments: number;
    assignees: string[];
    createdAt: string;
    updatedAt: string;
    body: string;
    linkedPullRequests: PullRequestReference[];
};
export type ScoreSignal = {
    key: string;
    label: string;
    weight: number;
};
export type RiskLevel = "low" | "medium" | "high";
export type RankedIssue = {
    issue: ScoutIssue;
    score: number;
    riskLevel: RiskLevel;
    signals: ScoreSignal[];
};
export type ScoreOptions = {
    now?: Date;
};
export type FetchOptions = {
    limit: number;
};
