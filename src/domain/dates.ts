const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

declare const localDateBrand: unique symbol;

export type LocalDate = string & { readonly [localDateBrand]: true };

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string") {
    return false;
  }

  const match = LOCAL_DATE_PATTERN.exec(value);
  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseLocalDate(value: string): LocalDate {
  if (!isLocalDate(value)) {
    throw new RangeError(`Invalid local date: ${value}`);
  }

  return value;
}

export function formatLocalDate(date: Date): LocalDate {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Cannot format an invalid Date.");
  }

  return createLocalDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

export function addDays(date: LocalDate, days: number): LocalDate {
  if (!Number.isInteger(days)) {
    throw new RangeError(`Days must be an integer: ${days}`);
  }

  const result = toUtcDate(date);
  result.setUTCDate(result.getUTCDate() + days);

  return createLocalDate(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  );
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / millisecondsPerDay;
}

function createLocalDate(year: number, month: number, day: number): LocalDate {
  return parseLocalDate(
    `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
  );
}

function toUtcDate(date: LocalDate): Date {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day));
}
