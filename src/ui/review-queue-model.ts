import { REVIEW_INTERVAL_DAYS } from "../domain/review-score";
import type { LocalDate } from "../domain/dates";
import { calculateTuneDueInfo } from "../domain/tune-selection";
import type { Tune } from "../domain/tune";
import type { ReviewFlag } from "../ports/review-writer";

export interface ReviewQueueItemModel {
  readonly composer?: string;
  readonly keys?: string;
  readonly origin?: string;
  readonly path: string;
  readonly title: string;
}

export type ReviewQueueStatus = "due" | "never-reviewed" | "not-due";

export interface ReviewQueueStatusModel {
  readonly label: string;
  readonly status: ReviewQueueStatus;
  readonly symbol: string;
}

export interface ScoreIntervalModel {
  readonly intervalDays: number;
  readonly label: string;
  readonly score: number;
}

export interface ReviewFlagActionModel {
  readonly flag: ReviewFlag;
  readonly label: string;
  readonly value: boolean;
}

export function buildReviewQueueItemModel(tune: Tune): ReviewQueueItemModel {
  return {
    composer: tune.composer,
    keys: tune.keys.length > 0 ? tune.keys.join(", ") : undefined,
    origin: tune.origin,
    path: tune.path,
    title: tune.title,
  };
}

export function buildReviewQueueStatusModel(
  tune: Pick<Tune, "review">,
  today: LocalDate,
): ReviewQueueStatusModel {
  const dueInfo = calculateTuneDueInfo(tune, today);

  if (dueInfo.neverReviewed) {
    return {
      label: "Never reviewed",
      status: "never-reviewed",
      symbol: "🟠",
    };
  }

  if (dueInfo.isDue) {
    return {
      label: "Due for review",
      status: "due",
      symbol: "🔴",
    };
  }

  return {
    label: "Not due",
    status: "not-due",
    symbol: "🟢",
  };
}

export function buildCurrentTuneFlagActionModels(
  tune: Pick<Tune, "review">,
): ReviewFlagActionModel[] {
  return [
    tune.review.excludedFromReview
      ? {
          flag: "excludedFromReview",
          label: "Include in reviews",
          value: false,
        }
      : {
          flag: "excludedFromReview",
          label: "Exclude from reviews",
          value: true,
        },
    tune.review.sessionMaintained
      ? {
          flag: "sessionMaintained",
          label: "Unmark as session maintained",
          value: false,
        }
      : {
          flag: "sessionMaintained",
          label: "Mark as session maintained",
          value: true,
        },
  ];
}

export function buildScoreIntervalModels(): ScoreIntervalModel[] {
  return Object.entries(REVIEW_INTERVAL_DAYS).map(([score, intervalDays]) => ({
    intervalDays,
    label: `${score} (${intervalDays} ${intervalDays === 1 ? "day" : "days"})`,
    score: Number(score),
  }));
}
