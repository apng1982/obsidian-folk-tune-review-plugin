import {
  selectTunes,
  type RandomNumberGenerator,
  type TuneSelectionOptions,
} from "../domain/tune-selection";
import type { Tune } from "../domain/tune";
import type { Clock } from "../ports/clock";
import type { TuneRepository } from "../ports/tune-repository";

export type BuildReviewQueueOptions = Omit<TuneSelectionOptions, "today">;

export async function buildReviewQueue(
  repository: TuneRepository,
  clock: Clock,
  options: BuildReviewQueueOptions,
  random?: RandomNumberGenerator,
): Promise<Tune[]> {
  const tunes = await repository.getTunes();
  return selectTunes(
    tunes,
    {
      ...options,
      today: clock.today(),
    },
    random,
  );
}
