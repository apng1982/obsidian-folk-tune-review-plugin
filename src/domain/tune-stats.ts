import { daysBetween, type LocalDate } from "./dates";
import type { ReviewScore } from "./review-score";
import type { Tune } from "./tune";
import { isLearnedTune } from "./tune";

export type NextDueBandId =
  | "overdue"
  | "due-today"
  | "due-1-7"
  | "due-8-30"
  | "due-31-90"
  | "due-after-90"
  | "never-reviewed";

export interface TuneStatsOptions {
  readonly mostOverdueLimit?: number;
  readonly recentReviewDays?: number;
  readonly today: LocalDate;
}

export interface TuneStats {
  readonly dueTodayTunes: number;
  readonly eligibleReviewTunes: number;
  readonly excludedTunes: number;
  readonly learnedTunes: number;
  readonly mostOverdueTunes: readonly MostOverdueTune[];
  readonly neverReviewedTunes: number;
  readonly nextDueBands: readonly NextDueBandCount[];
  readonly overdueTunes: number;
  readonly reviewedRecentlyDays: number;
  readonly reviewedRecentlyTunes: number;
  readonly scoreCounts: readonly ScoreCount[];
  readonly sessionMaintainedTunes: number;
  readonly totalTuneNotes: number;
  readonly tunesToLearn: number;
}

export interface ScoreCount {
  readonly count: number;
  readonly score: ReviewScore;
}

export interface NextDueBandCount {
  readonly count: number;
  readonly id: NextDueBandId;
  readonly label: string;
}

export interface MostOverdueTune {
  readonly dueDate: LocalDate;
  readonly lastScore: ReviewScore;
  readonly overdueDays: number;
  readonly path: string;
  readonly title: string;
}

interface EligibleTuneWithReviewInfo {
  readonly daysUntilDue?: number;
  readonly tune: Tune;
}

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const satisfies readonly ReviewScore[];

const NEXT_DUE_BANDS: readonly Omit<NextDueBandCount, "count">[] = [
  { id: "overdue", label: "Overdue" },
  { id: "due-today", label: "Due today" },
  { id: "due-1-7", label: "Due in 1-7 days" },
  { id: "due-8-30", label: "Due in 8-30 days" },
  { id: "due-31-90", label: "Due in 31-90 days" },
  { id: "due-after-90", label: "Due after 90 days" },
  { id: "never-reviewed", label: "Never reviewed" },
];

const DEFAULT_MOST_OVERDUE_LIMIT = 5;
const DEFAULT_RECENT_REVIEW_DAYS = 7;

export function calculateTuneStats(
  tunes: readonly Tune[],
  options: TuneStatsOptions,
): TuneStats {
  const mostOverdueLimit =
    options.mostOverdueLimit ?? DEFAULT_MOST_OVERDUE_LIMIT;
  const reviewedRecentlyDays =
    options.recentReviewDays ?? DEFAULT_RECENT_REVIEW_DAYS;
  validateNonNegativeInteger(mostOverdueLimit, "Most overdue limit");
  validateNonNegativeInteger(reviewedRecentlyDays, "Recent review days");

  const learnedTunes = tunes.filter(isLearnedTune);
  const eligibleTunes = learnedTunes.filter(
    (tune) =>
      !tune.review.excludedFromReview && !tune.review.sessionMaintained,
  );
  const eligibleReviewInfo = eligibleTunes.map<EligibleTuneWithReviewInfo>(
    (tune) => ({
      daysUntilDue:
        tune.review.state === undefined
          ? undefined
          : daysBetween(options.today, tune.review.state.nextDue),
      tune,
    }),
  );

  return {
    dueTodayTunes: countDueToday(eligibleReviewInfo),
    eligibleReviewTunes: eligibleTunes.length,
    excludedTunes: learnedTunes.filter((tune) => tune.review.excludedFromReview)
      .length,
    learnedTunes: learnedTunes.length,
    mostOverdueTunes: buildMostOverdueTunes(
      eligibleReviewInfo,
      mostOverdueLimit,
    ),
    neverReviewedTunes: eligibleTunes.filter(
      (tune) => tune.review.state === undefined,
    ).length,
    nextDueBands: buildNextDueBands(eligibleReviewInfo),
    overdueTunes: countOverdue(eligibleReviewInfo),
    reviewedRecentlyDays,
    reviewedRecentlyTunes: countRecentlyReviewed(
      eligibleTunes,
      options.today,
      reviewedRecentlyDays,
    ),
    scoreCounts: buildScoreCounts(eligibleTunes),
    sessionMaintainedTunes: learnedTunes.filter(
      (tune) => tune.review.sessionMaintained,
    ).length,
    totalTuneNotes: tunes.length,
    tunesToLearn: tunes.length - learnedTunes.length,
  };
}

