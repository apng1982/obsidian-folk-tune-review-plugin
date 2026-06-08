import { describe, expect, it, vi } from "vitest";

import { parseLocalDate } from "../../src/domain/dates";
import { createReviewState } from "../../src/domain/review-state";
import type { Tune } from "../../src/domain/tune";
import { ObsidianReviewWriter } from "../../src/obsidian/obsidian-review-writer";

describe("Obsidian review writer", () => {
  it("writes through processFrontMatter using the tune path", async () => {
    const file = { path: "Tunes/Tunes/one.md" };
    const frontmatter: Record<string, unknown> = { id: "one" };
    const processFrontMatter = vi.fn(
      (_file: unknown, mutate: (value: Record<string, unknown>) => void) => {
        mutate(frontmatter);
        return Promise.resolve();
      },
    );
    const app = {
      fileManager: { processFrontMatter },
      vault: { getFileByPath: vi.fn().mockReturnValue(file) },
    };
    const writer = new ObsidianReviewWriter(app as never);

    await writer.writeReview(
      tune("one"),
      createReviewState(parseLocalDate("2026-06-08"), 9),
    );

    expect(app.vault.getFileByPath).toHaveBeenCalledWith("Tunes/Tunes/one.md");
    expect(processFrontMatter).toHaveBeenCalledWith(file, expect.any(Function));
    expect(frontmatter.review).toMatchObject({
      intervalDays: 365,
      lastReviewed: "2026-06-08",
      nextDue: "2027-06-08",
      score: 9,
    });
  });

  it("reports a missing tune note before attempting a write", async () => {
    const processFrontMatter = vi.fn();
    const writer = new ObsidianReviewWriter({
      fileManager: { processFrontMatter },
      vault: { getFileByPath: () => null },
    } as never);

    await expect(
      writer.writeReview(
        tune("missing"),
        createReviewState(parseLocalDate("2026-06-08"), 9),
      ),
    ).rejects.toThrow("Tune note not found");
    expect(processFrontMatter).not.toHaveBeenCalled();
  });
});

function tune(id: string): Tune {
  return {
    id,
    keys: [],
    path: `Tunes/Tunes/${id}.md`,
    review: {
      excludedFromReview: false,
      sessionMaintained: false,
    },
    title: id,
  };
}
