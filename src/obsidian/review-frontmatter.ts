import type { ReviewState } from "../domain/review-state";
import type { ReviewFlag } from "../ports/review-writer";

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

export function applyReviewFlagToFrontmatter(
  frontmatter: Record<string, unknown>,
  flag: ReviewFlag,
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
    [flag]: true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
