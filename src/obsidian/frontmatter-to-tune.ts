import { parseLocalDate } from "../domain/dates";
import { calculateNextDueDate } from "../domain/review-policy";
import {
  getReviewIntervalDays,
  parseReviewScore,
} from "../domain/review-score";
import type { ReviewState } from "../domain/review-state";
import type { Tune, TuneReview } from "../domain/tune";

export interface TuneFileDescriptor {
  readonly path: string;
  readonly title: string;
}

export function mapFrontmatterToTune(
  file: TuneFileDescriptor,
  frontmatter: unknown,
): Tune | undefined {
  if (!isRecord(frontmatter)) {
    return undefined;
  }

  try {
    return {
      composer: readOptionalDisplayText(frontmatter.composer),
      id: readOptionalString(frontmatter.id),
      keys: readDisplayTextList(frontmatter.key),
      learn: readOptionalBoolean(frontmatter.learn),
      origin: readOptionalDisplayText(frontmatter.origin),
      path: file.path,
      review: readReview(frontmatter.review),
      title: file.title,
    };
  } catch {
    return undefined;
  }
}

export function extractDisplayText(value: string): string {
  const match = /^\[\[(.*?)\]\]$/.exec(value.trim());
  if (match === null) {
    return value;
  }

  const linkContent = match[1] ?? "";
  const aliasSeparator = linkContent.indexOf("|");
  if (aliasSeparator !== -1) {
    return linkContent.slice(aliasSeparator + 1);
  }

  const pathSeparator = linkContent.lastIndexOf("/");
  return pathSeparator === -1
    ? linkContent
    : linkContent.slice(pathSeparator + 1);
}

function readReview(value: unknown): TuneReview {
  if (value === undefined) {
    return {
      excludedFromReview: false,
      sessionMaintained: false,
    };
  }

  if (!isRecord(value)) {
    throw new TypeError("Review metadata must be an object.");
  }

  return {
    excludedFromReview: readBooleanWithDefault(value.excludedFromReview, false),
    sessionMaintained: readBooleanWithDefault(value.sessionMaintained, false),
    state: readReviewState(value),
  };
}

function readReviewState(review: Record<string, unknown>): ReviewState | undefined {
  const stateValues = [
    review.lastReviewed,
    review.score,
    review.intervalDays,
    review.nextDue,
  ];
  const suppliedValueCount = stateValues.filter(
    (value) => value !== undefined,
  ).length;

  if (suppliedValueCount === 0) {
    return undefined;
  }

  if (suppliedValueCount !== stateValues.length) {
    throw new TypeError("Review state must be complete.");
  }

  const lastReviewed = parseLocalDate(readString(review.lastReviewed));
  const score = parseReviewScore(readNumber(review.score));
  const intervalDays = readNumber(review.intervalDays);
  const nextDue = parseLocalDate(readString(review.nextDue));
  const expectedIntervalDays = getReviewIntervalDays(score);

  if (intervalDays !== expectedIntervalDays) {
    throw new RangeError("Review interval does not match its score.");
  }

  if (nextDue !== calculateNextDueDate(lastReviewed, score)) {
    throw new RangeError("Review next due date does not match its review state.");
  }

  return {
    intervalDays: expectedIntervalDays,
    lastReviewed,
    nextDue,
    score,
  };
}

function readDisplayTextList(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    return [extractDisplayText(value)];
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new TypeError("Expected a string or array of strings.");
  }

  return value.map(extractDisplayText);
}

function readOptionalDisplayText(value: unknown): string | undefined {
  const stringValue = readOptionalString(value);
  return stringValue === undefined ? undefined : extractDisplayText(stringValue);
}

function readOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return readString(value);
}

function readOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new TypeError("Expected a boolean.");
  }

  return value;
}

function readBooleanWithDefault(value: unknown, defaultValue: boolean): boolean {
  return readOptionalBoolean(value) ?? defaultValue;
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    throw new TypeError("Expected a string.");
  }

  return value;
}

function readNumber(value: unknown): number {
  if (typeof value !== "number") {
    throw new TypeError("Expected a number.");
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
