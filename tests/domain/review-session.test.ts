import { describe, expect, it } from "vitest";

import {
  createDryRunReviewSession,
  endReviewSession,
  getCurrentTune,
  scoreCurrentTune,
  skipCurrentTune,
  summarizeDryRunSession,
} from "../../src/domain/review-session";
import type { Tune } from "../../src/domain/tune";

describe("dry-run review session", () => {
  it("starts at the first tune while preserving the full queue", () => {
    const queue = [tune("one"), tune("two")];
    const session = createDryRunReviewSession(queue);

    expect(session.status).toBe("active");
    expect(getCurrentTune(session)).toBe(queue[0]);
    expect(session.items.map(({ tune: itemTune }) => itemTune)).toEqual(queue);
    expect(session.items.every(({ outcome }) => outcome.type === "pending")).toBe(
      true,
    );
  });

  it("completes an empty queue immediately", () => {
    const session = createDryRunReviewSession([]);

    expect(session.status).toBe("completed");
    expect(getCurrentTune(session)).toBeUndefined();
  });

  it("records a score and advances without changing the tune metadata", () => {
    const originalTune = tune("one");
    const session = scoreCurrentTune(
      createDryRunReviewSession([originalTune, tune("two")]),
      9,
    );

    expect(session.items[0]?.outcome).toEqual({ score: 9, type: "scored" });
    expect(getCurrentTune(session)?.id).toBe("two");
    expect(originalTune.review.state).toBeUndefined();
  });

  it("rejects an invalid score before advancing", () => {
    const session = createDryRunReviewSession([tune("one")]);
    expect(() => scoreCurrentTune(session, 10)).toThrow(RangeError);
    expect(getCurrentTune(session)?.id).toBe("one");
  });

  it("skips a tune without changing it and advances", () => {
    const originalTune = tune("one");
    const session = skipCurrentTune(
      createDryRunReviewSession([originalTune, tune("two")]),
    );

    expect(session.items[0]?.outcome).toEqual({ type: "skipped" });
    expect(getCurrentTune(session)?.id).toBe("two");
    expect(originalTune.review.state).toBeUndefined();
  });

  it("completes after the final tune is handled", () => {
    const session = scoreCurrentTune(
      skipCurrentTune(createDryRunReviewSession([tune("one"), tune("two")])),
      0,
    );

    expect(session.status).toBe("completed");
    expect(getCurrentTune(session)).toBeUndefined();
  });

  it("ends early leaving pending tunes unreviewed", () => {
    const session = endReviewSession(
      scoreCurrentTune(
        createDryRunReviewSession([tune("one"), tune("two"), tune("three")]),
        5,
      ),
    );

    expect(session.status).toBe("ended");
    expect(getCurrentTune(session)).toBeUndefined();
    expect(session.items[1]?.outcome.type).toBe("pending");
    expect(session.items[2]?.outcome.type).toBe("pending");
  });

  it("does not allow scoring or skipping after completion", () => {
    const completed = scoreCurrentTune(createDryRunReviewSession([tune("one")]), 1);

    expect(() => scoreCurrentTune(completed, 1)).toThrow(
      "Review session is not active.",
    );
    expect(() => skipCurrentTune(completed)).toThrow(
      "Review session is not active.",
    );
    expect(endReviewSession(completed)).toBe(completed);
  });

  it("creates a dry-run recap that explicitly confirms no writes", () => {
    const session = endReviewSession(
      skipCurrentTune(
        scoreCurrentTune(
          createDryRunReviewSession([tune("one"), tune("two"), tune("three")]),
          4,
        ),
      ),
    );

    expect(summarizeDryRunSession(session)).toEqual({
      message: "Dry run complete. No tune metadata was changed.",
      scored: 1,
      skipped: 1,
      total: 3,
      unreviewed: 1,
    });
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
