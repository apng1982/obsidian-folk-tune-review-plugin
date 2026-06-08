import type { ReviewState } from "../domain/review-state";

export function applyReviewStateToFrontmatter(
  frontmatter: Record<string, unknown>,
  reviewState: ReviewState,
): void {
  const existingReview = frontmatter.review;
  if (
    existingReview !== undefined &&
    (!isRecord(existingReview) || Array.isArray(existingReview))
  ) {
    throw new TypeError("Review metadata must be an object.");
  }

  frontmatter.review = {
    ...(existingReview ?? {}),
    intervalDays: reviewState.intervalDays,
    lastReviewed: reviewState.lastReviewed,
    nextDue: reviewState.nextDue,
    score: reviewState.score,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
