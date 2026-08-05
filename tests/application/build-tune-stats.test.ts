import { describe, expect, it } from "vitest";

import { buildTuneStats } from "../../src/application/build-tune-stats";
import { parseLocalDate } from "../../src/domain/dates";
import { createReviewState } from "../../src/domain/review-state";
import type { Tune } from "../../src/domain/tune";

describe("build tune stats", () => {
  it("loads tunes from the repository and uses the injected clock", async () => {
    const repository = {
      getTunes: async () =>
        Promise.resolve([
          tune("due", createReviewState(parseLocalDate("2026-01-14"), 0)),
        ]),
    };
    const clock = {
      today: () => parseLocalDate("2026-01-15"),
    };

    const result = await buildTuneStats(repository, clock);

    expect(result.dueTodayTunes).toBe(1);
    expect(result.totalTuneNotes).toBe(1);
  });
});

function tune(title: string, state: Tune["review"]["state"]): Tune {
  return {
    keys: [],
    path: `Tunes/Tunes/${title}.md`,
    review: {
      excludedFromReview: false,
      sessionMaintained: false,
      state,
    },
    title,
  };
}
