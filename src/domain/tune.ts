import type { ReviewState } from "./review-state";

export interface TuneReview {
  readonly excludedFromReview: boolean;
  readonly sessionMaintained: boolean;
  readonly state?: ReviewState;
}

export interface Tune {
  readonly composer?: string;
  readonly id?: string;
  readonly keys: readonly string[];
  readonly learn?: boolean;
  readonly origin?: string;
  readonly path: string;
  readonly review: TuneReview;
  readonly title: string;
}

export function isLearnedTune(tune: Pick<Tune, "learn">): boolean {
  return tune.learn !== true;
}
