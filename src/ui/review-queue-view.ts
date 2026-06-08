import { ItemView, type WorkspaceLeaf } from "obsidian";

import { DryRunReviewSession } from "../application/dry-run-review-session";
import {
  getCurrentTune,
  summarizeDryRunSession,
  type ReviewSession,
  type ReviewSessionItemOutcome,
} from "../domain/review-session";
import type { Tune } from "../domain/tune";
import {
  buildReviewQueueItemModel,
  buildScoreIntervalModels,
} from "./review-queue-model";

export const REVIEW_QUEUE_VIEW_TYPE = "folk-tune-review-queue";

export class ReviewQueueView extends ItemView {
  private queue: readonly Tune[] = [];
  private dryRun?: DryRunReviewSession;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly openTune: (tune: Tune) => Promise<void>,
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

  setQueue(queue: readonly Tune[]): void {
    this.queue = queue;
    this.dryRun = undefined;
    this.render();
  }

  private render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("folk-tune-review-view");

    container.createEl("h2", {
      text: this.dryRun === undefined ? "Review queue" : "Dry-run review",
    });
    this.renderDryRunNotice(container);

    if (this.queue.length === 0) {
      container.createEl("p", {
        cls: "folk-tune-review-empty",
        text: "No eligible tunes matched these review options.",
      });
    } else if (this.dryRun === undefined) {
      this.renderPreview(container);
    } else if (this.dryRun.session.status === "active") {
      this.renderActiveSession(container, this.dryRun.session);
    } else {
      this.renderRecap(container, this.dryRun.session);
    }
  }

  private renderDryRunNotice(container: HTMLElement): void {
    container.createEl("p", {
      cls: "folk-tune-review-read-only",
      text: "Dry run. No tune notes will be changed.",
    });
  }

  private renderPreview(container: HTMLElement): void {
    container.createEl("p", {
      text: `${this.queue.length} ${this.queue.length === 1 ? "tune" : "tunes"} selected.`,
    });
    this.renderActionButton(
      container,
      "Start dry run",
      "folk-tune-review-primary-action",
      () => {
        this.dryRun = new DryRunReviewSession(this.queue);
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
    this.renderActionButton(section, "Open note", "", () => {
      void this.openTune(tune);
    });
  }

  private renderSessionControls(container: HTMLElement): void {
    const section = container.createEl("section", {
      cls: "folk-tune-review-session-controls",
    });
    section.createEl("h3", { text: "Choose a score" });
    const scoreGrid = section.createDiv({
      cls: "folk-tune-review-score-grid folk-tune-review-score-controls",
    });

    for (const interval of buildScoreIntervalModels()) {
      this.renderActionButton(
        scoreGrid,
        interval.label,
        "folk-tune-review-score-button",
        () => {
          if (this.dryRun !== undefined) {
            this.dryRun.score(interval.score);
            this.render();
          }
        },
      );
    }

    const secondaryActions = section.createDiv({
      cls: "folk-tune-review-secondary-actions",
    });
    this.renderActionButton(secondaryActions, "Skip tune", "", () => {
      if (this.dryRun !== undefined) {
        this.dryRun.skip();
        this.render();
      }
    });
    this.renderActionButton(
      secondaryActions,
      "End dry run",
      "folk-tune-review-end-action",
      () => {
        if (this.dryRun !== undefined) {
          this.dryRun.end();
          this.render();
        }
      },
    );
  }

  private renderRecap(container: HTMLElement, session: ReviewSession): void {
    const summary = summarizeDryRunSession(session);
    const section = container.createEl("section", {
      cls: "folk-tune-review-recap",
    });
    section.createEl("h3", { text: "Dry-run recap" });
    section.createEl("p", {
      cls: "folk-tune-review-read-only",
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
      this.dryRun = undefined;
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
    this.renderActionButton(
      listItem,
      "Open note",
      "folk-tune-review-queue-open-note",
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
  ): void {
    const button = container.createEl("button", {
      cls: className,
      text: label,
      type: "button",
    });
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
