import type {
  CreatedTemplateNote,
  TemplateNoteCreationRequest,
  TemplateNoteCreator,
} from "../ports/template-note-creator";

export type StandardTemplateNoteKind = "tune" | "set" | "composer";

const STANDARD_TEMPLATE_NOTE_REQUESTS = {
  tune: {
    destinationFolder: "Repertoire/Tunes",
    templatePath: "Templates/Tune Template.md",
    untitledName: "Untitled",
  },
  set: {
    destinationFolder: "Repertoire/Sets",
    templatePath: "Templates/Set Template.md",
    untitledName: "Untitled",
  },
  composer: {
    destinationFolder: "Ref/Composer",
    templatePath: "Templates/Composer Template.md",
    untitledName: "Untitled",
  },
} as const satisfies Record<
  StandardTemplateNoteKind,
  TemplateNoteCreationRequest
>;

export function getStandardTemplateNoteRequest(
  kind: StandardTemplateNoteKind,
): TemplateNoteCreationRequest {
  return STANDARD_TEMPLATE_NOTE_REQUESTS[kind];
}

export function createStandardNoteFromTemplate(
  creator: TemplateNoteCreator,
  kind: StandardTemplateNoteKind,
): Promise<CreatedTemplateNote> {
  return creator.createNoteFromTemplate(getStandardTemplateNoteRequest(kind));
}
