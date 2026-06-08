import type { App } from "obsidian";

import type { ReviewState } from "../domain/review-state";
import type { Tune } from "../domain/tune";
import type { ReviewWriter } from "../ports/review-writer";
import { applyReviewStateToFrontmatter } from "./review-frontmatter";

export class ObsidianReviewWriter implements ReviewWriter {
  constructor(private readonly app: Pick<App, "fileManager" | "vault">) {}

  async writeReview(tune: Tune, review: ReviewState): Promise<void> {
    const file = this.app.vault.getFileByPath(tune.path);
    if (file === null) {
      throw new Error(`Tune note not found: ${tune.path}`);
    }

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      applyReviewStateToFrontmatter(
        frontmatter as Record<string, unknown>,
        review,
      );
    });
  }
}
