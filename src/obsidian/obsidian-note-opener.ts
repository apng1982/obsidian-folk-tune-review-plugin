import { TFile, type App } from "obsidian";

import type { Tune } from "../domain/tune";
import type { NoteOpener } from "../ports/note-opener";

export class ObsidianNoteOpener implements NoteOpener {
  constructor(private readonly app: Pick<App, "vault" | "workspace">) {}

  async openTune(tune: Tune): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(tune.path);
    if (!(file instanceof TFile)) {
      throw new Error(`Tune note not found: ${tune.path}`);
    }

    await this.app.workspace.getLeaf("tab").openFile(file);
  }
}
