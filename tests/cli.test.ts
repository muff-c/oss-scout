import { describe, expect, it, vi } from "vitest";

import { runCli } from "../src/cli/run.js";

describe("CLI", () => {
  it("prints markdown for repo scans", async () => {
    const write = vi.fn();
    const fetchRepoIssues = vi.fn().mockResolvedValue([
      {
        number: 1,
        title: "Add docs",
        url: "https://github.com/acme/widgets/issues/1",
        repository: "acme/widgets",
        state: "open",
        labels: ["help wanted"],
        comments: 1,
        assignees: [],
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-06T00:00:00.000Z",
        body: "Acceptance criteria: include setup docs.",
        linkedPullRequests: []
      }
    ]);

    await runCli(["repo", "acme/widgets", "--markdown"], {
      write,
      fetchRepoIssues,
      searchIssues: vi.fn(),
      createOctokit: vi.fn(() => ({}))
    });

    expect(fetchRepoIssues).toHaveBeenCalledWith(expect.anything(), "acme/widgets", { limit: 30 });
    expect(write.mock.calls[0][0]).toContain("# oss-scout report");
    expect(write.mock.calls[0][0]).toContain("acme/widgets#1");
  });

  it("prints json for search scans", async () => {
    const write = vi.fn();
    const searchIssues = vi.fn().mockResolvedValue([]);

    await runCli(["search", "label:help-wanted", "--json", "--limit", "3"], {
      write,
      fetchRepoIssues: vi.fn(),
      searchIssues,
      createOctokit: vi.fn(() => ({}))
    });

    expect(searchIssues).toHaveBeenCalledWith(expect.anything(), "label:help-wanted", { limit: 3 });
    expect(JSON.parse(write.mock.calls[0][0])).toMatchObject({ generatedBy: "oss-scout", issues: [] });
  });

  it("uses custom scoring weights from JSON", async () => {
    const write = vi.fn();
    const fetchRepoIssues = vi.fn().mockResolvedValue([
      {
        number: 1,
        title: "Add docs",
        url: "https://github.com/acme/widgets/issues/1",
        repository: "acme/widgets",
        state: "open",
        labels: ["help wanted"],
        comments: 1,
        assignees: [],
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-06T00:00:00.000Z",
        body: "Acceptance criteria: include setup docs.",
        linkedPullRequests: []
      }
    ]);

    await runCli(["repo", "acme/widgets", "--json", "--weights", "{\"welcoming-labels\":4}"], {
      write,
      fetchRepoIssues,
      searchIssues: vi.fn(),
      createOctokit: vi.fn(() => ({}))
    });

    const report = JSON.parse(write.mock.calls[0][0]);
    expect(report.issues[0].score).toBe(78);
    expect(report.issues[0].signals).toContainEqual(expect.objectContaining({ key: "welcoming-labels", weight: 4 }));
  });
});
