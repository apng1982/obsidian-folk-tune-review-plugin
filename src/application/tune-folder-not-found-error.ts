export class TuneFolderNotFoundError extends Error {
  constructor(readonly folderPath: string) {
    super(`Tune folder not found: ${folderPath}`);
    this.name = "TuneFolderNotFoundError";
  }
}
