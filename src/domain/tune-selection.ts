import { daysBetween, type LocalDate } from "./dates";
import type { Tune } from "./tune";
import { isLearnedTune } from "./tune";

export interface TuneSelectionOptions {
  readonly count: number;
  readonly includeExcluded: boolean;
  readonly includeSessionMaintained: boolean;
  readonly originFilter?: string;
  readonly randomize: boolean;
  readonly today: LocalDate;
}

export interface TuneEligibilityOptions {
  readonly includeExcluded: boolean;
  readonly includeSessionMaintained: boolean;
  readonly originFilter?: string;
}

export interface TuneDueInfo {
  readonly dueDate?: LocalDate;
  readonly isDue: boolean;
  readonly neverReviewed: boolean;
  readonly overdueDays?: number;
}

export type RandomNumberGenerator = () => number;

interface TuneWithDueInfo {
  readonly dueInfo: TuneDueInfo;
  readonly tune: Tune;
}

export function calculateTuneDueInfo(
  tune: Pick<Tune, "review">,
  today: LocalDate,
): TuneDueInfo {
  const reviewState = tune.review.state;
  if (reviewState === undefined) {
    return {
      isDue: true,
      neverReviewed: true,
    };
  }

  const overdueDays = daysBetween(reviewState.nextDue, today);
  return {
    dueDate: reviewState.nextDue,
    isDue: overdueDays >= 0,
    neverReviewed: false,
    overdueDays,
  };
}

export function selectTunes(
  tunes: readonly Tune[],
  options: TuneSelectionOptions,
  random: RandomNumberGenerator = Math.random,
): Tune[] {
  validateRequestedCount(options.count);

  const eligibleTunes = tunes
    .filter((tune) => isTuneEligibleForSelection(tune, options))
    .map<TuneWithDueInfo>((tune) => ({
      dueInfo: calculateTuneDueInfo(tune, options.today),
      tune,
    }));

  const due = eligibleTunes
    .filter(({ dueInfo }) => dueInfo.isDue && !dueInfo.neverReviewed)
    .sort(
      (left, right) =>
        (right.dueInfo.overdueDays ?? 0) - (left.dueInfo.overdueDays ?? 0),
    );

  const neverReviewed = randomizeWhenEnabled(
    eligibleTunes.filter(({ dueInfo }) => dueInfo.neverReviewed),
    options.randomize,
    random,
  );

  const nonDue = randomizeWhenEnabled(
    eligibleTunes.filter(
      ({ dueInfo }) => !dueInfo.isDue && !dueInfo.neverReviewed,
    ),
    options.randomize,
    random,
  );

  return [...due, ...neverReviewed, ...nonDue]
    .slice(0, options.count)
    .map(({ tune }) => tune);
}

export function isTuneEligibleForSelection(
  tune: Tune,
  options: TuneEligibilityOptions,
): boolean {
  if (!isLearnedTune(tune) || tune.id === undefined || tune.id.length === 0) {
    return false;
  }

  if (tune.review.excludedFromReview && !options.includeExcluded) {
    return false;
  }

  if (tune.review.sessionMaintained && !options.includeSessionMaintained) {
    return false;
  }

  const originFilter = options.originFilter?.trim();
  if (originFilter === undefined || originFilter.length === 0) {
    return true;
  }

  return tune.origin?.toLowerCase().includes(originFilter.toLowerCase()) ?? false;
}

function randomizeWhenEnabled<T>(
  values: readonly T[],
  randomize: boolean,
  random: RandomNumberGenerator,
): T[] {
  if (!randomize) {
    return [...values];
  }

  return values
    .map((value) => ({ key: random(), value }))
    .sort((left, right) => left.key - right.key)
    .map(({ value }) => value);
}

function validateRequestedCount(count: number): void {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`Review count must be a non-negative integer: ${count}`);
  }
}
