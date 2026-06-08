import { ItemView, type WorkspaceLeaf } from "obsidian";

import type { Tune } from "../domain/tune";
import {
  buildReviewQueueItemModel,
  buildScoreIntervalModels,
} from "./review-queue-model";

export const REVIEW_QUEUE_VIEW_TYPE = "folk-tune-review-queue";

export class ReviewQueueView extends ItemView {
  private queue: readonly Tune[] = [];

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return REVIEW_QUEUE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Folk tune review queue";
  }

  override onOpen(): Promise<void> {
    this.render();
    return Promise.resolve();
  }

  setQueue(queue: readonly Tune[]): void {
    this.queue = queue;
    this.render();
  }

  private render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("folk-tune-review-view");

    container.createEl("h2", { text: "Review queue" });
    container.createEl("p", {
      cls: "folk-tune-review-read-only",
      text: "Read-only preview. No tune notes will be changed.",
    });

    if (this.queue.length === 0) {
      container.createEl("p", {
        cls: "folk-tune-review-empty",
        text: "No eligible tunes matched these review options.",
      });
    } else {
      container.createEl("p", {
        text: `${this.queue.length} ${this.queue.length === 1 ? "tune" : "tunes"} selected.`,
      });
      const list = container.createEl("ol", {
        cls: "folk-tune-review-queue",
      });

      for (const tune of this.queue) {
        this.renderTune(list, tune);
      }
    }

    this.renderScoreReference(container);
  }

  private renderTune(container: HTMLElement, tune: Tune): void {
    const item = buildReviewQueueItemModel(tune);
    const listItem = container.createEl("li", {
      cls: "folk-tune-review-queue-item",
    });
    listItem.createEl("h3", { text: item.title });
    const metadata = listItem.createDiv({
      cls: "folk-tune-review-metadata",
    });

    this.renderMetadata(metadata, "Key", item.keys);
    this.renderMetadata(metadata, "Origin", item.origin);
    this.renderMetadata(metadata, "Composer", item.composer);
  }

  private renderMetadata(
    container: HTMLElement,
    label: string,
    value: string | undefined,
  ): void {
    if (value === undefined) {
      return;
    }

    const row = container.createDiv({ cls: "folk-tune-review-metadata-row" });
    row.createEl("span", {
      cls: "folk-tune-review-metadata-label",
      text: `${label}:`,
    });
    row.createEl("span", { text: value });
  }

  private renderScoreReference(container: HTMLElement): void {
    const section = container.createEl("section", {
      cls: "folk-tune-review-score-reference",
    });
    section.createEl("h3", { text: "Score intervals" });
    section.createEl("p", {
      text: "Score controls will be enabled in the review-session phase.",
    });
    const grid = section.createDiv({ cls: "folk-tune-review-score-grid" });

    for (const interval of buildScoreIntervalModels()) {
      grid.createEl("div", {
        cls: "folk-tune-review-score",
        text: interval.label,
      });
    }
  }
}
