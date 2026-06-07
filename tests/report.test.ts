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

const mixedRanked: RankedIssue[] = [
  ...ranked,
  {
    issue: {
      number: 11,
      title: "Document setup",
      url: "https://github.com/acme/widgets/issues/11",
      repository: "acme/widgets",
      state: "open",
      labels: ["docs", "good first issue"],
      comments: 1,
      assignees: [],
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      body: "Setup steps need examples.",
      linkedPullRequests: []
    },
    score: 64,
    riskLevel: "medium",
    signals: [{ key: "labels", label: "Useful labels", weight: 18 }]
  },
  {
    issue: {
      number: 19,
      title: "Old flaky test issue",
      url: "https://github.com/acme/widgets/issues/19",
      repository: "acme/widgets",
      state: "open",
      labels: ["tests"],
      comments: 9,
      assignees: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
      body: "Needs investigation.",
      linkedPullRequests: []
    },
    score: 20,
    riskLevel: "high",
    signals: [{ key: "stale", label: "Stale activity", weight: -24 }]
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

  it("renders markdown summary data for non-empty reports", () => {
    const report = formatMarkdownReport(mixedRanked);

    expect(report).toContain("## Summary");
    expect(report).toContain("- Issues: 3");
    expect(report).toContain("- Average score: 57");
    expect(report).toContain("- Risk counts: low 1, medium 1, high 1");
    expect(report).toContain("- Top labels: good first issue (2), docs (1), tests (1)");
  });

  it("renders markdown summary data for empty reports", () => {
    const report = formatMarkdownReport([]);

    expect(report).toContain("- Issues: 0");
    expect(report).toContain("- Average score: 0");
    expect(report).toContain("- Risk counts: low 0, medium 0, high 0");
    expect(report).toContain("- Top labels: -");
  });

  it("renders stable JSON for machine consumers", () => {
    const report = JSON.parse(formatJsonReport(ranked));

    expect(report.generatedBy).toBe("oss-scout");
    expect(report.issues[0].score).toBe(86);
    expect(report.issues[0].repository).toBe("acme/widgets");
  });

  it("renders JSON summary data for non-empty reports", () => {
    const report = JSON.parse(formatJsonReport(mixedRanked));

    expect(report.summary).toEqual({
      count: 3,
      averageScore: 57,
      riskCounts: {
        low: 1,
        medium: 1,
        high: 1
      },
      topLabels: [
        { label: "good first issue", count: 2 },
        { label: "docs", count: 1 },
        { label: "tests", count: 1 }
      ]
    });
  });

  it("renders JSON summary data for empty reports", () => {
    const report = JSON.parse(formatJsonReport([]));

    expect(report.summary).toEqual({
      count: 0,
      averageScore: 0,
      riskCounts: {
        low: 0,
        medium: 0,
        high: 0
      },
      topLabels: []
    });
  });
});
