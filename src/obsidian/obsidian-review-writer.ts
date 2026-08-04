import type { App } from "obsidian";

import type { ReviewState } from "../domain/review-state";
import type { Tune } from "../domain/tune";
import type { ReviewFlag, ReviewWriter } from "../ports/review-writer";
import {
  applyReviewFlagToFrontmatter,
  applyReviewStateToFrontmatter,
} from "./review-frontmatter";

export class ObsidianReviewWriter implements ReviewWriter {
  constructor(private readonly app: Pick<App, "fileManager" | "vault">) {}

  async writeReview(tune: Tune, review: ReviewState): Promise<void> {
    await this.processReviewFrontmatter(tune, (frontmatter) => {
      applyReviewStateToFrontmatter(frontmatter, review);
    });
  }

  async writeReviewFlag(
    tune: Tune,
    flag: ReviewFlag,
    value: boolean,
  ): Promise<void> {
    await this.processReviewFrontmatter(tune, (frontmatter) => {
      applyReviewFlagToFrontmatter(frontmatter, flag, value);
    });
  }

  private async processReviewFrontmatter(
    tune: Tune,
    mutate: (frontmatter: Record<string, unknown>) => void,
  ): Promise<void> {
    const file = this.app.vault.getFileByPath(tune.path);
    if (file === null) {
      throw new Error(`Tune note not found: ${tune.path}`);
    }

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      mutate(frontmatter as Record<string, unknown>);
    });
  }
}
