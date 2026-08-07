import type { App } from "obsidian";

import {
  TemplateNoteDestinationFolderNotFoundError,
  TemplateNoteNotFoundError,
  type CreatedTemplateNote,
  type TemplateNoteCreationRequest,
  type TemplateNoteCreator,
} from "../ports/template-note-creator";
import { normalizeVaultPath } from "./vault-path";

export class ObsidianTemplateNoteCreator implements TemplateNoteCreator {
  constructor(private readonly app: Pick<App, "vault" | "workspace">) {}

  async createNoteFromTemplate(
    request: TemplateNoteCreationRequest,
  ): Promise<CreatedTemplateNote> {
    const templatePath = normalizeVaultPath(request.templatePath);
    const destinationFolder = normalizeVaultPath(request.destinationFolder);
    const templateFile = this.app.vault.getFileByPath(templatePath);

    if (templateFile === null) {
      throw new TemplateNoteNotFoundError(templatePath);
    }

    if (this.app.vault.getFolderByPath(destinationFolder) === null) {
      throw new TemplateNoteDestinationFolderNotFoundError(destinationFolder);
    }

    const content = await this.app.vault.cachedRead(templateFile);
    const path = this.getAvailableMarkdownPath(
      destinationFolder,
      request.untitledName,
    );
    const createdFile = await this.app.vault.create(path, content);

    await this.app.workspace.getLeaf("tab").openFile(createdFile);

    return {
      path: createdFile.path,
    };
  }

  private getAvailableMarkdownPath(folderPath: string, basename: string): string {
    let index = 0;

    while (true) {
      const suffix = index === 0 ? "" : ` ${index}`;
      const candidate = `${folderPath}/${basename}${suffix}.md`;

      if (this.app.vault.getAbstractFileByPath(candidate) === null) {
        return candidate;
      }

      index += 1;
    }
  }
}
