import { describe, expect, it } from "vitest";

import { calculateTuneStats } from "../../src/domain/tune-stats";
import { parseLocalDate } from "../../src/domain/dates";
import { createReviewState } from "../../src/domain/review-state";
import type { Tune } from "../../src/domain/tune";

const today = parseLocalDate("2026-01-15");

describe("tune stats", () => {
  it("returns zero counts for an empty tune list", () => {
    expect(calculateTuneStats([], { today })).toEqual({
      dueTodayTunes: 0,
      eligibleReviewTunes: 0,
      excludedTunes: 0,
      learnedTunes: 0,
      mostOverdueTunes: [],
      neverReviewedTunes: 0,
      nextDueBands: [
        { count: 0, id: "overdue", label: "Overdue" },
        { count: 0, id: "due-today", label: "Due today" },
        { count: 0, id: "due-1-7", label: "Due in 1-7 days" },
        { count: 0, id: "due-8-30", label: "Due in 8-30 days" },
        { count: 0, id: "due-31-90", label: "Due in 31-90 days" },
        { count: 0, id: "due-after-90", label: "Due after 90 days" },
        { count: 0, id: "never-reviewed", label: "Never reviewed" },
      ],
      overdueTunes: 0,
      reviewedRecentlyDays: 7,
      reviewedRecentlyTunes: 0,
      scoreCounts: [
        { count: 0, score: 0 },
        { count: 0, score: 1 },
        { count: 0, score: 2 },
        { count: 0, score: 3 },
        { count: 0, score: 4 },
        { count: 0, score: 5 },
        { count: 0, score: 6 },
        { count: 0, score: 7 },
        { count: 0, score: 8 },
        { count: 0, score: 9 },
      ],
      sessionMaintainedTunes: 0,
      totalTuneNotes: 0,
      tunesToLearn: 0,
    });
  });

  it("counts learned, to-learn, eligible, excluded, and session-maintained tunes", () => {
    const stats = calculateTuneStats(
      [
        tune("Learned by default"),
        tune("Explicitly learned", { learn: false }),
        tune("To learn", { learn: true }),
        tune("Excluded", { review: { excludedFromReview: true } }),
        tune("Session maintained", { review: { sessionMaintained: true } }),
        tune("Both flags", {
          review: {
            excludedFromReview: true,
            sessionMaintained: true,
          },
        }),
      ],
      { today },
    );

    expect(stats.totalTuneNotes).toBe(6);
    expect(stats.learnedTunes).toBe(5);
    expect(stats.tunesToLearn).toBe(1);
    expect(stats.eligibleReviewTunes).toBe(2);
    expect(stats.excludedTunes).toBe(2);
    expect(stats.sessionMaintainedTunes).toBe(2);
  });

  it("calculates review stats from eligible learned tunes only", () => {
    const stats = calculateTuneStats(
      [
        tune("Never reviewed"),
        tune("Due today", {
          review: { state: createReviewState(parseLocalDate("2026-01-14"), 0) },
        }),
        tune("Overdue", {
          review: { state: createReviewState(parseLocalDate("2026-01-10"), 0) },
        }),
        tune("Excluded overdue", {
          review: {
            excludedFromReview: true,
            state: createReviewState(parseLocalDate("2026-01-10"), 0),
          },
        }),
        tune("Session-maintained due", {
          review: {
            sessionMaintained: true,
            state: createReviewState(parseLocalDate("2026-01-14"), 0),
          },
        }),
        tune("To learn overdue", {
          learn: true,
          review: { state: createReviewState(parseLocalDate("2026-01-10"), 0) },
        }),
      ],
      { today },
    );

    expect(stats.neverReviewedTunes).toBe(1);
    expect(stats.dueTodayTunes).toBe(1);
    expect(stats.overdueTunes).toBe(1);
  });

  it("groups eligible tunes by next-due band", () => {
    const stats = calculateTuneStats(
      [
        tune("Overdue", {
          review: { state: createReviewState(parseLocalDate("2026-01-10"), 0) },
        }),
        tune("Due today", {
          review: { state: createReviewState(parseLocalDate("2026-01-14"), 0) },
        }),
        tune("Due in 1 day", {
          review: { state: createReviewState(parseLocalDate("2026-01-15"), 0) },
        }),
        tune("Due in 9 days", {
          review: { state: createReviewState(parseLocalDate("2025-12-25"), 4) },
        }),
        tune("Due in 34 days", {
          review: { state: createReviewState(parseLocalDate("2025-12-20"), 5) },
        }),
        tune("Due after 90 days", {
          review: { state: createReviewState(parseLocalDate("2025-11-01"), 9) },
        }),
        tune("Never reviewed"),
      ],
      { today },
    );

    expect(stats.nextDueBands).toEqual([
      { count: 1, id: "overdue", label: "Overdue" },
      { count: 1, id: "due-today", label: "Due today" },
      { count: 1, id: "due-1-7", label: "Due in 1-7 days" },
      { count: 1, id: "due-8-30", label: "Due in 8-30 days" },
      { count: 1, id: "due-31-90", label: "Due in 31-90 days" },
      { count: 1, id: "due-after-90", label: "Due after 90 days" },
      { count: 1, id: "never-reviewed", label: "Never reviewed" },
    ]);
  });

  it("counts current scores and separates never-reviewed tunes", () => {
    const stats = calculateTuneStats(
      [
        tune("Score zero", {
          review: { state: createReviewState(parseLocalDate("2026-01-10"), 0) },
        }),
        tune("Score nine A", {
          review: { state: createReviewState(parseLocalDate("2025-01-15"), 9) },
        }),
        tune("Score nine B", {
          review: { state: createReviewState(parseLocalDate("2025-01-16"), 9) },
        }),
        tune("Never reviewed"),
      ],
      { today },
    );

    expect(stats.scoreCounts).toEqual([
      { count: 1, score: 0 },
      { count: 0, score: 1 },
      { count: 0, score: 2 },
      { count: 0, score: 3 },
      { count: 0, score: 4 },
      { count: 0, score: 5 },
      { count: 0, score: 6 },
      { count: 0, score: 7 },
      { count: 0, score: 8 },
      { count: 2, score: 9 },
    ]);
    expect(stats.neverReviewedTunes).toBe(1);
  });

  it("returns a short deterministic most-overdue list", () => {
    const stats = calculateTuneStats(
      [
        tune("Beta", {
          review: { state: createReviewState(parseLocalDate("2026-01-04"), 0) },
        }),
        tune("Alpha", {
          review: { state: createReviewState(parseLocalDate("2026-01-04"), 0) },
        }),
        tune("Less overdue", {
          review: { state: createReviewState(parseLocalDate("2026-01-10"), 0) },
        }),
        tune("Due today", {
          review: { state: createReviewState(parseLocalDate("2026-01-14"), 0) },
        }),
      ],
      { mostOverdueLimit: 2, today },
    );

    expect(stats.mostOverdueTunes).toEqual([
      {
        dueDate: "2026-01-05",
        lastScore: 0,
        overdueDays: 10,
        path: "Tunes/Tunes/Alpha.md",
        title: "Alpha",
      },
      {
        dueDate: "2026-01-05",
        lastScore: 0,
        overdueDays: 10,
        path: "Tunes/Tunes/Beta.md",
        title: "Beta",
      },
    ]);
  });

  it("counts recently reviewed tunes with an injected window", () => {
    const stats = calculateTuneStats(
      [
        tune("Reviewed today", {
          review: { state: createReviewState(parseLocalDate("2026-01-15"), 0) },
        }),
        tune("Reviewed within window", {
          review: { state: createReviewState(parseLocalDate("2026-01-12"), 0) },
        }),
        tune("Reviewed outside window", {
          review: { state: createReviewState(parseLocalDate("2026-01-09"), 0) },
        }),
        tune("Future review date", {
          review: { state: createReviewState(parseLocalDate("2026-01-16"), 0) },
        }),
      ],
      { recentReviewDays: 3, today },
    );

    expect(stats.reviewedRecentlyDays).toBe(3);
    expect(stats.reviewedRecentlyTunes).toBe(2);
  });
});

interface TuneOptions {
  readonly learn?: boolean;
  readonly review?: Partial<Tune["review"]>;
}

function tune(title: string, options: TuneOptions = {}): Tune {
  return {
    keys: [],
    learn: options.learn,
    path: `Tunes/Tunes/${title}.md`,
    review: {
      excludedFromReview: false,
      sessionMaintained: false,
      ...options.review,
    },
    title,
  };
}
