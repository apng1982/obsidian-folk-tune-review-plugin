import { Modal, Notice, Setting } from "obsidian";

import {
  hasInitializationChanges,
  type InitializationPlan,
} from "../domain/initialization-plan";
import type { InitializationApplyResult } from "../ports/vault-initializer";

export class InitializeVaultModal extends Modal {
  private applyInProgress = false;
  private applyResult?: InitializationApplyResult;

  constructor(
    app: ConstructorParameters<typeof Modal>[0],
    private readonly plan: InitializationPlan,
    private readonly onApply: (
      plan: InitializationPlan,
    ) => Promise<InitializationApplyResult>,
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
    this.setTitle("Initialize folk tune vault");
    this.contentEl.empty();
    this.contentEl.addClass("folk-tune-review-view");
    this.contentEl.addClass("folk-tune-review-initialize");

    if (this.applyResult !== undefined) {
      this.renderApplyResult(this.applyResult);
      return;
    }

    this.contentEl.createEl("p", {
      text: "Preview the folders and seed files to create.",
    });
    this.renderPlanSummary();
    this.renderPathGroup("Folders to create", this.plan.foldersToCreate);
    this.renderPathGroup(
      "Files to create",
      this.plan.filesToCreate.map((file) => file.path),
    );
    this.renderPathGroup("Existing folders", this.plan.existingFolders);
    this.renderPathGroup(
      "Existing files",
      this.plan.existingFiles.map((file) => file.path),
    );
    this.renderActions();
  }

  private renderPlanSummary(): void {
    const list = this.contentEl.createEl("dl", {
      cls: "folk-tune-review-summary folk-tune-review-initialize-summary",
    });

    this.renderSummaryValue(list, "Folders to create", this.plan.foldersToCreate.length);
    this.renderSummaryValue(list, "Files to create", this.plan.filesToCreate.length);
    this.renderSummaryValue(list, "Existing folders", this.plan.existingFolders.length);
    this.renderSummaryValue(list, "Existing files", this.plan.existingFiles.length);
  }

  private renderActions(): void {
    if (!hasInitializationChanges(this.plan)) {
      this.contentEl.createEl("p", {
        cls: "folk-tune-review-read-only",
        text: "Vault initialization is already up to date. No changes are needed.",
      });
      return;
    }

    let applyButton: HTMLButtonElement | undefined;
    new Setting(this.contentEl).addButton((button) => {
      button
        .setButtonText(this.applyInProgress ? "Applying..." : "Apply changes")
        .setCta()
        .onClick(() => void this.apply());
      button.setDisabled(this.applyInProgress);
      applyButton = button.buttonEl;
    });

    window.setTimeout(() => applyButton?.focus({ preventScroll: true }), 0);
  }

  private renderApplyResult(result: InitializationApplyResult): void {
    this.contentEl.createEl("p", {
      cls: "folk-tune-review-live",
      text: "Vault initialization complete.",
    });
    const list = this.contentEl.createEl("dl", {
      cls: "folk-tune-review-summary folk-tune-review-initialize-summary",
    });
    this.renderSummaryValue(list, "Folders created", result.foldersCreated);
    this.renderSummaryValue(list, "Files created", result.filesCreated);
    this.renderSummaryValue(list, "Existing folders skipped", this.plan.existingFolders.length);
    this.renderSummaryValue(list, "Existing files skipped", this.plan.existingFiles.length);
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

  private renderPathGroup(label: string, paths: readonly string[]): void {
    const details = this.contentEl.createEl("details", {
      cls: "folk-tune-review-initialize-paths",
    });
    details.createEl("summary", {
      text: `${label}: ${paths.length}`,
    });

    if (paths.length === 0) {
      details.createEl("p", {
        cls: "folk-tune-review-empty",
        text: "None.",
      });
      return;
    }

    const list = details.createEl("ul");
    for (const path of paths) {
      list.createEl("li", { text: path });
    }
  }

  private async apply(): Promise<void> {
    if (this.applyInProgress) {
      return;
    }

    this.applyInProgress = true;
    this.render();
    try {
      this.applyResult = await this.onApply(this.plan);
    } catch {
      new Notice("Could not initialize vault. Some paths may already exist.");
    } finally {
      this.applyInProgress = false;
      this.render();
    }
  }
}
