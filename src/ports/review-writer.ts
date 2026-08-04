import type { ReviewState } from "../domain/review-state";
import type { Tune } from "../domain/tune";

export type ReviewFlag = "excludedFromReview" | "sessionMaintained";

export interface ReviewWriter {
  writeReview(tune: Tune, review: ReviewState): Promise<void>;
  writeReviewFlag(tune: Tune, flag: ReviewFlag): Promise<void>;
}
