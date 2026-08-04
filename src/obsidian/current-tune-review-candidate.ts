import type { Tune } from "../domain/tune";
import { mapFrontmatterToTune } from "./frontmatter-to-tune";
import { isDirectChildPath } from "./vault-path";

export interface CurrentTuneReviewFile {
  readonly basename: string;
  readonly frontmatter: unknown;
  readonly path: string;
}

export type CurrentTuneReviewCandidateResult =
  | { readonly reason: "no-active-file"; readonly type: "invalid" }
  | { readonly reason: "outside-tune-folder"; readonly type: "invalid" }
  | { readonly reason: "invalid-tune-metadata"; readonly type: "invalid" }
  | { readonly reason: "not-learned"; readonly type: "invalid" }
  | { readonly tune: Tune; readonly type: "valid" };

export function validateCurrentTuneReviewCandidate(
  activeFile: CurrentTuneReviewFile | undefined,
  tuneFolder: string,
): CurrentTuneReviewCandidateResult {
  if (activeFile === undefined) {
    return {
      reason: "no-active-file",
      type: "invalid",
    };
  }

  if (!isDirectChildPath(activeFile.path, tuneFolder)) {
    return {
      reason: "outside-tune-folder",
      type: "invalid",
    };
  }

  const tune = mapFrontmatterToTune(
    {
      path: activeFile.path,
      title: activeFile.basename,
    },
    activeFile.frontmatter,
  );
  if (tune === undefined) {
    return {
      reason: "invalid-tune-metadata",
      type: "invalid",
    };
  }

  if (tune.learn !== false) {
    return {
      reason: "not-learned",
      type: "invalid",
    };
  }

  return {
    tune,
    type: "valid",
  };
}

export function getCurrentTuneReviewValidationMessage(
  result: Extract<CurrentTuneReviewCandidateResult, { type: "invalid" }>,
  tuneFolder: string,
): string {
  switch (result.reason) {
    case "no-active-file":
      return "Open a tune note before adding a review.";
    case "outside-tune-folder":
      return `Only notes in ${tuneFolder} can be reviewed with this command.`;
    case "invalid-tune-metadata":
      return "This note cannot be reviewed because its tune metadata could not be read. Check the YAML frontmatter.";
    case "not-learned":
      return "Only tune notes that have already been learned (learn: false) are eligible for review.";
  }
}
