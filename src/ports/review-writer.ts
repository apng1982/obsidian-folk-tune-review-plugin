import type { ReviewState } from "../domain/review-state";
import type { Tune } from "../domain/tune";

export interface ReviewWriter {
  writeReview(tune: Tune, review: ReviewState): Promise<void>;
}
