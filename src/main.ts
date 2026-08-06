import { Notice, Plugin, TFile, type WorkspaceLeaf } from "obsidian";

import {
  buildReviewQueue,
} from "./application/build-review-queue";
import {
  applyVaultInitializationPlan,
  buildVaultInitializationPlan,
} from "./application/initialize-vault";
import { buildTuneStats } from "./application/build-tune-stats";
import { TuneFolderNotFoundError } from "./application/tune-folder-not-found-error";
import type { ReviewMode } from "./domain/review-mode";
import type { MostOverdueTune } from "./domain/tune-stats";
import type { Tune } from "./domain/tune";
import {
  getCurrentTuneReviewValidationMessage,
  validateCurrentTuneReviewCandidate,
} from "./obsidian/current-tune-review-candidate";
import { ObsidianNoteOpener } from "./obsidian/obsidian-note-opener";
import { ObsidianNoteReader } from "./obsidian/obsidian-note-reader";
import { ObsidianReviewWriter } from "./obsidian/obsidian-review-writer";
import { ObsidianTuneRepository } from "./obsidian/obsidian-tune-repository";
import { ObsidianVaultInitializer } from "./obsidian/obsidian-vault-initializer";
import { SystemClock } from "./obsidian/system-clock";
import { DEFAULT_VAULT_SEED } from "./seed/default-vault-seed";
import {
  DEFAULT_SETTINGS,
  mergePluginSettings,
  type PluginSettings,
} from "./settings/plugin-settings";
import {
  REVIEW_QUEUE_VIEW_TYPE,
  ReviewQueueView,
} from "./ui/review-queue-view";
import { CurrentTuneReviewModal } from "./ui/current-tune-review-modal";
import { InitializeVaultModal } from "./ui/initialize-vault-modal";
import { NotePreviewModal } from "./ui/note-preview-modal";
import { ReviewStartModal } from "./ui/review-start-modal";
import type { ReviewStartRequest } from "./ui/review-start-modal";
import { FolkTuneReviewSettingsTab } from "./ui/settings-tab";
import { TuneStatsModal } from "./ui/tune-stats-modal";

export default class FolkTuneReviewPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  override async onload(): Promise<void> {
    this.settings = mergePluginSettings(await this.loadData());

    this.registerView(
      REVIEW_QUEUE_VIEW_TYPE,
      (leaf) =>
        new ReviewQueueView(
          leaf,
          new SystemClock(),
          new ObsidianReviewWriter(this.app),
          async (tune) => {
            try {
              const note = await new ObsidianNoteReader(this.app).readTune(tune);
              new NotePreviewModal(this.app, note).open();
            } catch {
              new Notice(
                "Could not preview tune note. It may have been moved or deleted.",
              );
            }
          },
          async (tune) => {
            try {
              await new ObsidianNoteOpener(this.app).openTune(tune);
            } catch {
              new Notice(
                "Could not open tune note. It may have been moved or deleted.",
              );
            }
          },
          () => {
            new Notice(
              "Cannot update review metadata for this tune. The note may have invalid frontmatter.",
            );
          },
        ),
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
            devTestMode: this.settings.devTestMode,
            includeExcluded: this.settings.includeExcludedByDefault,
            includeSessionMaintained:
              this.settings.includeSessionMaintainedByDefault,
            mode: "live",
            prioritiseNeverReviewed: false,
          },
          async (request) => this.buildAndShowQueue(request),
        ).open();
      },
    });
    this.addCommand({
      id: "review-current-tune",
      name: "Add review to current tune",
      callback: () => {
        this.openCurrentTuneReview();
      },
    });
    this.addCommand({
      id: "show-stats",
      name: "Show stats",
      callback: () => {
        void this.openStats();
      },
    });
    this.addCommand({
      id: "initialize-vault",
      name: "Admin - Initialize vault",
      callback: () => {
        void this.openInitializeVault();
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
    request: ReviewStartRequest,
  ): Promise<boolean> {
    try {
      const queue = await buildReviewQueue(
        new ObsidianTuneRepository(this.app, this.settings.tuneFolder),
        new SystemClock(),
        request.selectionOptions,
      );
      await this.showQueue(queue, request.mode);
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

  private async showQueue(
    queue: readonly Tune[],
    mode: ReviewMode,
  ): Promise<void> {
    const leaf = this.getQueueLeaf();
    await leaf.setViewState({
      active: true,
      type: REVIEW_QUEUE_VIEW_TYPE,
    });
    await this.app.workspace.revealLeaf(leaf);

    if (leaf.view instanceof ReviewQueueView) {
      leaf.view.setQueue(queue, mode);
    }
  }

  private getQueueLeaf(): WorkspaceLeaf {
    return (
      this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE)[0] ??
      this.app.workspace.getLeaf("tab")
    );
  }

  private openCurrentTuneReview(): void {
    const activeFile = this.app.workspace.getActiveFile();
    const candidate = validateCurrentTuneReviewCandidate(
      activeFile === null
        ? undefined
        : {
            basename: activeFile.basename,
            frontmatter:
              this.app.metadataCache.getFileCache(activeFile)?.frontmatter,
            path: activeFile.path,
          },
      this.settings.tuneFolder,
    );

    if (candidate.type === "invalid") {
      new Notice(
        getCurrentTuneReviewValidationMessage(
          candidate,
          this.settings.tuneFolder,
        ),
      );
      return;
    }

    new CurrentTuneReviewModal(
      this.app,
      candidate.tune,
      new SystemClock(),
      new ObsidianReviewWriter(this.app),
      () => {
        new Notice(
          "Cannot update review metadata for this tune. The note may have invalid frontmatter.",
        );
      },
    ).open();
  }

  private async openStats(): Promise<void> {
    try {
      const stats = await buildTuneStats(
        new ObsidianTuneRepository(this.app, this.settings.tuneFolder),
        new SystemClock(),
      );
      new TuneStatsModal(this.app, stats, async (tune) => {
        await this.openStatsTune(tune);
      }).open();
    } catch (error) {
      if (error instanceof TuneFolderNotFoundError) {
        new Notice("Tune folder not found. Open settings or run Initialize vault.");
        return;
      }

      new Notice("Could not build tune stats. Check tune metadata and try again.");
    }
  }

  private async openStatsTune(tune: MostOverdueTune): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(tune.path);
    if (!(file instanceof TFile)) {
      new Notice("Could not open tune note. It may have been moved or deleted.");
      return;
    }

    await this.app.workspace.getLeaf("tab").openFile(file);
  }

  private async openInitializeVault(): Promise<void> {
    const initializer = new ObsidianVaultInitializer(this.app);

    try {
      const plan = await buildVaultInitializationPlan(
        initializer,
        DEFAULT_VAULT_SEED,
      );
      new InitializeVaultModal(this.app, plan, async (planToApply) => {
        return applyVaultInitializationPlan(initializer, planToApply);
      }).open();
    } catch {
      new Notice("Could not inspect vault for initialization.");
    }
  }
}
