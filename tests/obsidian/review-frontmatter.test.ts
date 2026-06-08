import { describe, expect, it } from "vitest";

import { parseLocalDate } from "../../src/domain/dates";
import { createReviewState } from "../../src/domain/review-state";
import { applyReviewStateToFrontmatter } from "../../src/obsidian/review-frontmatter";

describe("review frontmatter mutation", () => {
  it("adds nested latest review state without changing unrelated frontmatter", () => {
    const frontmatter: Record<string, unknown> = {
      composer: "(trad.)",
      id: "one",
      learn: false,
    };

    applyReviewStateToFrontmatter(
      frontmatter,
      createReviewState(parseLocalDate("2026-06-08"), 9),
    );

    expect(frontmatter).toEqual({
      composer: "(trad.)",
      id: "one",
      learn: false,
      review: {
        intervalDays: 365,
        lastReviewed: "2026-06-08",
        nextDue: "2027-06-08",
        score: 9,
      },
    });
  });

  it("updates latest state while preserving review flags and other fields", () => {
    const frontmatter: Record<string, unknown> = {
      review: {
        excludedFromReview: true,
        intervalDays: 1,
        lastReviewed: "2020-01-01",
        nextDue: "2020-01-02",
        pluginOwnedFutureField: "keep",
        score: 0,
        sessionMaintained: false,
      },
    };

    applyReviewStateToFrontmatter(
      frontmatter,
      createReviewState(parseLocalDate("2026-06-08"), 4),
    );

    expect(frontmatter.review).toEqual({
      excludedFromReview: true,
      intervalDays: 30,
      lastReviewed: "2026-06-08",
      nextDue: "2026-07-08",
      pluginOwnedFutureField: "keep",
      score: 4,
      sessionMaintained: false,
    });
  });

  it("does not create notes, comments, or history fields", () => {
    const frontmatter: Record<string, unknown> = {};

    applyReviewStateToFrontmatter(
      frontmatter,
      createReviewState(parseLocalDate("2026-06-08"), 3),
    );

    expect(frontmatter.review).not.toHaveProperty("notes");
    expect(frontmatter.review).not.toHaveProperty("comments");
    expect(frontmatter.review).not.toHaveProperty("history");
  });

  it("rejects malformed existing review metadata", () => {
    expect(() =>
      applyReviewStateToFrontmatter(
        { review: "invalid" },
        createReviewState(parseLocalDate("2026-06-08"), 3),
      ),
    ).toThrow("Review metadata must be an object.");
  });
});
