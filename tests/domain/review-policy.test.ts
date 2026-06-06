import { describe, expect, it } from "vitest";

import { parseLocalDate } from "../../src/domain/dates";
import { calculateNextDueDate } from "../../src/domain/review-policy";

describe("review policy", () => {
  it.each([
    [0, "2026-06-06"],
    [1, "2026-06-08"],
    [2, "2026-06-12"],
    [3, "2026-06-19"],
    [4, "2026-07-05"],
    [5, "2026-08-04"],
    [6, "2026-10-03"],
    [7, "2026-12-02"],
    [8, "2027-03-02"],
    [9, "2027-06-05"],
  ])("calculates the next due date for score %i", (score, expected) => {
    expect(calculateNextDueDate(parseLocalDate("2026-06-05"), score)).toBe(
      expected,
    );
  });

  it("rejects an invalid score before calculating a date", () => {
    expect(() =>
      calculateNextDueDate(parseLocalDate("2026-06-05"), -1),
    ).toThrow(RangeError);
  });
});
