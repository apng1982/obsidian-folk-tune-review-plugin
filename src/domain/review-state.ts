import type { LocalDate } from "./dates";
import { calculateNextDueDate } from "./review-policy";
import {
  getReviewIntervalDays,
  parseReviewScore,
  type ReviewIntervalDays,
  type ReviewScore,
} from "./review-score";

export interface ReviewState {
  readonly intervalDays: ReviewIntervalDays;
  readonly lastReviewed: LocalDate;
  readonly nextDue: LocalDate;
  readonly score: ReviewScore;
}

export function createReviewState(
  today: LocalDate,
  scoreValue: number,
): ReviewState {
  const score = parseReviewScore(scoreValue);
  const intervalDays = getReviewIntervalDays(score);

  return {
    intervalDays,
    lastReviewed: today,
    nextDue: calculateNextDueDate(today, score),
    score,
  };
}
