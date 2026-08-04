import { describe, expect, it } from "vitest";

import { parseLocalDate } from "../../src/domain/dates";
import { createReviewState } from "../../src/domain/review-state";
import {
  calculateTuneDueInfo,
  isTuneEligibleForSelection,
  selectTunes,
  type TuneSelectionOptions,
} from "../../src/domain/tune-selection";
import type { Tune } from "../../src/domain/tune";

const today = parseLocalDate("2026-01-01");
const defaultOptions: TuneSelectionOptions = {
  count: 10,
  includeExcluded: false,
  includeSessionMaintained: false,
  randomize: false,
  today,
};

describe("tune due information", () => {
  it("classifies a never-reviewed tune as due", () => {
    expect(calculateTuneDueInfo(tune("1"), today)).toEqual({
      isDue: true,
      neverReviewed: true,
    });
  });

  it("classifies due today as due with zero overdue days", () => {
    expect(
      calculateTuneDueInfo(
        tune("1", { state: createReviewState(parseLocalDate("2025-12-02"), 4) }),
        today,
      ),
    ).toEqual({
      dueDate: "2026-01-01",
      isDue: true,
      neverReviewed: false,
      overdueDays: 0,
    });
  });

  it("calculates signed overdue days", () => {
    expect(
      calculateTuneDueInfo(
        tune("1", { state: createReviewState(parseLocalDate("2025-12-01"), 4) }),
        today,
      ).overdueDays,
    ).toBe(1);

    expect(
      calculateTuneDueInfo(
        tune("2", { state: createReviewState(parseLocalDate("2025-12-31"), 4) }),
        today,
      ).overdueDays,
    ).toBe(-29);
  });
});

describe("tune selection", () => {
  it("prioritizes most overdue, then never reviewed, then non-due tunes", () => {
    const tunes = [
      tune("1", { state: createReviewState(parseLocalDate("2024-01-01"), 4) }, "Very overdue"),
      tune("2", { state: createReviewState(parseLocalDate("2025-12-01"), 2) }, "Slightly overdue"),
      tune("3", {}, "Never reviewed"),
      tune("4", { state: createReviewState(parseLocalDate("2025-02-01"), 9) }, "Non-due older"),
      tune("5", { state: createReviewState(parseLocalDate("2025-12-30"), 9) }, "Non-due recent"),
    ];

    expect(selectTunes(tunes, defaultOptions).map(({ id }) => id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  it("keeps existing priority when never-reviewed prioritisation is false", () => {
    const tunes = [
      tune("due", { state: createReviewState(parseLocalDate("2025-12-01"), 2) }),
      tune("never"),
      tune("not-due", {
        state: createReviewState(parseLocalDate("2025-12-30"), 9),
      }),
    ];

    expect(
      selectTunes(tunes, {
        ...defaultOptions,
        prioritiseNeverReviewed: false,
      }).map(({ id }) => id),
    ).toEqual(["due", "never", "not-due"]);
  });

  it("can prioritize never-reviewed tunes before due tunes", () => {
    const tunes = [
      tune("due", { state: createReviewState(parseLocalDate("2025-12-01"), 2) }),
      tune("never"),
      tune("not-due", {
        state: createReviewState(parseLocalDate("2025-12-30"), 9),
      }),
    ];

    expect(
      selectTunes(tunes, {
        ...defaultOptions,
        prioritiseNeverReviewed: true,
      }).map(({ id }) => id),
    ).toEqual(["never", "due", "not-due"]);
  });

  it("excludes only tunes explicitly marked learn true", () => {
    expect(
      selectTunes(
        [tune("missing"), tune("false", {}, "False", false), tune("true", {}, "True", true)],
        defaultOptions,
      ).map(({ id }) => id),
    ).toEqual(["missing", "false"]);
  });

  it("does not require tune IDs for selection", () => {
    expect(selectTunes([tune(undefined), tune("included")], defaultOptions)).toHaveLength(2);
  });

  it("applies excluded and session-maintained options", () => {
    const tunes = [
      tune("normal"),
      tune("excluded", { excludedFromReview: true }),
      tune("session", { sessionMaintained: true }),
    ];

    expect(selectTunes(tunes, defaultOptions).map(({ id }) => id)).toEqual(["normal"]);
    expect(
      selectTunes(tunes, {
        ...defaultOptions,
        includeExcluded: true,
        includeSessionMaintained: true,
      }).map(({ id }) => id),
    ).toEqual(["normal", "excluded", "session"]);
  });

  it("filters origins case-insensitively using displayed origin text", () => {
    const tunes = [
      { ...tune("irish"), origin: "Irish" },
      { ...tune("scottish"), origin: "Scottish" },
      tune("unknown"),
    ];

    expect(
      selectTunes(tunes, { ...defaultOptions, originFilter: "RISH" }).map(
        ({ id }) => id,
      ),
    ).toEqual(["irish"]);
  });

  it("respects requested count and returns fewer when necessary", () => {
    const tunes = [tune("1"), tune("2")];
    expect(selectTunes(tunes, { ...defaultOptions, count: 1 })).toHaveLength(1);
    expect(selectTunes(tunes, { ...defaultOptions, count: 5 })).toHaveLength(2);
    expect(selectTunes(tunes, { ...defaultOptions, count: 0 })).toEqual([]);
  });

  it.each([-1, 1.5])("rejects invalid requested count %s", (count) => {
    expect(() => selectTunes([], { ...defaultOptions, count })).toThrow(RangeError);
  });

  it("randomizes never-reviewed and non-due groups without randomizing due tunes", () => {
    const tunes = [
      tune("due-1", { state: createReviewState(parseLocalDate("2024-01-01"), 4) }),
      tune("due-2", { state: createReviewState(parseLocalDate("2025-01-01"), 4) }),
      tune("never-1"),
      tune("never-2"),
      tune("non-due-1", { state: createReviewState(parseLocalDate("2025-12-01"), 9) }),
      tune("non-due-2", { state: createReviewState(parseLocalDate("2025-12-02"), 9) }),
    ];
    const randomValues = [0.9, 0.1, 0.8, 0.2];

    expect(
      selectTunes(
        tunes,
        { ...defaultOptions, randomize: true },
        () => randomValues.shift() ?? 0,
      ).map(({ id }) => id),
    ).toEqual(["due-1", "due-2", "never-2", "never-1", "non-due-2", "non-due-1"]);
  });
});

describe("tune selection eligibility", () => {
  it("accepts learned tunes without requiring IDs", () => {
    expect(
      isTuneEligibleForSelection(tune(undefined), {
        includeExcluded: false,
        includeSessionMaintained: false,
      }),
    ).toBe(true);
  });

  it("rejects tunes that default queue selection should not allow", () => {
    const options = {
      includeExcluded: false,
      includeSessionMaintained: false,
    };

    expect(isTuneEligibleForSelection(tune("learning", {}, "Learning", true), options)).toBe(
      false,
    );
    expect(
      isTuneEligibleForSelection(
        tune("excluded", { excludedFromReview: true }),
        options,
      ),
    ).toBe(false);
    expect(
      isTuneEligibleForSelection(
        tune("session", { sessionMaintained: true }),
        options,
      ),
    ).toBe(false);
  });
});

function tune(
  id: string | undefined,
  review: Partial<Tune["review"]> = {},
  title = id ?? "No ID",
  learn?: boolean,
): Tune {
  return {
    id,
    keys: [],
    learn,
    path: `Tunes/Tunes/${title}.md`,
    review: {
      excludedFromReview: false,
      sessionMaintained: false,
      ...review,
    },
    title,
  };
}
