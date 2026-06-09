import type { App } from "obsidian";

import type { Tune } from "../domain/tune";
import type { NoteContent, NoteReader } from "../ports/note-reader";

export class ObsidianNoteReader implements NoteReader {
  constructor(private readonly app: Pick<App, "vault">) {}

  async readTune(tune: Tune): Promise<NoteContent> {
    const file = this.app.vault.getFileByPath(tune.path);
    if (file === null) {
      throw new Error(`Tune note not found: ${tune.path}`);
    }

    return {
      markdown: await this.app.vault.cachedRead(file),
      sourcePath: file.path,
      title: tune.title,
    };
  }
}
