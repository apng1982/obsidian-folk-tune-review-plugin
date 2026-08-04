import { Modal, Notice } from "obsidian";

import { createReviewState } from "../domain/review-state";
import type { Tune } from "../domain/tune";
import type { Clock } from "../ports/clock";
import type { ReviewFlag, ReviewWriter } from "../ports/review-writer";
import {
  buildCurrentTuneFlagActionModels,
  buildReviewQueueItemModel,
  buildScoreIntervalModels,
} from "./review-queue-model";

export class CurrentTuneReviewModal extends Modal {
  private writeInProgress = false;

  constructor(
    app: ConstructorParameters<typeof Modal>[0],
    private readonly tune: Tune,
    private readonly clock: Clock,
    private readonly writer: ReviewWriter,
    private readonly onWriteError: () => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.render();
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    this.setTitle("Add review to current tune");
    this.contentEl.empty();
    this.contentEl.addClass("folk-tune-review-view");

    const item = buildReviewQueueItemModel(this.tune);
    const currentTune = this.contentEl.createEl("section", {
      cls: "folk-tune-review-current",
    });
    currentTune.createEl("h3", { text: item.title });
    const metadata = currentTune.createDiv({
      cls: "folk-tune-review-metadata",
    });
    this.renderMetadata(metadata, "Key", item.keys);
    this.renderMetadata(metadata, "Origin", item.origin);
    this.renderMetadata(metadata, "Composer", item.composer);

    const controls = this.contentEl.createEl("section", {
      cls: "folk-tune-review-session-controls",
    });
    controls.createEl("h3", { text: "Choose a score" });
    if (this.writeInProgress) {
      controls.createEl("p", { text: "Saving review metadata..." });
    }

    const scoreGrid = controls.createDiv({
      cls: "folk-tune-review-score-grid folk-tune-review-score-controls",
    });
    for (const interval of buildScoreIntervalModels()) {
      this.renderActionButton(
        scoreGrid,
        interval.label,
        "folk-tune-review-score-button",
        () => void this.score(interval.score),
        this.writeInProgress,
      );
    }

    const secondaryActions = controls.createDiv({
      cls: "folk-tune-review-secondary-actions",
    });
    for (const action of buildCurrentTuneFlagActionModels(this.tune)) {
      this.renderActionButton(
        secondaryActions,
        action.label,
        "",
        () => void this.writeFlag(action.flag, action.value),
        this.writeInProgress,
      );
    }
  }

  private async score(score: number): Promise<void> {
    await this.writeCurrentTune(async () => {
      await this.writer.writeReview(
        this.tune,
        createReviewState(this.clock.today(), score),
      );
      new Notice(`Review updated for ${this.tune.title}.`);
    });
  }

  private async writeFlag(flag: ReviewFlag, value: boolean): Promise<void> {
    await this.writeCurrentTune(async () => {
      await this.writer.writeReviewFlag(this.tune, flag, value);
      new Notice(`Review flag updated for ${this.tune.title}.`);
    });
  }

  private async writeCurrentTune(write: () => Promise<void>): Promise<void> {
    if (this.writeInProgress) {
      return;
    }

    this.writeInProgress = true;
    this.render();
    try {
      await write();
      this.close();
    } catch {
      this.onWriteError();
      this.writeInProgress = false;
      this.render();
    }
  }

  private renderActionButton(
    container: HTMLElement,
    label: string,
    className: string,
    action: () => void,
    disabled = false,
  ): void {
    const button = container.createEl("button", {
      cls: className,
      text: label,
      type: "button",
    });
    button.disabled = disabled;
    button.addEventListener("click", action);
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
}
