import {
  calculateTuneStats,
  type TuneStats,
  type TuneStatsOptions,
} from "../domain/tune-stats";
import type { Clock } from "../ports/clock";
import type { TuneRepository } from "../ports/tune-repository";

export type BuildTuneStatsOptions = Omit<TuneStatsOptions, "today">;

export async function buildTuneStats(
  repository: TuneRepository,
  clock: Clock,
  options: BuildTuneStatsOptions = {},
): Promise<TuneStats> {
  const tunes = await repository.getTunes();
  return calculateTuneStats(tunes, {
    ...options,
    today: clock.today(),
  });
}
