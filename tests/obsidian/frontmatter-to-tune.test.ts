import { describe, expect, it } from "vitest";

import {
  extractDisplayText,
  mapFrontmatterToTune,
} from "../../src/obsidian/frontmatter-to-tune";

const file = {
  path: "Tunes/Tunes/The Silver Spear.md",
  title: "The Silver Spear",
};

describe("wikilink display text", () => {
  it.each([
    ["[[Ref/Geo/Irish|Irish]]", "Irish"],
    ["[[Ref/Geo/Irish]]", "Irish"],
    ["[[Irish]]", "Irish"],
    ["Irish", "Irish"],
  ])("maps %s to %s", (value, expected) => {
    expect(extractDisplayText(value)).toBe(expected);
  });
});

describe("frontmatter to tune mapping", () => {
  it("maps valid frontmatter and wikilink aliases", () => {
    expect(
      mapFrontmatterToTune(file, {
        composer: "[[Ref/Composer/(trad.)|(trad.)]]",
        id: "tune-1",
        key: ["[[Ref/Key/d minor.|d minor.]]", "G"],
        learn: false,
        origin: "[[Ref/Geo/Irish|Irish]]",
        review: {
          excludedFromReview: true,
          intervalDays: 365,
          lastReviewed: "2026-06-05",
          nextDue: "2027-06-05",
          score: 9,
          sessionMaintained: false,
        },
      }),
    ).toEqual({
      composer: "(trad.)",
      id: "tune-1",
      keys: ["d minor.", "G"],
      learn: false,
      origin: "Irish",
      path: file.path,
      review: {
        excludedFromReview: true,
        sessionMaintained: false,
        state: {
          intervalDays: 365,
          lastReviewed: "2026-06-05",
          nextDue: "2027-06-05",
          score: 9,
        },
      },
      title: file.title,
    });
  });

  it("supports missing learn metadata and partial review flags", () => {
    expect(
      mapFrontmatterToTune(file, {
        id: "tune-1",
        review: {
          sessionMaintained: true,
        },
      }),
    ).toMatchObject({
      id: "tune-1",
      keys: [],
      review: {
        excludedFromReview: false,
        sessionMaintained: true,
        state: undefined,
      },
    });
  });

  it.each([
    undefined,
    "not frontmatter",
    { learn: "false" },
    { key: [42] },
    { origin: ["Irish"] },
    { review: "invalid" },
    { review: { score: 9 } },
    {
      review: {
        intervalDays: 30,
        lastReviewed: "2026-06-05",
        nextDue: "2027-06-05",
        score: 9,
      },
    },
    {
      review: {
        intervalDays: 365,
        lastReviewed: "2026-06-05",
        nextDue: "2027-06-06",
        score: 9,
      },
    },
  ])("excludes malformed frontmatter %#", (frontmatter) => {
    expect(mapFrontmatterToTune(file, frontmatter)).toBeUndefined();
  });
});
