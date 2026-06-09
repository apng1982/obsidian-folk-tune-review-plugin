import { describe, expect, it, vi } from "vitest";

import type { Tune } from "../../src/domain/tune";
import { ObsidianNoteReader } from "../../src/obsidian/obsidian-note-reader";

describe("Obsidian note reader", () => {
  it("reads the tune note through the vault cache", async () => {
    const file = { path: "Tunes/Tunes/one.md" };
    const cachedRead = vi.fn().mockResolvedValue("# One");
    const reader = new ObsidianNoteReader({
      vault: {
        cachedRead,
        getFileByPath: vi.fn().mockReturnValue(file),
      },
    } as never);

    await expect(reader.readTune(tune("one"))).resolves.toEqual({
      markdown: "# One",
      sourcePath: file.path,
      title: "one",
    });
    expect(cachedRead).toHaveBeenCalledWith(file);
  });

  it("reports a missing tune note before attempting a read", async () => {
    const cachedRead = vi.fn();
    const reader = new ObsidianNoteReader({
      vault: {
        cachedRead,
        getFileByPath: () => null,
      },
    } as never);

    await expect(reader.readTune(tune("missing"))).rejects.toThrow(
      "Tune note not found",
    );
    expect(cachedRead).not.toHaveBeenCalled();
  });
});

function tune(id: string): Tune {
  return {
    id,
    keys: [],
    path: `Tunes/Tunes/${id}.md`,
    review: {
      excludedFromReview: false,
      sessionMaintained: false,
    },
    title: id,
  };
}
