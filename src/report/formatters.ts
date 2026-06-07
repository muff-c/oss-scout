import type { RankedIssue } from "../core/types.js";

export type ReportOptions = {
  title?: string;
};

export function formatMarkdownReport(issues: RankedIssue[], options: ReportOptions = {}): string {
  const title = options.title ?? "oss-scout report";
  const lines = [
    `# ${title}`,
    "",
    `Generated ${new Date().toISOString()} by oss-scout.`,
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

    lines.push(
      `| ${ranked.score} | ${ranked.riskLevel} | [${ranked.issue.repository}#${ranked.issue.number}](${ranked.issue.url}) ${escapePipe(
        ranked.issue.title
      )} | ${escapePipe(labels)} | ${escapePipe(signals || "Baseline only")} |`
    );
  }

  if (issues.length === 0) {
    lines.push("| - | - | No matching open issues found | - | - |");
  }

  return `${lines.join("\n")}\n`;
}

export function formatJsonReport(issues: RankedIssue[]): string {
  return `${JSON.stringify(
    {
      generatedBy: "oss-scout",
      generatedAt: new Date().toISOString(),
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
    },
    null,
    2
  )}\n`;
}

function formatWeight(weight: number): string {
  return weight > 0 ? `+${weight}` : String(weight);
}

function escapePipe(value: string): string {
  return value.replaceAll("|", "\\|");
}
