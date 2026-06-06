import { addDays, type LocalDate } from "./dates";
import { getReviewIntervalDays, parseReviewScore } from "./review-score";

export function calculateNextDueDate(
  reviewedOn: LocalDate,
  scoreValue: number,
): LocalDate {
  const score = parseReviewScore(scoreValue);
  return addDays(reviewedOn, getReviewIntervalDays(score));
}
