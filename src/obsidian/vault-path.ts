export function normalizeVaultPath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
}

export function isDirectChildPath(filePath: string, folderPath: string): boolean {
  const normalizedFilePath = normalizeVaultPath(filePath);
  const normalizedFolderPath = normalizeVaultPath(folderPath);
  const lastSeparator = normalizedFilePath.lastIndexOf("/");
  const parentPath =
    lastSeparator === -1 ? "" : normalizedFilePath.slice(0, lastSeparator);

  return parentPath === normalizedFolderPath;
}
