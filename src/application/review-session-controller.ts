import type { ReviewMode } from "../domain/review-mode";
import {
  createReviewSession,
  endReviewSession,
  getCurrentTune,
  scoreCurrentTune,
  skipCurrentTune,
  type ReviewSession,
} from "../domain/review-session";
import { createReviewState } from "../domain/review-state";
import type { Tune } from "../domain/tune";
import type { Clock } from "../ports/clock";
import type { ReviewWriter } from "../ports/review-writer";

export class ReviewSessionController {
  private currentSession: ReviewSession;

  constructor(
    queue: readonly Tune[],
    readonly mode: ReviewMode,
    private readonly clock: Clock,
    private readonly writer?: ReviewWriter,
  ) {
    if (mode === "live" && writer === undefined) {
      throw new Error("Live review session requires a review writer.");
    }

    this.currentSession = createReviewSession(queue);
  }

  get session(): ReviewSession {
    return this.currentSession;
  }

  async score(score: number): Promise<void> {
    const nextSession = scoreCurrentTune(this.currentSession, score);

    if (this.mode === "live") {
      const tune = getCurrentTune(this.currentSession);
      if (tune === undefined || this.writer === undefined) {
        throw new Error("Live review session has no writable current tune.");
      }

      const review = createReviewState(this.clock.today(), score);
      await this.writer.writeReview(tune, review);
    }

    this.currentSession = nextSession;
  }

  skip(): void {
    this.currentSession = skipCurrentTune(this.currentSession);
  }

  end(): void {
    this.currentSession = endReviewSession(this.currentSession);
  }
}
