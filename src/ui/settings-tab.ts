import { PluginSettingTab, Setting } from "obsidian";

import type FolkTuneReviewPlugin from "../main";

export class FolkTuneReviewSettingsTab extends PluginSettingTab {
  constructor(private readonly folkTuneReviewPlugin: FolkTuneReviewPlugin) {
    super(folkTuneReviewPlugin.app, folkTuneReviewPlugin);
  }

  override display(): void {
    const plugin = this.folkTuneReviewPlugin;
    this.containerEl.empty();
    this.containerEl.createEl("h2", { text: "Folk Tune Review" });

    new Setting(this.containerEl)
      .setName("Tune folder")
      .setDesc("Flat vault folder containing tune Markdown notes.")
      .addText((text) => {
        text.setValue(plugin.settings.tuneFolder).onChange(async (value) => {
          await plugin.updateSettings({ tuneFolder: value });
        });
      });

    new Setting(this.containerEl)
      .setName("Default review count")
      .setDesc("Default maximum number of tunes in a review queue.")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.inputMode = "numeric";
        text
          .setValue(plugin.settings.defaultReviewCount.toString())
          .onChange(async (value) => {
            await plugin.updateSettings({ defaultReviewCount: Number(value) });
          });
      });

    new Setting(this.containerEl)
      .setName("Include session-maintained by default")
      .addToggle((toggle) => {
        toggle
          .setValue(plugin.settings.includeSessionMaintainedByDefault)
          .onChange(async (value) => {
            await plugin.updateSettings({
              includeSessionMaintainedByDefault: value,
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Include excluded by default")
      .addToggle((toggle) => {
        toggle
          .setValue(plugin.settings.includeExcludedByDefault)
          .onChange(async (value) => {
            await plugin.updateSettings({ includeExcludedByDefault: value });
          });
      });

    new Setting(this.containerEl)
      .setName("Dev/test mode")
      .setDesc("Show advanced review testing controls.")
      .addToggle((toggle) => {
        toggle.setValue(plugin.settings.devTestMode).onChange(async (value) => {
          await plugin.updateSettings({ devTestMode: value });
        });
      });
  }
}
