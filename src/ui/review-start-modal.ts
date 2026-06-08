import { Modal, Notice, Setting } from "obsidian";

import type { BuildReviewQueueOptions } from "../application/build-review-queue";

export interface ReviewStartDefaults {
  readonly count: number;
  readonly includeExcluded: boolean;
  readonly includeSessionMaintained: boolean;
}

export class ReviewStartModal extends Modal {
  private count: number;
  private includeExcluded: boolean;
  private includeSessionMaintained: boolean;
  private originFilter = "";

  constructor(
    app: ConstructorParameters<typeof Modal>[0],
    defaults: ReviewStartDefaults,
    private readonly onBuildQueue: (
      options: BuildReviewQueueOptions,
    ) => Promise<boolean>,
  ) {
    super(app);
    this.count = defaults.count;
    this.includeExcluded = defaults.includeExcluded;
    this.includeSessionMaintained = defaults.includeSessionMaintained;
  }

  override onOpen(): void {
    this.setTitle("Build review queue");
    this.contentEl.addClass("folk-tune-review-setup");

    this.contentEl.createEl("p", {
      text: "Choose the tunes to include in this read-only queue preview.",
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
      count: this.count,
      includeExcluded: this.includeExcluded,
      includeSessionMaintained: this.includeSessionMaintained,
      originFilter: this.originFilter.trim() || undefined,
      randomize: true,
    });
    if (queueBuilt) {
      this.close();
    }
  }
}
