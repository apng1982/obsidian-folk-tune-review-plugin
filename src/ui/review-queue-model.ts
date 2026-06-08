import { REVIEW_INTERVAL_DAYS } from "../domain/review-score";
import type { Tune } from "../domain/tune";

export interface ReviewQueueItemModel {
  readonly composer?: string;
  readonly keys?: string;
  readonly origin?: string;
  readonly path: string;
  readonly title: string;
}

export interface ScoreIntervalModel {
  readonly intervalDays: number;
  readonly label: string;
  readonly score: number;
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

export function buildScoreIntervalModels(): ScoreIntervalModel[] {
  return Object.entries(REVIEW_INTERVAL_DAYS).map(([score, intervalDays]) => ({
    intervalDays,
    label: `${score} (${intervalDays} ${intervalDays === 1 ? "day" : "days"})`,
    score: Number(score),
  }));
}
