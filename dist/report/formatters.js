export function formatMarkdownReport(issues, options = {}) {
    const title = options.title ?? "oss-scout report";
    const summary = buildReportSummary(issues);
    const topLabels = summary.topLabels.length > 0
        ? summary.topLabels.map((label) => `${label.label} (${label.count})`).join(", ")
        : "-";
    const lines = [
        `# ${title}`,
        "",
        `Generated ${new Date().toISOString()} by oss-scout.`,
        "",
        "## Summary",
        "",
        `- Issues: ${summary.count}`,
        `- Average score: ${summary.averageScore}`,
        `- Risk counts: low ${summary.riskCounts.low}, medium ${summary.riskCounts.medium}, high ${summary.riskCounts.high}`,
        `- Top labels: ${topLabels}`,
        "",
        "| Score | Risk | Issue | Labels | Signals |",
        "| ---: | --- | --- | --- | --- |"
    ];
    for (const ranked of issues) {
        const labels = ranked.issue.labels.length > 0 ? ranked.issue.labels.join(", ") : "-";
        const signals = ranked.signals
            .filter((signal) => signal.key !== "base")
            .map((signal) => `${signal.label} (${formatWeight(signal.weight)})`)
            .join("; ");
        lines.push(`| ${ranked.score} | ${ranked.riskLevel} | [${ranked.issue.repository}#${ranked.issue.number}](${ranked.issue.url}) ${escapePipe(ranked.issue.title)} | ${escapePipe(labels)} | ${escapePipe(signals || "Baseline only")} |`);
    }
    if (issues.length === 0) {
        lines.push("| - | - | No matching open issues found | - | - |");
    }
    return `${lines.join("\n")}\n`;
}
export function formatJsonReport(issues) {
    return `${JSON.stringify({
        generatedBy: "oss-scout",
        generatedAt: new Date().toISOString(),
        summary: buildReportSummary(issues),
        issues: issues.map((ranked) => ({
            repository: ranked.issue.repository,
            number: ranked.issue.number,
            title: ranked.issue.title,
            url: ranked.issue.url,
            score: ranked.score,
            riskLevel: ranked.riskLevel,
            labels: ranked.issue.labels,
            signals: ranked.signals
        }))
    }, null, 2)}\n`;
}
function buildReportSummary(issues) {
    const riskCounts = {
        low: 0,
        medium: 0,
        high: 0
    };
    const labelCounts = new Map();
    for (const ranked of issues) {
        riskCounts[ranked.riskLevel] += 1;
        for (const label of ranked.issue.labels) {
            labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
        }
    }
    const averageScore = issues.length === 0
        ? 0
        : Math.round(issues.reduce((total, ranked) => total + ranked.score, 0) / issues.length);
    const topLabels = [...labelCounts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
        .slice(0, 5);
    return {
        count: issues.length,
        averageScore,
        riskCounts,
        topLabels
    };
}
function formatWeight(weight) {
    return weight > 0 ? `+${weight}` : String(weight);
}
function escapePipe(value) {
    return value.replaceAll("|", "\\|");
}
//# sourceMappingURL=formatters.js.map