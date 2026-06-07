import { describe, expect, it } from "vitest";

import { formatJsonReport, formatMarkdownReport } from "../src/report/formatters.js";
import type { RankedIssue } from "../src/core/types.js";

const ranked: RankedIssue[] = [
  {
    issue: {
      number: 7,
      title: "Add CLI examples",
      url: "https://github.com/acme/widgets/issues/7",
      repository: "acme/widgets",
      state: "open",
      labels: ["good first issue"],
      comments: 2,
      assignees: [],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z",
      body: "Acceptance criteria included.",
      linkedPullRequests: []
    },
    score: 86,
    riskLevel: "low",
    signals: [{ key: "fresh", label: "Fresh activity", weight: 12 }]
  }
];

describe("report formatters", () => {
  it("renders markdown with score, risk, labels, and links", () => {
    const report = formatMarkdownReport(ranked, { title: "OSS Scout Report" });

    expect(report).toContain("# OSS Scout Report");
    expect(report).toContain("| Score | Risk | Issue | Labels | Signals |");
    expect(report).toContain("86");
    expect(report).toContain("[acme/widgets#7]");
    expect(report).toContain("good first issue");
    expect(report).toContain("Fresh activity");
  });

  it("renders stable JSON for machine consumers", () => {
    const report = JSON.parse(formatJsonReport(ranked));

    expect(report.generatedBy).toBe("oss-scout");
    expect(report.issues[0].score).toBe(86);
    expect(report.issues[0].repository).toBe("acme/widgets");
  });
});
