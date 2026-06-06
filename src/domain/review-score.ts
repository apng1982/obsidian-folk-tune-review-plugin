export const REVIEW_INTERVAL_DAYS = {
  0: 1,
  1: 3,
  2: 7,
  3: 14,
  4: 30,
  5: 60,
  6: 120,
  7: 180,
  8: 270,
  9: 365,
} as const;

export type ReviewScore = keyof typeof REVIEW_INTERVAL_DAYS;
export type ReviewIntervalDays = (typeof REVIEW_INTERVAL_DAYS)[ReviewScore];

export function isReviewScore(value: unknown): value is ReviewScore {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 9
  );
}

export function parseReviewScore(value: number): ReviewScore {
  if (!isReviewScore(value)) {
    throw new RangeError(`Review score must be an integer from 0 to 9: ${value}`);
  }

  return value;
}

export function getReviewIntervalDays(score: ReviewScore): ReviewIntervalDays {
  return REVIEW_INTERVAL_DAYS[score];
}
