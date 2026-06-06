import { describe, expect, it } from "vitest";

import {
  getReviewIntervalDays,
  isReviewScore,
  parseReviewScore,
  REVIEW_INTERVAL_DAYS,
  type ReviewScore,
} from "../../src/domain/review-score";

describe("review scores", () => {
  it("maps every valid score to the agreed interval", () => {
    expect(REVIEW_INTERVAL_DAYS).toEqual({
      0: 1,
      1: 3,
      2: 7,
      3: 14,
      4: 30,
      5: 60,
      6: 120,
      7: 180,
      8: 270,
      9: 365,
    });
  });

  it.each([
    [0, 1],
    [1, 3],
    [2, 7],
    [3, 14],
    [4, 30],
    [5, 60],
    [6, 120],
    [7, 180],
    [8, 270],
    [9, 365],
  ] as const)("maps score %i to %i days", (score, intervalDays) => {
    expect(getReviewIntervalDays(score)).toBe(intervalDays);
  });

  it.each([0, 1, 5, 9])("accepts valid score %i", (value) => {
    expect(isReviewScore(value)).toBe(true);
    expect(parseReviewScore(value)).toBe(value as ReviewScore);
  });

  it.each([-1, 10, 1.5, Number.NaN, "4", null, undefined])(
    "rejects invalid score %s",
    (value) => {
      expect(isReviewScore(value)).toBe(false);
      expect(() => parseReviewScore(value as number)).toThrow(RangeError);
    },
  );
});
