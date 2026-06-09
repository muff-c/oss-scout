import { describe, expect, it } from "vitest";

import { scoreIssue } from "../src/core/scoring.js";
import type { ScoutIssue } from "../src/core/types.js";

const baseIssue: ScoutIssue = {
  number: 42,
  title: "Document setup for new contributors",
  url: "https://github.com/acme/widgets/issues/42",
  repository: "acme/widgets",
  state: "open",
  labels: [],
  comments: 1,
  assignees: [],
  createdAt: "2026-06-01T10:00:00.000Z",
  updatedAt: "2026-06-06T10:00:00.000Z",
  body: "Add setup steps and acceptance criteria for Windows users.",
  linkedPullRequests: []
};

describe("scoreIssue", () => {
  it("rewards fresh good-first issues with clear acceptance criteria", () => {
    const result = scoreIssue(
      {
        ...baseIssue,
        labels: ["good first issue", "help wanted"],
        body: "Acceptance criteria: docs include install, test, and troubleshooting steps."
      },
      { now: new Date("2026-06-07T10:00:00.000Z") }
    );

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.signals).toContainEqual(expect.objectContaining({ key: "welcoming-labels" }));
    expect(result.signals).toContainEqual(expect.objectContaining({ key: "clear-acceptance" }));
    expect(result.riskLevel).toBe("low");
  });

  it("penalizes stale crowded assigned issues with competing pull requests", () => {
    const result = scoreIssue(
      {
        ...baseIssue,
        labels: ["good first issue"],
        comments: 18,
        assignees: ["octo-dev"],
        updatedAt: "2025-11-01T10:00:00.000Z",
        linkedPullRequests: [{ url: "https://github.com/acme/widgets/pull/99", state: "open" }]
      },
      { now: new Date("2026-06-07T10:00:00.000Z") }
    );

    expect(result.score).toBeLessThan(45);
    expect(result.riskLevel).toBe("high");
    expect(result.signals).toContainEqual(expect.objectContaining({ key: "stale" }));
    expect(result.signals).toContainEqual(expect.objectContaining({ key: "competing-pr" }));
  });

  it("detects bounty signals from labels and issue text", () => {
    const result = scoreIssue(
      {
        ...baseIssue,
        labels: ["algora", "bounty"],
        body: "Bounty: $150 via Algora for a tested fix."
      },
      { now: new Date("2026-06-07T10:00:00.000Z") }
    );

    expect(result.signals).toContainEqual(expect.objectContaining({ key: "bounty-signal" }));
    expect(result.score).toBeGreaterThan(65);
  });

  it("uses custom positive scoring weights", () => {
    const result = scoreIssue(
      {
        ...baseIssue,
        labels: ["help wanted"],
        body: "Needs clearer setup docs."
      },
      {
        now: new Date("2026-06-07T10:00:00.000Z"),
        weights: { "welcoming-labels": 4 }
      }
    );

    expect(result.score).toBe(66);
    expect(result.signals).toContainEqual(expect.objectContaining({ key: "welcoming-labels", weight: 4 }));
  });

  it("uses custom negative scoring weights", () => {
    const result = scoreIssue(
      {
        ...baseIssue,
        linkedPullRequests: [{ url: "https://github.com/acme/widgets/pull/99", state: "open" }]
      },
      {
        now: new Date("2026-06-07T10:00:00.000Z"),
        weights: { "competing-pr": -35 }
      }
    );

    expect(result.score).toBe(39);
    expect(result.signals).toContainEqual(expect.objectContaining({ key: "competing-pr", weight: -35 }));
  });
});
