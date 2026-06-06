import { describe, expect, it } from "vitest";

import {
  addDays,
  daysBetween,
  formatLocalDate,
  isLocalDate,
  parseLocalDate,
} from "../../src/domain/dates";

describe("local dates", () => {
  it.each([
    "2026-01-01",
    "2024-02-29",
    "9999-12-31",
  ])("accepts a valid YYYY-MM-DD date: %s", (value) => {
    expect(isLocalDate(value)).toBe(true);
    expect(parseLocalDate(value)).toBe(value);
  });

  it.each([
    "2026-1-01",
    "2026-01-1",
    "2026-02-29",
    "2025-13-01",
    "not-a-date",
    "",
  ])("rejects an invalid local date: %s", (value) => {
    expect(isLocalDate(value)).toBe(false);
    expect(() => parseLocalDate(value)).toThrow(RangeError);
  });

  it("formats a Date using its local calendar date", () => {
    expect(formatLocalDate(new Date(2026, 5, 6, 23, 59))).toBe("2026-06-06");
  });

  it("rejects an invalid Date", () => {
    expect(() => formatLocalDate(new Date(Number.NaN))).toThrow(RangeError);
  });

  it.each([
    ["2026-01-01", 1, "2026-01-02"],
    ["2026-01-31", 1, "2026-02-01"],
    ["2024-02-28", 1, "2024-02-29"],
    ["2024-02-29", 1, "2024-03-01"],
    ["2026-01-01", -1, "2025-12-31"],
    ["2026-06-05", 365, "2027-06-05"],
  ])("adds calendar days: %s + %i = %s", (value, days, expected) => {
    expect(addDays(parseLocalDate(value), days)).toBe(expected);
  });

  it("rejects a fractional day interval", () => {
    expect(() => addDays(parseLocalDate("2026-01-01"), 1.5)).toThrow(RangeError);
  });

  it("calculates signed calendar-day differences", () => {
    const first = parseLocalDate("2026-01-01");
    const second = parseLocalDate("2026-01-31");

    expect(daysBetween(first, second)).toBe(30);
    expect(daysBetween(second, first)).toBe(-30);
  });
});
