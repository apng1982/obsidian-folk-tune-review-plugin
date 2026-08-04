import { describe, expect, it } from "vitest";

import {
  getCurrentTuneReviewValidationMessage,
  validateCurrentTuneReviewCandidate,
  type CurrentTuneReviewFile,
} from "../../src/obsidian/current-tune-review-candidate";

const tuneFolder = "Repertoire/Tunes";

describe("current tune review candidate validation", () => {
  it("rejects when there is no active file", () => {
    expect(validateCurrentTuneReviewCandidate(undefined, tuneFolder)).toEqual({
      reason: "no-active-file",
      type: "invalid",
    });
  });

  it("rejects notes outside the configured tune folder", () => {
    expect(
      validateCurrentTuneReviewCandidate(file("Repertoire/Sets/Set.md"), tuneFolder),
    ).toEqual({
      reason: "outside-tune-folder",
      type: "invalid",
    });
  });

  it("rejects notes nested below the configured flat tune folder", () => {
    expect(
      validateCurrentTuneReviewCandidate(
        file("Repertoire/Tunes/Nested/Tune.md"),
        tuneFolder,
      ),
    ).toEqual({
      reason: "outside-tune-folder",
      type: "invalid",
    });
  });

  it("rejects malformed tune metadata", () => {
    expect(
      validateCurrentTuneReviewCandidate(
        file("Repertoire/Tunes/Tune.md", {
          id: "one",
          learn: false,
          review: "invalid",
        }),
        tuneFolder,
      ),
    ).toEqual({
      reason: "invalid-tune-metadata",
      type: "invalid",
    });
  });

  it("rejects tunes that are not marked as learned", () => {
    expect(
      validateCurrentTuneReviewCandidate(
        file("Repertoire/Tunes/Learning.md", { id: "learning", learn: true }),
        tuneFolder,
      ),
    ).toEqual({
      reason: "not-learned",
      type: "invalid",
    });

    expect(
      validateCurrentTuneReviewCandidate(
        file("Repertoire/Tunes/Missing Learn.md", { id: "missing-learn" }),
        tuneFolder,
      ),
    ).toEqual({
      reason: "not-learned",
      type: "invalid",
    });
  });

  it("accepts excluded and session-maintained tunes for direct review", () => {
    const result = validateCurrentTuneReviewCandidate(
      file("Repertoire/Tunes/Flagged.md", {
        id: "flagged",
        learn: false,
        review: {
          excludedFromReview: true,
          sessionMaintained: true,
        },
      }),
      tuneFolder,
    );

    expect(result).toMatchObject({
      tune: {
        id: "flagged",
        review: {
          excludedFromReview: true,
          sessionMaintained: true,
        },
      },
      type: "valid",
    });
  });

  it("accepts an eligible tune in the configured tune folder", () => {
    expect(
      validateCurrentTuneReviewCandidate(
        file("Repertoire/Tunes/The Silver Spear.md", {
          key: ["D", "G"],
          learn: false,
          origin: "[[Ref/Geo/Irish|Irish]]",
        }),
        tuneFolder,
      ),
    ).toMatchObject({
      tune: {
        keys: ["D", "G"],
        learn: false,
        origin: "Irish",
        path: "Repertoire/Tunes/The Silver Spear.md",
        review: {
          excludedFromReview: false,
          sessionMaintained: false,
        },
        title: "The Silver Spear",
      },
      type: "valid",
    });
  });
});

describe("current tune review validation messages", () => {
  it("explains why current-note review cannot start", () => {
    expect(
      getCurrentTuneReviewValidationMessage(
        { reason: "no-active-file", type: "invalid" },
        tuneFolder,
      ),
    ).toBe("Open a tune note before adding a review.");

    expect(
      getCurrentTuneReviewValidationMessage(
        { reason: "outside-tune-folder", type: "invalid" },
        tuneFolder,
      ),
    ).toBe("Only notes in Repertoire/Tunes can be reviewed with this command.");

    expect(
      getCurrentTuneReviewValidationMessage(
        { reason: "invalid-tune-metadata", type: "invalid" },
        tuneFolder,
      ),
    ).toBe(
      "This note cannot be reviewed because its tune metadata could not be read. Check the YAML frontmatter.",
    );

    expect(
      getCurrentTuneReviewValidationMessage(
        { reason: "not-learned", type: "invalid" },
        tuneFolder,
      ),
    ).toBe(
      "Only tune notes that have already been learned (learn: false) are eligible for review.",
    );
  });
});

function file(
  path: string,
  frontmatter: unknown = { learn: false },
): CurrentTuneReviewFile {
  const parts = path.split("/");
  const filename = parts[parts.length - 1] ?? path;
  const basename = filename.replace(/\.md$/, "");
  return {
    basename,
    frontmatter,
    path,
  };
}
