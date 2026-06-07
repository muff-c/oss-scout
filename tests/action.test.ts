import { describe, expect, it, vi } from "vitest";

import { runAction } from "../src/action/run.js";

describe("GitHub Action", () => {
  it("writes a markdown job summary for repo input", async () => {
    const addRaw = vi.fn().mockReturnThis();
    const write = vi.fn().mockResolvedValue(undefined);
    const core = {
      getInput: vi.fn((name: string) => {
        const values: Record<string, string> = { repo: "acme/widgets", limit: "5" };
        return values[name] ?? "";
      }),
      setOutput: vi.fn(),
      setFailed: vi.fn(),
      summary: { addRaw, write }
    };

    await runAction({
      core,
      createOctokit: vi.fn(),
      fetchRepoIssues: vi.fn().mockResolvedValue([]),
      searchIssues: vi.fn()
    });

    expect(core.setOutput).toHaveBeenCalledWith("issue-count", "0");
    expect(addRaw.mock.calls[0][0]).toContain("# oss-scout report");
    expect(write).toHaveBeenCalled();
  });
});
