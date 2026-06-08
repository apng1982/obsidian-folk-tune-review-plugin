import {
  createDryRunReviewSession,
  endReviewSession,
  scoreCurrentTune,
  skipCurrentTune,
  type ReviewSession,
} from "../domain/review-session";
import type { Tune } from "../domain/tune";

export class DryRunReviewSession {
  private currentSession: ReviewSession;

  constructor(queue: readonly Tune[]) {
    this.currentSession = createDryRunReviewSession(queue);
  }

  get session(): ReviewSession {
    return this.currentSession;
  }

  score(score: number): void {
    this.currentSession = scoreCurrentTune(this.currentSession, score);
  }

  skip(): void {
    this.currentSession = skipCurrentTune(this.currentSession);
  }

  end(): void {
    this.currentSession = endReviewSession(this.currentSession);
  }
}