function buildScoreCounts(tunes: readonly Tune[]): ScoreCount[] {
  return SCORES.map((score) => ({
    count: tunes.filter((tune) => tune.review.state?.score === score).length,
    score,
  }));
}

function buildNextDueBands(
  tunes: readonly EligibleTuneWithReviewInfo[],
): NextDueBandCount[] {
  return NEXT_DUE_BANDS.map((band) => ({
    ...band,
    count: tunes.filter((tune) => getNextDueBandId(tune) === band.id).length,
  }));
}

function getNextDueBandId(tune: EligibleTuneWithReviewInfo): NextDueBandId {
  if (tune.daysUntilDue === undefined) {
    return "never-reviewed";
  }

  if (tune.daysUntilDue < 0) {
    return "overdue";
  }

  if (tune.daysUntilDue === 0) {
    return "due-today";
  }

  if (tune.daysUntilDue <= 7) {
    return "due-1-7";
  }

  if (tune.daysUntilDue <= 30) {
    return "due-8-30";
  }

  if (tune.daysUntilDue <= 90) {
    return "due-31-90";
  }

  return "due-after-90";
}

function buildMostOverdueTunes(
  tunes: readonly EligibleTuneWithReviewInfo[],
  limit: number,
): MostOverdueTune[] {
  return tunes
    .filter((tune) => tune.daysUntilDue !== undefined && tune.daysUntilDue < 0)
    .sort((left, right) => {
      const overdueComparison =
        Math.abs(right.daysUntilDue ?? 0) - Math.abs(left.daysUntilDue ?? 0);
      if (overdueComparison !== 0) {
        return overdueComparison;
      }

      return compareText(left.tune.title, right.tune.title);
    })
    .slice(0, limit)
    .map(({ daysUntilDue, tune }) => ({
      dueDate: tune.review.state?.nextDue ?? optionsInvariantViolation(),
      lastScore: tune.review.state?.score ?? optionsInvariantViolation(),
      overdueDays: Math.abs(daysUntilDue ?? 0),
      path: tune.path,
      title: tune.title,
    }));
}

function countOverdue(tunes: readonly EligibleTuneWithReviewInfo[]): number {
  return tunes.filter(
    (tune) => tune.daysUntilDue !== undefined && tune.daysUntilDue < 0,
  ).length;
}

function countDueToday(tunes: readonly EligibleTuneWithReviewInfo[]): number {
  return tunes.filter((tune) => tune.daysUntilDue === 0).length;
}

function countRecentlyReviewed(
  tunes: readonly Tune[],
  today: LocalDate,
  days: number,
): number {
  return tunes.filter((tune) => {
    const lastReviewed = tune.review.state?.lastReviewed;
    if (lastReviewed === undefined) {
      return false;
    }

    const ageInDays = daysBetween(lastReviewed, today);
    return ageInDays >= 0 && ageInDays <= days;
  }).length;
}

function compareText(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function validateNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer: ${value}`);
  }
}

function optionsInvariantViolation(): never {
  throw new Error("Overdue tune is missing review state.");
}
