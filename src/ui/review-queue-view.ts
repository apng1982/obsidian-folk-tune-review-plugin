import { ItemView, type WorkspaceLeaf } from "obsidian";

import { ReviewSessionController } from "../application/review-session-controller";
import type { ReviewMode } from "../domain/review-mode";
import {
  getCurrentTune,
  summarizeReviewSession,
  type ReviewSession,
  type ReviewSessionItemOutcome,
} from "../domain/review-session";
import type { Tune } from "../domain/tune";
import type { Clock } from "../ports/clock";
import type { ReviewWriter } from "../ports/review-writer";
import {
  buildReviewQueueItemModel,
  buildScoreIntervalModels,
} from "./review-queue-model";

export const REVIEW_QUEUE_VIEW_TYPE = "folk-tune-review-queue";

export class ReviewQueueView extends ItemView {
  private queue: readonly Tune[] = [];
  private mode: ReviewMode = "live";
  private reviewSession?: ReviewSessionController;
  private writeInProgress = false;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly clock: Clock,
    private readonly writer: ReviewWriter,
    private readonly previewTune: (tune: Tune) => Promise<void>,
    private readonly openTune: (tune: Tune) => Promise<void>,
    private readonly onWriteError: () => void,
  ) {
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

  setQueue(queue: readonly Tune[], mode: ReviewMode): void {
    this.queue = queue;
    this.mode = mode;
    this.reviewSession = undefined;
    this.render();
  }

  private render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("folk-tune-review-view");

    container.createEl("h2", {
      text:
        this.reviewSession === undefined
          ? "Review queue"
          : this.mode === "live"
            ? "Live review"
            : "Dry-run review",
    });
    this.renderModeNotice(container);

    if (this.queue.length === 0) {
      container.createEl("p", {
        cls: "folk-tune-review-empty",
        text: "No eligible tunes matched these review options.",
      });
    } else if (this.reviewSession === undefined) {
      this.renderPreview(container);
    } else if (this.reviewSession.session.status === "active") {
      this.renderActiveSession(container, this.reviewSession.session);
    } else {
      this.renderRecap(container, this.reviewSession.session);
    }
  }

  private renderModeNotice(container: HTMLElement): void {
    container.createEl("p", {
      cls:
        this.mode === "live"
          ? "folk-tune-review-live"
          : "folk-tune-review-read-only",
      text:
        this.mode === "live"
          ? "Live review. Scoring a tune will update its review metadata."
          : "Dry run. No tune notes will be changed.",
    });
  }

  private renderPreview(container: HTMLElement): void {
    container.createEl("p", {
      text: `${this.queue.length} ${this.queue.length === 1 ? "tune" : "tunes"} selected.`,
    });
    this.renderActionButton(
      container,
      this.mode === "live" ? "Start live review" : "Start dry run",
      "folk-tune-review-primary-action",
      () => {
        this.reviewSession = new ReviewSessionController(
          this.queue,
          this.mode,
          this.clock,
          this.writer,
        );
        this.render();
      },
    );
    this.renderQueue(container);
    this.renderScoreReference(container);
  }

  private renderActiveSession(
    container: HTMLElement,
    session: ReviewSession,
  ): void {
    const currentTune = getCurrentTune(session);
    if (currentTune === undefined) {
      return;
    }

    const handledCount = session.items.filter(
      ({ outcome }) => outcome.type !== "pending",
    ).length;
    container.createEl("p", {
      cls: "folk-tune-review-progress",
      text: `Tune ${handledCount + 1} of ${session.items.length}`,
    });
    this.renderCurrentTune(container, currentTune);
    this.renderSessionControls(container);
    this.renderQueue(container, session);
  }

  private renderCurrentTune(container: HTMLElement, tune: Tune): void {
    const item = buildReviewQueueItemModel(tune);
    const section = container.createEl("section", {
      cls: "folk-tune-review-current",
    });
    section.createEl("h3", { text: item.title });
    const metadata = section.createDiv({
      cls: "folk-tune-review-metadata",
    });
    this.renderMetadata(metadata, "Key", item.keys);
    this.renderMetadata(metadata, "Origin", item.origin);
    this.renderMetadata(metadata, "Composer", item.composer);
    this.renderNoteActions(section, tune);
  }

  private renderSessionControls(container: HTMLElement): void {
    const section = container.createEl("section", {
      cls: "folk-tune-review-session-controls",
    });
    section.createEl("h3", { text: "Choose a score" });
    if (this.writeInProgress) {
      section.createEl("p", { text: "Saving review metadata..." });
    }
    const scoreGrid = section.createDiv({
      cls: "folk-tune-review-score-grid folk-tune-review-score-controls",
    });

    for (const interval of buildScoreIntervalModels()) {
      this.renderActionButton(
        scoreGrid,
        interval.label,
        "folk-tune-review-score-button",
        () => void this.scoreCurrentTune(interval.score),
        this.writeInProgress,
      );
    }

    const secondaryActions = section.createDiv({
      cls: "folk-tune-review-secondary-actions",
    });
    this.renderActionButton(secondaryActions, "Skip tune", "", () => {
      if (this.reviewSession !== undefined) {
        this.reviewSession.skip();
        this.render();
      }
    }, this.writeInProgress);
    this.renderActionButton(
      secondaryActions,
      this.mode === "live" ? "End review" : "End dry run",
      "folk-tune-review-end-action",
      () => {
        if (this.reviewSession !== undefined) {
          this.reviewSession.end();
          this.render();
        }
      },
      this.writeInProgress,
    );
  }

  private async scoreCurrentTune(score: number): Promise<void> {
    if (this.reviewSession === undefined || this.writeInProgress) {
      return;
    }

    this.writeInProgress = true;
    this.render();
    try {
      await this.reviewSession.score(score);
    } catch {
      this.onWriteError();
    } finally {
      this.writeInProgress = false;
      this.render();
    }
  }

  private renderRecap(container: HTMLElement, session: ReviewSession): void {
    const summary = summarizeReviewSession(session, this.mode);
    const section = container.createEl("section", {
      cls: "folk-tune-review-recap",
    });
    section.createEl("h3", {
      text: this.mode === "live" ? "Review recap" : "Dry-run recap",
    });
    section.createEl("p", {
      cls:
        this.mode === "live"
          ? "folk-tune-review-live"
          : "folk-tune-review-read-only",
      text: summary.message,
    });
    const list = section.createEl("dl", {
      cls: "folk-tune-review-summary",
    });
    this.renderSummaryValue(list, "Selected", summary.total);
    this.renderSummaryValue(list, "Scored", summary.scored);
    this.renderSummaryValue(list, "Skipped", summary.skipped);
    this.renderSummaryValue(list, "Unreviewed", summary.unreviewed);
    this.renderActionButton(section, "Return to queue preview", "", () => {
      this.reviewSession = undefined;
      this.render();
    });
    this.renderQueue(container, session);
  }

  private renderSummaryValue(
    container: HTMLElement,
    label: string,
    value: number,
  ): void {
    const row = container.createDiv({
      cls: "folk-tune-review-summary-row",
    });
    row.createEl("dt", { text: label });
    row.createEl("dd", { text: value.toString() });
  }

  private renderQueue(
    container: HTMLElement,
    session?: ReviewSession,
  ): void {
    const heading = container.createEl("h3", { text: "Full queue" });
    heading.addClass("folk-tune-review-queue-heading");
    const list = container.createEl("ol", {
      cls: "folk-tune-review-queue",
    });

    for (const [index, tune] of this.queue.entries()) {
      this.renderTune(
        list,
        tune,
        session?.items[index]?.outcome,
        session?.currentIndex === index,
      );
    }
  }

  private renderTune(
    container: HTMLElement,
    tune: Tune,
    outcome?: ReviewSessionItemOutcome,
    isCurrent = false,
  ): void {
    const item = buildReviewQueueItemModel(tune);
    const classes = ["folk-tune-review-queue-item"];
    if (isCurrent) {
      classes.push("is-current");
    }
    if (outcome !== undefined) {
      classes.push(`is-${outcome.type}`);
    }
    const listItem = container.createEl("li", {
      cls: classes.join(" "),
    });
    const heading = listItem.createDiv({
      cls: "folk-tune-review-queue-item-heading",
    });
    heading.createEl("h4", { text: item.title });
    if (outcome !== undefined) {
      heading.createEl("span", {
        cls: "folk-tune-review-outcome",
        text: this.getOutcomeLabel(outcome, isCurrent),
      });
    }
    const metadata = listItem.createDiv({
      cls: "folk-tune-review-metadata",
    });

    this.renderMetadata(metadata, "Key", item.keys);
    this.renderMetadata(metadata, "Origin", item.origin);
    this.renderMetadata(metadata, "Composer", item.composer);
    this.renderNoteActions(listItem, tune);
  }

  private renderNoteActions(container: HTMLElement, tune: Tune): void {
    const actions = container.createDiv({
      cls: "folk-tune-review-note-actions",
    });
    this.renderActionButton(
      actions,
      "Preview",
      "",
      () => {
        void this.previewTune(tune);
      },
    );
    this.renderActionButton(
      actions,
      "Open in new tab",
      "",
      () => {
        void this.openTune(tune);
      },
    );
  }

  private getOutcomeLabel(
    outcome: ReviewSessionItemOutcome,
    isCurrent: boolean,
  ): string {
    if (isCurrent) {
      return "Current";
    }

    switch (outcome.type) {
      case "scored":
        return `Score ${outcome.score}`;
      case "skipped":
        return "Skipped";
      case "pending":
        return "Pending";
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

  private renderScoreReference(container: HTMLElement): void {
    const section = container.createEl("section", {
      cls: "folk-tune-review-score-reference",
    });
    section.createEl("h3", { text: "Score intervals" });
    const grid = section.createDiv({ cls: "folk-tune-review-score-grid" });

    for (const interval of buildScoreIntervalModels()) {
      grid.createEl("div", {
        cls: "folk-tune-review-score",
        text: interval.label,
      });
    }
  }
}
