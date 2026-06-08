import { Notice, Plugin, type WorkspaceLeaf } from "obsidian";

import {
  buildReviewQueue,
  type BuildReviewQueueOptions,
} from "./application/build-review-queue";
import { TuneFolderNotFoundError } from "./application/tune-folder-not-found-error";
import type { Tune } from "./domain/tune";
import { ObsidianNoteOpener } from "./obsidian/obsidian-note-opener";
import { ObsidianTuneRepository } from "./obsidian/obsidian-tune-repository";
import { SystemClock } from "./obsidian/system-clock";
import {
  DEFAULT_SETTINGS,
  mergePluginSettings,
  type PluginSettings,
} from "./settings/plugin-settings";
import {
  REVIEW_QUEUE_VIEW_TYPE,
  ReviewQueueView,
} from "./ui/review-queue-view";
import { ReviewStartModal } from "./ui/review-start-modal";
import { FolkTuneReviewSettingsTab } from "./ui/settings-tab";

export default class FolkTuneReviewPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  override async onload(): Promise<void> {
    this.settings = mergePluginSettings(await this.loadData());

    this.registerView(
      REVIEW_QUEUE_VIEW_TYPE,
      (leaf) =>
        new ReviewQueueView(leaf, async (tune) => {
          try {
            await new ObsidianNoteOpener(this.app).openTune(tune);
          } catch {
            new Notice("Could not open tune note. It may have been moved or deleted.");
          }
        }),
    );
    this.addSettingTab(new FolkTuneReviewSettingsTab(this));
    this.addCommand({
      id: "start-review",
      name: "Start review",
      callback: () => {
        new ReviewStartModal(
          this.app,
          {
            count: this.settings.defaultReviewCount,
            includeExcluded: this.settings.includeExcludedByDefault,
            includeSessionMaintained:
              this.settings.includeSessionMaintainedByDefault,
          },
          async (options) => this.buildAndShowQueue(options),
        ).open();
      },
    });
  }

  async updateSettings(changes: Partial<PluginSettings>): Promise<void> {
    this.settings = mergePluginSettings({
      ...this.settings,
      ...changes,
    });
    await this.saveData(this.settings);
  }

  private async buildAndShowQueue(
    options: BuildReviewQueueOptions,
  ): Promise<boolean> {
    try {
      const queue = await buildReviewQueue(
        new ObsidianTuneRepository(this.app, this.settings.tuneFolder),
        new SystemClock(),
        options,
      );
      await this.showQueue(queue);
      return true;
    } catch (error) {
      if (error instanceof TuneFolderNotFoundError) {
        new Notice("Tune folder not found. Open settings or run Initialize vault.");
        return false;
      }

      new Notice("Could not build review queue. Check tune metadata and try again.");
      return false;
    }
  }

  private async showQueue(queue: readonly Tune[]): Promise<void> {
    const leaf = this.getQueueLeaf();
    await leaf.setViewState({
      active: true,
      type: REVIEW_QUEUE_VIEW_TYPE,
    });
    await this.app.workspace.revealLeaf(leaf);

    if (leaf.view instanceof ReviewQueueView) {
      leaf.view.setQueue(queue);
    }
  }

  private getQueueLeaf(): WorkspaceLeaf {
    return (
      this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE)[0] ??
      this.app.workspace.getLeaf("tab")
    );
  }
}
