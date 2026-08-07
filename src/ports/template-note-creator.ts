export interface TemplateNoteCreationRequest {
  readonly destinationFolder: string;
  readonly templatePath: string;
  readonly untitledName: string;
}

export interface CreatedTemplateNote {
  readonly path: string;
}

export interface TemplateNoteCreator {
  createNoteFromTemplate(
    request: TemplateNoteCreationRequest,
  ): Promise<CreatedTemplateNote>;
}

export class TemplateNoteNotFoundError extends Error {
  constructor(readonly templatePath: string) {
    super(`Template note not found: ${templatePath}`);
  }
}

export class TemplateNoteDestinationFolderNotFoundError extends Error {
  constructor(readonly destinationFolder: string) {
    super(`Template destination folder not found: ${destinationFolder}`);
  }
}
