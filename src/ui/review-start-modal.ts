import { Modal, Notice, Setting } from "obsidian";

import type { BuildReviewQueueOptions } from "../application/build-review-queue";
import type { ReviewMode } from "../domain/review-mode";

export interface ReviewStartDefaults {
  readonly count: number;
  readonly devTestMode: boolean;
  readonly includeExcluded: boolean;
  readonly includeSessionMaintained: boolean;
  readonly mode: ReviewMode;
  readonly prioritiseNeverReviewed: boolean;
}

export interface ReviewStartRequest {
  readonly mode: ReviewMode;
  readonly selectionOptions: BuildReviewQueueOptions;
}

export class ReviewStartModal extends Modal {
  private count: number;
  private devTestMode: boolean;
  private includeExcluded: boolean;
  private includeSessionMaintained: boolean;
  private mode: ReviewMode;
  private originFilter = "";
  private prioritiseNeverReviewed: boolean;

  constructor(
    app: ConstructorParameters<typeof Modal>[0],
    defaults: ReviewStartDefaults,
    private readonly onBuildQueue: (request: ReviewStartRequest) => Promise<boolean>,
  ) {
    super(app);
    this.count = defaults.count;
    this.devTestMode = defaults.devTestMode;
    this.includeExcluded = defaults.includeExcluded;
    this.includeSessionMaintained = defaults.includeSessionMaintained;
    this.mode = defaults.mode;
    this.prioritiseNeverReviewed = defaults.prioritiseNeverReviewed;
  }

  override onOpen(): void {
    this.setTitle("Build review queue");
    this.contentEl.addClass("folk-tune-review-setup");

    this.contentEl.createEl("p", {
      text: "Choose the tunes to include in this review.",
    });

    new Setting(this.contentEl)
      .setName("Number of tunes")
      .setDesc("Maximum number of tunes to include.")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.inputMode = "numeric";
        text.setValue(this.count.toString()).onChange((value) => {
          this.count = Number(value);
        });
      });

    new Setting(this.contentEl)
      .setName("Origin filter")
      .setDesc("Optional case-insensitive origin text.")
      .addText((text) => {
        text.setPlaceholder("For example, Irish").onChange((value) => {
          this.originFilter = value;
        });
      });

    new Setting(this.contentEl)
      .setName("Include session-maintained tunes")
      .addToggle((toggle) => {
        toggle
          .setValue(this.includeSessionMaintained)
          .onChange((value) => {
            this.includeSessionMaintained = value;
          });
      });

    new Setting(this.contentEl)
      .setName("Include excluded tunes")
      .addToggle((toggle) => {
        toggle.setValue(this.includeExcluded).onChange((value) => {
          this.includeExcluded = value;
        });
      });

    new Setting(this.contentEl)
      .setName("Prioritise never-reviewed tunes")
      .setDesc("Prioritise tunes that have never been reviewed over tunes currently due for review.")
      .addToggle((toggle) => {
        toggle.setValue(this.prioritiseNeverReviewed).onChange((value) => {
          this.prioritiseNeverReviewed = value;
        });
      });

    if (this.devTestMode) {
      new Setting(this.contentEl)
        .setName("Review mode")
        .setDesc("Live reviews update tune metadata. Dry runs write nothing.")
        .addDropdown((dropdown) => {
          dropdown
            .addOption("live", "Live review")
            .addOption("dry-run", "Dry run")
            .setValue(this.mode)
            .onChange((value) => {
              this.mode = value === "dry-run" ? "dry-run" : "live";
            });
        });
    }

    let buildQueueButton: HTMLButtonElement | undefined;
    new Setting(this.contentEl).addButton((button) => {
      button
        .setButtonText("Build queue")
        .setCta()
        .onClick(() => void this.submit());
      buildQueueButton = button.buttonEl;
    });

    window.setTimeout(() => buildQueueButton?.focus({ preventScroll: true }), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private async submit(): Promise<void> {
    if (!Number.isInteger(this.count) || this.count <= 0) {
      new Notice("Number of tunes must be a positive whole number.");
      return;
    }

    const queueBuilt = await this.onBuildQueue({
      mode: this.mode,
      selectionOptions: {
        count: this.count,
        includeExcluded: this.includeExcluded,
        includeSessionMaintained: this.includeSessionMaintained,
        originFilter: this.originFilter.trim() || undefined,
        prioritiseNeverReviewed: this.prioritiseNeverReviewed,
        randomize: true,
      },
    });
    if (queueBuilt) {
      this.close();
    }
  }
}
