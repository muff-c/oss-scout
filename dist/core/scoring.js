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
    const signals = [scoreSignal("base", "Open issue baseline", 50, options)];
    if (labels.some((label) => welcomingLabels.has(label))) {
        signals.push(scoreSignal("welcoming-labels", "Welcoming contributor labels", 18, options));
    }
    if (labels.some((label) => bountyLabels.has(label)) || /\b(bounty|algora|opire|reward|\$\d+)\b/i.test(issue.body)) {
        signals.push(scoreSignal("bounty-signal", "Bounty or reward signal", 10, options));
    }
    const updatedAgeDays = ageInDays(issue.updatedAt, now);
    if (updatedAgeDays <= 14) {
        signals.push(scoreSignal("fresh", "Fresh activity", 12, options));
    }
    else if (updatedAgeDays >= 90) {
        signals.push(scoreSignal("stale", "Stale activity risk", -24, options));
    }
    if (hasAcceptanceCriteria(body)) {
        signals.push(scoreSignal("clear-acceptance", "Clear acceptance criteria", 12, options));
    }
    if (issue.comments === 0) {
        signals.push(scoreSignal("quiet-thread", "Low thread noise", 6, options));
    }
    else if (issue.comments > 12) {
        signals.push(scoreSignal("crowded-thread", "Crowded discussion", -14, options));
    }
    if (issue.assignees.length > 0) {
        signals.push(scoreSignal("assigned", "Already assigned", -14, options));
    }
    const openPullRequests = issue.linkedPullRequests.filter((pullRequest) => pullRequest.state === "open");
    if (openPullRequests.length > 0) {
        signals.push(scoreSignal("competing-pr", "Open competing pull request", -18, options));
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
function scoreSignal(key, label, defaultWeight, options) {
    return {
        key,
        label,
        weight: options.weights?.[key] ?? defaultWeight
    };
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