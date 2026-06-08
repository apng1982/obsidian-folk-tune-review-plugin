import type { App, TFile } from "obsidian";

import { TuneFolderNotFoundError } from "../application/tune-folder-not-found-error";
import type { Tune } from "../domain/tune";
import type { TuneRepository } from "../ports/tune-repository";
import { mapFrontmatterToTune } from "./frontmatter-to-tune";
import { isDirectChildPath, normalizeVaultPath } from "./vault-path";

export class ObsidianTuneRepository implements TuneRepository {
  constructor(
    private readonly app: Pick<App, "metadataCache" | "vault">,
    private readonly tuneFolder: string,
  ) {}

  getTunes(): Promise<Tune[]> {
    const normalizedTuneFolder = normalizeVaultPath(this.tuneFolder);
    if (this.app.vault.getFolderByPath(normalizedTuneFolder) === null) {
      return Promise.reject(new TuneFolderNotFoundError(normalizedTuneFolder));
    }

    const tunes = this.app.vault
      .getMarkdownFiles()
      .filter((file) => isDirectChildPath(file.path, normalizedTuneFolder))
      .map((file) => this.mapFile(file))
      .filter((tune): tune is Tune => tune !== undefined);

    return Promise.resolve(tunes);
  }

  private mapFile(file: TFile): Tune | undefined {
    return mapFrontmatterToTune(
      {
        path: file.path,
        title: file.basename,
      },
      this.app.metadataCache.getFileCache(file)?.frontmatter,
    );
  }
}
