import { describe, expect, it } from "vitest";

import {
  buildCurrentTuneFlagActionModels,
  buildReviewQueueItemModel,
  buildScoreIntervalModels,
} from "../../src/ui/review-queue-model";
import type { Tune } from "../../src/domain/tune";

describe("review queue preview model", () => {
  it("formats useful tune metadata for the queue", () => {
    const tune: Tune = {
      composer: "(trad.)",
      id: "one",
      keys: ["D", "G"],
      origin: "Irish",
      path: "Tunes/Tunes/One.md",
      review: {
        excludedFromReview: false,
        sessionMaintained: false,
      },
      title: "One",
    };

    expect(buildReviewQueueItemModel(tune)).toEqual({
      composer: "(trad.)",
      keys: "D, G",
      origin: "Irish",
      path: "Tunes/Tunes/One.md",
      title: "One",
    });
  });

  it("shows every score with its interval and correct singular wording", () => {
    const intervals = buildScoreIntervalModels();

    expect(intervals).toHaveLength(10);
    expect(intervals[0]).toEqual({
      intervalDays: 1,
      label: "0 (1 day)",
      score: 0,
    });
    expect(intervals[9]).toEqual({
      intervalDays: 365,
      label: "9 (365 days)",
      score: 9,
    });
  });

  it("builds set-flag actions for an unflagged current tune", () => {
    expect(buildCurrentTuneFlagActionModels(tune())).toEqual([
      {
        flag: "excludedFromReview",
        label: "Exclude from reviews",
        value: true,
      },
      {
        flag: "sessionMaintained",
        label: "Mark as session maintained",
        value: true,
      },
    ]);
  });

  it("builds clear-flag actions for a flagged current tune", () => {
    expect(
      buildCurrentTuneFlagActionModels(
        tune({
          excludedFromReview: true,
          sessionMaintained: true,
        }),
      ),
    ).toEqual([
      {
        flag: "excludedFromReview",
        label: "Include in reviews",
        value: false,
      },
      {
        flag: "sessionMaintained",
        label: "Unmark as session maintained",
        value: false,
      },
    ]);
  });
});

function tune(review: Tune["review"] = {
  excludedFromReview: false,
  sessionMaintained: false,
}): Tune {
  return {
    id: "one",
    keys: [],
    path: "Tunes/Tunes/One.md",
    review,
    title: "One",
  };
}
