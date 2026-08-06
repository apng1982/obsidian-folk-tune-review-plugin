import type { App, TAbstractFile } from "obsidian";

import type {
  InitializationPlan,
  VaultSeedBinaryFile,
  VaultSeedFile,
} from "../domain/initialization-plan";
import type {
  InitializationApplyResult,
  VaultInitializer,
} from "../ports/vault-initializer";

export class ObsidianVaultInitializer implements VaultInitializer {
  constructor(private readonly app: Pick<App, "vault">) {}

  readSnapshot(): Promise<{
    readonly filePaths: readonly string[];
    readonly folderPaths: readonly string[];
  }> {
    return Promise.resolve({
      filePaths: this.app.vault.getFiles().map((file) => file.path),
      folderPaths: this.app.vault
        .getAllLoadedFiles()
        .filter(isFolderLike)
        .map((folder) => folder.path)
        .filter((path) => path.length > 0),
    });
  }

  async applyInitializationPlan(
    plan: InitializationPlan,
  ): Promise<InitializationApplyResult> {
    let foldersCreated = 0;
    let filesCreated = 0;

    for (const folderPath of sortFoldersForCreation(plan.foldersToCreate)) {
      if (this.app.vault.getFolderByPath(folderPath) === null) {
        await this.app.vault.createFolder(folderPath);
        foldersCreated += 1;
      }
    }

    for (const file of plan.filesToCreate) {
      if (this.app.vault.getFileByPath(file.path) !== null) {
        continue;
      }

      await this.createFile(file);
      filesCreated += 1;
    }

    return {
      filesCreated,
      foldersCreated,
    };
  }

  private async createFile(file: VaultSeedFile): Promise<void> {
    if (file.contentType === "text") {
      await this.app.vault.create(file.path, file.text);
      return;
    }

    await this.app.vault.createBinary(file.path, decodeBase64(file));
  }
}

function sortFoldersForCreation(paths: readonly string[]): string[] {
  return [...paths].sort((left, right) => {
    const depthComparison = getPathDepth(left) - getPathDepth(right);
    return depthComparison === 0 ? left.localeCompare(right) : depthComparison;
  });
}

function getPathDepth(path: string): number {
  return path.split("/").length;
}

function decodeBase64(file: VaultSeedBinaryFile): ArrayBuffer {
  const binary = atob(file.base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function isFolderLike(file: TAbstractFile): file is TAbstractFile {
  return "children" in file;
}
