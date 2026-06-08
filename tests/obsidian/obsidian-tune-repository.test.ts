import { describe, expect, it } from "vitest";

import { TuneFolderNotFoundError } from "../../src/application/tune-folder-not-found-error";
import { ObsidianTuneRepository } from "../../src/obsidian/obsidian-tune-repository";

describe("Obsidian tune repository", () => {
  it("maps valid Markdown files directly inside the configured flat folder", async () => {
    const directTune = file("Tunes/Tunes/Direct.md", "Direct");
    const nestedTune = file("Tunes/Tunes/Nested/Nested.md", "Nested");
    const otherTune = file("Other/Other.md", "Other");
    const malformedTune = file("Tunes/Tunes/Malformed.md", "Malformed");
    const app = {
      metadataCache: {
        getFileCache: (candidate: FakeFile) => ({
          frontmatter:
            candidate === malformedTune
              ? { review: { score: 9 } }
              : { id: candidate.basename.toLocaleLowerCase() },
        }),
      },
      vault: {
        getFolderByPath: () => ({ path: "Tunes/Tunes" }),
        getMarkdownFiles: () => [directTune, nestedTune, otherTune, malformedTune],
      },
    };

    const repository = new ObsidianTuneRepository(app as never, "/Tunes/Tunes/");

    await expect(repository.getTunes()).resolves.toMatchObject([
      {
        id: "direct",
        path: directTune.path,
        title: directTune.basename,
      },
    ]);
  });

  it("reports a missing configured tune folder distinctly", async () => {
    const app = {
      metadataCache: {
        getFileCache: () => null,
      },
      vault: {
        getFolderByPath: () => null,
        getMarkdownFiles: () => [],
      },
    };
    const repository = new ObsidianTuneRepository(app as never, "/Missing/");

    await expect(repository.getTunes()).rejects.toEqual(
      new TuneFolderNotFoundError("Missing"),
    );
  });
});

interface FakeFile {
  readonly basename: string;
  readonly path: string;
}

function file(path: string, basename: string): FakeFile {
  return { basename, path };
}
