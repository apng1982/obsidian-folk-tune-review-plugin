import {
  Component,
  MarkdownRenderer,
  Modal,
  type App,
} from "obsidian";

import type { NoteContent } from "../ports/note-reader";

export class NotePreviewModal extends Modal {
  private readonly renderComponent = new Component();

  constructor(
    app: App,
    private readonly note: NoteContent,
  ) {
    super(app);
  }

  override async onOpen(): Promise<void> {
    this.setTitle(this.note.title);
    this.contentEl.addClass(
      "folk-tune-review-note-preview",
      "markdown-rendered",
    );
    this.renderComponent.load();
    await MarkdownRenderer.render(
      this.app,
      this.note.markdown,
      this.contentEl,
      this.note.sourcePath,
      this.renderComponent,
    );
  }

  override onClose(): void {
    this.renderComponent.unload();
    this.contentEl.empty();
  }
}
