import type { App, TAbstractFile } from "obsidian";

import type {
  InitializationPlan,
  VaultSeedBinaryFile,
  VaultSeedFile,
  VaultSeed,
} from "../domain/initialization-plan";
import type {
  InitializationApplyResult,
  VaultInitializer,
} from "../ports/vault-initializer";

export class ObsidianVaultInitializer implements VaultInitializer {
  constructor(private readonly app: Pick<App, "vault">) {}

  async readSnapshot(seed: VaultSeed): Promise<{
    readonly filePaths: readonly string[];
    readonly folderPaths: readonly string[];
  }> {
    const filePaths = new Set(this.app.vault.getFiles().map((file) => file.path));
    const folderPaths = new Set(
      this.app.vault
        .getAllLoadedFiles()
        .filter(isFolderLike)
        .map((folder) => folder.path)
        .filter((path) => path.length > 0),
    );

    for (const file of seed.files) {
      if (await this.pathExists(file.path)) {
        filePaths.add(file.path);
      }
    }

    for (const folderPath of seed.folders) {
      if (await this.pathExists(folderPath)) {
        folderPaths.add(folderPath);
      }
    }

    return {
      filePaths: Array.from(filePaths),
      folderPaths: Array.from(folderPaths),
    };
  }

  async applyInitializationPlan(
    plan: InitializationPlan,
  ): Promise<InitializationApplyResult> {
    let foldersCreated = 0;
    let filesCreated = 0;

    for (const folderPath of sortFoldersForCreation(plan.foldersToCreate)) {
      if (!(await this.pathExists(folderPath))) {
        await this.createFolder(folderPath);
        foldersCreated += 1;
      }
    }

    for (const file of plan.filesToCreate) {
      if (await this.pathExists(file.path)) {
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
    if (isHiddenConfigPath(file.path)) {
      if (file.contentType === "text") {
        await this.app.vault.adapter.write(file.path, file.text);
        return;
      }

      await this.app.vault.adapter.writeBinary(file.path, decodeBase64(file));
      return;
    }

    if (file.contentType === "text") {
      await this.app.vault.create(file.path, file.text);
      return;
    }

    await this.app.vault.createBinary(file.path, decodeBase64(file));
  }

  private async createFolder(folderPath: string): Promise<void> {
    if (isHiddenConfigPath(folderPath)) {
      await this.app.vault.adapter.mkdir(folderPath);
      return;
    }

    await this.app.vault.createFolder(folderPath);
  }

  private async pathExists(path: string): Promise<boolean> {
    if (isHiddenConfigPath(path)) {
      return this.app.vault.adapter.exists(path);
    }

    return (
      this.app.vault.getFileByPath(path) !== null ||
      this.app.vault.getFolderByPath(path) !== null
    );
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

function isHiddenConfigPath(path: string): boolean {
  return path === ".obsidian" || path.startsWith(".obsidian/");
}
