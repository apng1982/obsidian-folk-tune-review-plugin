import { describe, expect, it, vi } from "vitest";

import { ObsidianTemplateNoteCreator } from "../../src/obsidian/obsidian-template-note-creator";
import {
  TemplateNoteDestinationFolderNotFoundError,
  TemplateNoteNotFoundError,
} from "../../src/ports/template-note-creator";

describe("Obsidian template note creator", () => {
  it("copies the current vault template content into a new note and opens it", async () => {
    const templateFile = { path: "Templates/Tune Template.md" };
    const createdFile = { path: "Repertoire/Tunes/Untitled.md" };
    const openFile = vi.fn().mockResolvedValue(undefined);
    const create = vi.fn().mockResolvedValue(createdFile);
    const cachedRead = vi.fn().mockResolvedValue("---\nuser: edited\n---\n");
    const creator = new ObsidianTemplateNoteCreator({
      vault: {
        cachedRead,
        create,
        getAbstractFileByPath: vi.fn().mockReturnValue(null),
        getFileByPath: vi.fn().mockReturnValue(templateFile),
        getFolderByPath: vi.fn().mockReturnValue({ path: "Repertoire/Tunes" }),
      },
      workspace: {
        getLeaf: vi.fn().mockReturnValue({
          openFile,
        }),
      },
    } as never);

    await expect(
      creator.createNoteFromTemplate({
        destinationFolder: "Repertoire/Tunes",
        templatePath: "Templates/Tune Template.md",
        untitledName: "Untitled",
      }),
    ).resolves.toEqual({
      path: "Repertoire/Tunes/Untitled.md",
    });

    expect(cachedRead).toHaveBeenCalledWith(templateFile);
    expect(create).toHaveBeenCalledWith(
      "Repertoire/Tunes/Untitled.md",
      "---\nuser: edited\n---\n",
    );
    expect(openFile).toHaveBeenCalledWith(createdFile);
  });

  it("uses the next unique untitled path without overwriting an existing note", async () => {
    const create = vi.fn().mockResolvedValue({
      path: "Repertoire/Sets/Untitled 2.md",
    });
    const existingPaths = new Set([
      "Repertoire/Sets/Untitled.md",
      "Repertoire/Sets/Untitled 1.md",
    ]);
    const creator = new ObsidianTemplateNoteCreator({
      vault: {
        cachedRead: vi.fn().mockResolvedValue("set template"),
        create,
        getAbstractFileByPath: vi.fn().mockImplementation((path: string) =>
          existingPaths.has(path) ? { path } : null,
        ),
        getFileByPath: vi.fn().mockReturnValue({ path: "Templates/Set Template.md" }),
        getFolderByPath: vi.fn().mockReturnValue({ path: "Repertoire/Sets" }),
      },
      workspace: {
        getLeaf: vi.fn().mockReturnValue({
          openFile: vi.fn().mockResolvedValue(undefined),
        }),
      },
    } as never);

    await creator.createNoteFromTemplate({
      destinationFolder: "Repertoire/Sets",
      templatePath: "Templates/Set Template.md",
      untitledName: "Untitled",
    });

    expect(create).toHaveBeenCalledWith(
      "Repertoire/Sets/Untitled 2.md",
      "set template",
    );
  });

  it("normalizes template and destination paths before reading and creating", async () => {
    const getFileByPath = vi.fn().mockReturnValue({
      path: "Templates/Composer Template.md",
    });
    const getFolderByPath = vi.fn().mockReturnValue({
      path: "Ref/Composer",
    });
    const create = vi.fn().mockResolvedValue({
      path: "Ref/Composer/Untitled.md",
    });
    const creator = new ObsidianTemplateNoteCreator({
      vault: {
        cachedRead: vi.fn().mockResolvedValue("composer template"),
        create,
        getAbstractFileByPath: vi.fn().mockReturnValue(null),
        getFileByPath,
        getFolderByPath,
      },
      workspace: {
        getLeaf: vi.fn().mockReturnValue({
          openFile: vi.fn().mockResolvedValue(undefined),
        }),
      },
    } as never);

    await creator.createNoteFromTemplate({
      destinationFolder: "/Ref\\Composer/",
      templatePath: "/Templates\\Composer Template.md/",
      untitledName: "Untitled",
    });

    expect(getFileByPath).toHaveBeenCalledWith("Templates/Composer Template.md");
    expect(getFolderByPath).toHaveBeenCalledWith("Ref/Composer");
    expect(create).toHaveBeenCalledWith(
      "Ref/Composer/Untitled.md",
      "composer template",
    );
  });

  it("does not create a note when the template is missing", async () => {
    const create = vi.fn();
    const cachedRead = vi.fn();
    const openFile = vi.fn();
    const creator = new ObsidianTemplateNoteCreator({
      vault: {
        cachedRead,
        create,
        getAbstractFileByPath: vi.fn(),
        getFileByPath: vi.fn().mockReturnValue(null),
        getFolderByPath: vi.fn().mockReturnValue({ path: "Repertoire/Tunes" }),
      },
      workspace: {
        getLeaf: vi.fn().mockReturnValue({
          openFile,
        }),
      },
    } as never);

    await expect(
      creator.createNoteFromTemplate({
        destinationFolder: "Repertoire/Tunes",
        templatePath: "Templates/Tune Template.md",
        untitledName: "Untitled",
      }),
    ).rejects.toBeInstanceOf(TemplateNoteNotFoundError);
    expect(cachedRead).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(openFile).not.toHaveBeenCalled();
  });

  it("does not create a note when the destination folder is missing", async () => {
    const create = vi.fn();
    const cachedRead = vi.fn();
    const creator = new ObsidianTemplateNoteCreator({
      vault: {
        cachedRead,
        create,
        getAbstractFileByPath: vi.fn(),
        getFileByPath: vi.fn().mockReturnValue({
          path: "Templates/Tune Template.md",
        }),
        getFolderByPath: vi.fn().mockReturnValue(null),
      },
      workspace: {
        getLeaf: vi.fn(),
      },
    } as never);

    await expect(
      creator.createNoteFromTemplate({
        destinationFolder: "Repertoire/Tunes",
        templatePath: "Templates/Tune Template.md",
        untitledName: "Untitled",
      }),
    ).rejects.toBeInstanceOf(TemplateNoteDestinationFolderNotFoundError);
    expect(cachedRead).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
