import { describe, expect, it, vi } from "vitest";

import { fetchRepoIssues, searchIssues } from "../src/github/client.js";

describe("GitHub adapter", () => {
  it("maps repository issues from Octokit into ScoutIssue records", async () => {
    const octokit = {
      rest: {
        issues: {
          listForRepo: vi.fn().mockResolvedValue({
            data: [
              {
                number: 3,
                title: "Improve install docs",
                html_url: "https://github.com/acme/widgets/issues/3",
                state: "open",
                labels: [{ name: "help wanted" }],
                comments: 2,
                assignees: [],
                created_at: "2026-06-01T00:00:00Z",
                updated_at: "2026-06-06T00:00:00Z",
                body: "Acceptance criteria: document npm install.",
                pull_request: undefined
              }
            ]
          }),
          listEventsForTimeline: vi.fn().mockResolvedValue({ data: [] })
        }
      }
    };

    const issues = await fetchRepoIssues(octokit, "acme/widgets", { limit: 10 });

    expect(octokit.rest.issues.listForRepo).toHaveBeenCalledWith(
      expect.objectContaining({ owner: "acme", repo: "widgets", state: "open", per_page: 10 })
    );
    expect(octokit.rest.issues.listEventsForTimeline).toHaveBeenCalledWith(
      expect.objectContaining({ owner: "acme", repo: "widgets", issue_number: 3 })
    );
    expect(issues[0]).toMatchObject({
      number: 3,
      repository: "acme/widgets",
      labels: ["help wanted"]
    });
  });

  it("maps open pull requests from issue timeline cross-references", async () => {
    const octokit = {
      rest: {
        issues: {
          listForRepo: vi.fn().mockResolvedValue({
            data: [
              {
                number: 3,
                title: "Improve install docs",
                html_url: "https://github.com/acme/widgets/issues/3",
                state: "open",
                labels: [],
                comments: 2,
                assignees: [],
                created_at: "2026-06-01T00:00:00Z",
                updated_at: "2026-06-06T00:00:00Z",
                body: "",
                pull_request: undefined
              }
            ]
          }),
          listEventsForTimeline: vi.fn().mockResolvedValue({
            data: [
              {
                event: "cross-referenced",
                source: {
                  issue: {
                    html_url: "https://github.com/acme/widgets/pull/41",
                    state: "open",
                    pull_request: {}
                  }
                }
              }
            ]
          })
        }
      }
    };

    const issues = await fetchRepoIssues(octokit, "acme/widgets", { limit: 10 });

    expect(issues[0].linkedPullRequests).toEqual([{ url: "https://github.com/acme/widgets/pull/41", state: "open" }]);
  });

  it("maps search results and keeps source repository names", async () => {
    const octokit = {
      rest: {
        issues: {
          listEventsForTimeline: vi.fn().mockResolvedValue({ data: [] })
        },
        search: {
          issuesAndPullRequests: vi.fn().mockResolvedValue({
            data: {
              items: [
                {
                  number: 11,
                  title: "Fix flaky test",
                  html_url: "https://github.com/acme/widgets/issues/11",
                  repository_url: "https://api.github.com/repos/acme/widgets",
                  state: "open",
                  labels: [{ name: "good first issue" }],
                  comments: 0,
                  assignees: [],
                  created_at: "2026-06-01T00:00:00Z",
                  updated_at: "2026-06-06T00:00:00Z",
                  body: "Acceptance criteria: regression test passes."
                }
              ]
            }
          })
        }
      }
    };

    const issues = await searchIssues(octokit, "label:good-first-issue", { limit: 5 });

    expect(octokit.rest.search.issuesAndPullRequests).toHaveBeenCalledWith(
      expect.objectContaining({ q: "label:good-first-issue is:issue is:open", per_page: 5 })
    );
    expect(issues[0].repository).toBe("acme/widgets");
    expect(issues[0].linkedPullRequests).toEqual([]);
  });
});
