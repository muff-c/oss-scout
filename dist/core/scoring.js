const DAY_MS = 24 * 60 * 60 * 1000;
const welcomingLabels = new Set([
    "good first issue",
    "good-first-issue",
    "help wanted",
    "help-wanted",
    "starter",
    "beginner friendly",
    "beginner-friendly"
]);
const bountyLabels = new Set(["bounty", "algora", "opire", "paid", "reward"]);
export function scoreIssue(issue, options = {}) {
    const now = options.now ?? new Date();
    const labels = issue.labels.map((label) => label.toLowerCase());
    const body = issue.body.toLowerCase();
    const signals = [{ key: "base", label: "Open issue baseline", weight: 50 }];
    if (labels.some((label) => welcomingLabels.has(label))) {
        signals.push({ key: "welcoming-labels", label: "Welcoming contributor labels", weight: 18 });
    }
    if (labels.some((label) => bountyLabels.has(label)) || /\b(bounty|algora|opire|reward|\$\d+)\b/i.test(issue.body)) {
        signals.push({ key: "bounty-signal", label: "Bounty or reward signal", weight: 10 });
    }
    const updatedAgeDays = ageInDays(issue.updatedAt, now);
    if (updatedAgeDays <= 14) {
        signals.push({ key: "fresh", label: "Fresh activity", weight: 12 });
    }
    else if (updatedAgeDays >= 90) {
        signals.push({ key: "stale", label: "Stale activity risk", weight: -24 });
    }
    if (hasAcceptanceCriteria(body)) {
        signals.push({ key: "clear-acceptance", label: "Clear acceptance criteria", weight: 12 });
    }
    if (issue.comments === 0) {
        signals.push({ key: "quiet-thread", label: "Low thread noise", weight: 6 });
    }
    else if (issue.comments > 12) {
        signals.push({ key: "crowded-thread", label: "Crowded discussion", weight: -14 });
    }
    if (issue.assignees.length > 0) {
        signals.push({ key: "assigned", label: "Already assigned", weight: -14 });
    }
    const openPullRequests = issue.linkedPullRequests.filter((pullRequest) => pullRequest.state === "open");
    if (openPullRequests.length > 0) {
        signals.push({ key: "competing-pr", label: "Open competing pull request", weight: -18 });
    }
    const score = clampScore(signals.reduce((total, signal) => total + signal.weight, 0));
    return {
        issue,
        score,
        riskLevel: riskLevelFor(score, signals),
        signals
    };
}
export function rankIssues(issues, options = {}) {
    return issues
        .map((issue) => scoreIssue(issue, options))
        .sort((left, right) => right.score - left.score || newestFirst(left.issue.updatedAt, right.issue.updatedAt));
}
function hasAcceptanceCriteria(body) {
    return /acceptance criteria|expected behavior|done when|steps to reproduce|reproducible|requirements/.test(body);
}
function ageInDays(isoDate, now) {
    const timestamp = Date.parse(isoDate);
    if (Number.isNaN(timestamp)) {
        return Number.POSITIVE_INFINITY;
    }
    return Math.floor((now.getTime() - timestamp) / DAY_MS);
}
function clampScore(score) {
    return Math.max(0, Math.min(100, score));
}
function riskLevelFor(score, signals) {
    if (score >= 75 && !signals.some((signal) => signal.weight <= -18)) {
        return "low";
    }
    if (score < 45 || signals.some((signal) => signal.key === "competing-pr" || signal.key === "stale")) {
        return "high";
    }
    return "medium";
}
function newestFirst(leftUpdatedAt, rightUpdatedAt) {
    return Date.parse(rightUpdatedAt) - Date.parse(leftUpdatedAt);
}
//# sourceMappingURL=scoring.js.map