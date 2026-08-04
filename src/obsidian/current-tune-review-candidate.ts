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
  | { readonly reason: "ineligible-tune"; readonly type: "invalid" }
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
      reason: "ineligible-tune",
      type: "invalid",
    };
  }

  return {
    tune,
    type: "valid",
  };
}
