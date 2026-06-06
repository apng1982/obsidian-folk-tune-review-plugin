import { describe, expect, it } from "vitest";

import { isLearnedTune } from "../../src/domain/tune";

describe("learned tunes", () => {
  it("excludes only tunes explicitly marked to learn", () => {
    expect(isLearnedTune({ learn: true })).toBe(false);
    expect(isLearnedTune({ learn: false })).toBe(true);
    expect(isLearnedTune({})).toBe(true);
  });
});
