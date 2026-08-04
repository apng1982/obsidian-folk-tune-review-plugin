import { describe, expect, it } from "vitest";

import {
  createReviewSession,
  endReviewSession,
  excludeCurrentTune,
  getCurrentTune,
  markCurrentTuneSessionMaintained,
  scoreCurrentTune,
  skipCurrentTune,
  summarizeDryRunSession,
  summarizeReviewSession,
} from "../../src/domain/review-session";
import type { Tune } from "../../src/domain/tune";

describe("dry-run review session", () => {
  it("starts at the first tune while preserving the full queue", () => {
    const queue = [tune("one"), tune("two")];
    const session = createReviewSession(queue);

    expect(session.status).toBe("active");
    expect(getCurrentTune(session)).toBe(queue[0]);
    expect(session.items.map(({ tune: itemTune }) => itemTune)).toEqual(queue);
    expect(session.items.every(({ outcome }) => outcome.type === "pending")).toBe(
      true,
    );
  });

  it("completes an empty queue immediately", () => {
    const session = createReviewSession([]);

    expect(session.status).toBe("completed");
    expect(getCurrentTune(session)).toBeUndefined();
  });

  it("records a score and advances without changing the tune metadata", () => {
    const originalTune = tune("one");
    const session = scoreCurrentTune(
      createReviewSession([originalTune, tune("two")]),
      9,
    );

    expect(session.items[0]?.outcome).toEqual({ score: 9, type: "scored" });
    expect(getCurrentTune(session)?.id).toBe("two");
    expect(originalTune.review.state).toBeUndefined();
  });

  it("rejects an invalid score before advancing", () => {
    const session = createReviewSession([tune("one")]);
    expect(() => scoreCurrentTune(session, 10)).toThrow(RangeError);
    expect(getCurrentTune(session)?.id).toBe("one");
  });

  it("skips a tune without changing it and advances", () => {
    const originalTune = tune("one");
    const session = skipCurrentTune(
      createReviewSession([originalTune, tune("two")]),
    );

    expect(session.items[0]?.outcome).toEqual({ type: "skipped" });
    expect(getCurrentTune(session)?.id).toBe("two");
    expect(originalTune.review.state).toBeUndefined();
  });

  it("records excluded tunes without changing them and advances", () => {
    const originalTune = tune("one");
    const session = excludeCurrentTune(
      createReviewSession([originalTune, tune("two")]),
    );

    expect(session.items[0]?.outcome).toEqual({ type: "excluded" });
    expect(getCurrentTune(session)?.id).toBe("two");
    expect(originalTune.review.state).toBeUndefined();
  });

  it("records session-maintained tunes without changing them and advances", () => {
    const originalTune = tune("one");
    const session = markCurrentTuneSessionMaintained(
      createReviewSession([originalTune, tune("two")]),
    );

    expect(session.items[0]?.outcome).toEqual({ type: "session-maintained" });
    expect(getCurrentTune(session)?.id).toBe("two");
    expect(originalTune.review.state).toBeUndefined();
  });

  it("completes after the final tune is handled", () => {
    const session = scoreCurrentTune(
      skipCurrentTune(createReviewSession([tune("one"), tune("two")])),
      0,
    );

    expect(session.status).toBe("completed");
    expect(getCurrentTune(session)).toBeUndefined();
  });

  it("ends early leaving pending tunes unreviewed", () => {
    const session = endReviewSession(
      scoreCurrentTune(
        createReviewSession([tune("one"), tune("two"), tune("three")]),
        5,
      ),
    );

    expect(session.status).toBe("ended");
    expect(getCurrentTune(session)).toBeUndefined();
    expect(session.items[1]?.outcome.type).toBe("pending");
    expect(session.items[2]?.outcome.type).toBe("pending");
  });

  it("does not allow scoring or skipping after completion", () => {
    const completed = scoreCurrentTune(createReviewSession([tune("one")]), 1);

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
          createReviewSession([tune("one"), tune("two"), tune("three")]),
          4,
        ),
      ),
    );

    expect(summarizeDryRunSession(session)).toEqual({
      excluded: 0,
      message: "Dry run complete. No tune metadata was changed.",
      scored: 1,
      sessionMaintained: 0,
      skipped: 1,
      total: 3,
      unreviewed: 1,
    });
  });

  it("counts flagged tunes as handled in the recap", () => {
    const session = endReviewSession(
      markCurrentTuneSessionMaintained(
        excludeCurrentTune(
          scoreCurrentTune(
            createReviewSession([
              tune("one"),
              tune("two"),
              tune("three"),
              tune("four"),
            ]),
            4,
          ),
        ),
      ),
    );

    expect(summarizeReviewSession(session, "live")).toEqual({
      excluded: 1,
      message: "Live review complete. Reviewed tune metadata was saved.",
      scored: 1,
      sessionMaintained: 1,
      skipped: 0,
      total: 4,
      unreviewed: 1,
    });
  });

  it("creates a live recap that confirms reviewed metadata was saved", () => {
    const session = scoreCurrentTune(
      createReviewSession([tune("one")]),
      4,
    );

    expect(summarizeReviewSession(session, "live").message).toBe(
      "Live review complete. Reviewed tune metadata was saved.",
    );
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
