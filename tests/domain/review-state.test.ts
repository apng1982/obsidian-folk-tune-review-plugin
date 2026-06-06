import { describe, expect, it } from "vitest";

import { parseLocalDate } from "../../src/domain/dates";
import { createReviewState } from "../../src/domain/review-state";

describe("review state", () => {
  it("creates the latest review state from the supplied date and score", () => {
    expect(createReviewState(parseLocalDate("2026-06-05"), 9)).toEqual({
      intervalDays: 365,
      lastReviewed: "2026-06-05",
      nextDue: "2027-06-05",
      score: 9,
    });
  });

  it("maps score zero to a next-due date one day later", () => {
    expect(createReviewState(parseLocalDate("2026-12-31"), 0)).toEqual({
      intervalDays: 1,
      lastReviewed: "2026-12-31",
      nextDue: "2027-01-01",
      score: 0,
    });
  });

  it("rejects an invalid score before creating state", () => {
    expect(() => createReviewState(parseLocalDate("2026-06-05"), 10)).toThrow(
      RangeError,
    );
  });
});
