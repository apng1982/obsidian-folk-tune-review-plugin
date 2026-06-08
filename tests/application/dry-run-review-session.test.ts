import { describe, expect, it } from "vitest";

import { DryRunReviewSession } from "../../src/application/dry-run-review-session";
import { summarizeDryRunSession } from "../../src/domain/review-session";
import type { Tune } from "../../src/domain/tune";

describe("dry-run review session application flow", () => {
  it("scores, skips, and completes without mutating frozen tune metadata", () => {
    const first = frozenTune("one");
    const second = frozenTune("two");
    const dryRun = new DryRunReviewSession([first, second]);

    dryRun.score(9);
    dryRun.skip();

    expect(dryRun.session.status).toBe("completed");
    expect(first.review.state).toBeUndefined();
    expect(second.review.state).toBeUndefined();
  });

  it("ends early and reports unreviewed tunes without writes", () => {
    const dryRun = new DryRunReviewSession([frozenTune("one"), frozenTune("two")]);

    dryRun.score(4);
    dryRun.end();

    expect(summarizeDryRunSession(dryRun.session)).toMatchObject({
      scored: 1,
      skipped: 0,
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

function frozenTune(id: string): Tune {
  const value = tune(id);
  Object.freeze(value.review);
  return Object.freeze(value);
}
