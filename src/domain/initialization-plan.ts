export type VaultSeedFile = VaultSeedTextFile | VaultSeedBinaryFile;

export interface VaultSeedTextFile {
  readonly contentType: "text";
  readonly path: string;
  readonly text: string;
}

export interface VaultSeedBinaryFile {
  readonly base64: string;
  readonly contentType: "binary";
  readonly path: string;
}

export interface VaultSeed {
  readonly files: readonly VaultSeedFile[];
  readonly folders: readonly string[];
}

export interface VaultSnapshot {
  readonly filePaths: readonly string[];
  readonly folderPaths: readonly string[];
}

export interface InitializationPlan {
  readonly existingFiles: readonly VaultSeedFile[];
  readonly existingFolders: readonly string[];
  readonly filesToCreate: readonly VaultSeedFile[];
  readonly foldersToCreate: readonly string[];
}

export function buildInitializationPlan(
  seed: VaultSeed,
  snapshot: VaultSnapshot,
): InitializationPlan {
  const existingFilePaths = toPathSet(snapshot.filePaths);
  const existingFolderPaths = toPathSet(snapshot.folderPaths);
  const seedFolders = collectSeedFolders(seed);

  return {
    existingFiles: seed.files.filter((file) => existingFilePaths.has(file.path)),
    existingFolders: seedFolders.filter((path) => existingFolderPaths.has(path)),
    filesToCreate: seed.files.filter((file) => !existingFilePaths.has(file.path)),
    foldersToCreate: seedFolders.filter((path) => !existingFolderPaths.has(path)),
  };
}

export function hasInitializationChanges(plan: InitializationPlan): boolean {
  return plan.foldersToCreate.length > 0 || plan.filesToCreate.length > 0;
}

function collectSeedFolders(seed: VaultSeed): string[] {
  return Array.from(
    new Set([
      ...seed.folders.map(normalizeVaultPath),
      ...seed.files.flatMap((file) => getParentFolders(file.path)),
    ]),
  ).sort(comparePath);
}

function getParentFolders(path: string): string[] {
  const normalizedPath = normalizeVaultPath(path);
  const parts = normalizedPath.split("/");
  const folders: string[] = [];

  for (let index = 1; index < parts.length; index += 1) {
    folders.push(parts.slice(0, index).join("/"));
  }

  return folders;
}

function toPathSet(paths: readonly string[]): ReadonlySet<string> {
  return new Set(paths.map(normalizeVaultPath));
}

function normalizeVaultPath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
}

function comparePath(left: string, right: string): number {
  return left.localeCompare(right);
}
