import { describe, expect, it, vi } from "vitest";

import {
  createStandardNoteFromTemplate,
  getStandardTemplateNoteRequest,
} from "../../src/application/create-note-from-template";

describe("create note from template application use case", () => {
  it("maps a new tune request to the tune template and destination folder", () => {
    expect(getStandardTemplateNoteRequest("tune")).toEqual({
      destinationFolder: "Repertoire/Tunes",
      templatePath: "Templates/Tune Template.md",
      untitledName: "Untitled",
    });
  });

  it("maps a new set request to the set template and destination folder", () => {
    expect(getStandardTemplateNoteRequest("set")).toEqual({
      destinationFolder: "Repertoire/Sets",
      templatePath: "Templates/Set Template.md",
      untitledName: "Untitled",
    });
  });

  it("maps a new composer request to the composer template and destination folder", () => {
    expect(getStandardTemplateNoteRequest("composer")).toEqual({
      destinationFolder: "Ref/Composer",
      templatePath: "Templates/Composer Template.md",
      untitledName: "Untitled",
    });
  });

  it("creates a standard note through the supplied port", async () => {
    const creator = {
      createNoteFromTemplate: vi.fn().mockResolvedValue({
        path: "Repertoire/Tunes/Untitled.md",
      }),
    };

    await expect(createStandardNoteFromTemplate(creator, "tune")).resolves.toEqual({
      path: "Repertoire/Tunes/Untitled.md",
    });
    expect(creator.createNoteFromTemplate).toHaveBeenCalledWith({
      destinationFolder: "Repertoire/Tunes",
      templatePath: "Templates/Tune Template.md",
      untitledName: "Untitled",
    });
  });
});
