import { describe, expect, it, vi } from "vitest";

import { ObsidianVaultInitializer } from "../../src/obsidian/obsidian-vault-initializer";
import type {
  InitializationPlan,
  VaultSeed,
} from "../../src/domain/initialization-plan";

describe("Obsidian vault initializer", () => {
  it("reads existing file and folder paths from the vault", async () => {
    const initializer = new ObsidianVaultInitializer({
      vault: {
        adapter: {
          exists: vi.fn().mockResolvedValue(false),
        },
        getAllLoadedFiles: () => [
          { path: "" },
          { children: [], path: "Templates" },
          { path: "Templates/Tune.md" },
        ],
        getFiles: () => [{ path: "Templates/Tune.md" }],
        getFileByPath: () => null,
        getFolderByPath: () => null,
      },
    } as never);

    await expect(initializer.readSnapshot(emptySeed())).resolves.toEqual({
      filePaths: ["Templates/Tune.md"],
      folderPaths: ["Templates"],
    });
  });

  it("detects existing hidden config seed paths through the vault adapter", async () => {
    const seed: VaultSeed = {
      files: [
        {
          contentType: "text",
          path: ".obsidian/snippets/hide-review-object.css",
          text: "",
        },
      ],
      folders: [".obsidian", ".obsidian/snippets"],
    };
    const initializer = new ObsidianVaultInitializer({
      vault: {
        adapter: {
          exists: vi.fn().mockImplementation((path: string) =>
            Promise.resolve(path.startsWith(".obsidian")),
          ),
        },
        getAllLoadedFiles: () => [],
        getFiles: () => [],
        getFileByPath: () => null,
        getFolderByPath: () => null,
      },
    } as never);

    await expect(initializer.readSnapshot(seed)).resolves.toEqual({
      filePaths: [".obsidian/snippets/hide-review-object.css"],
      folderPaths: [".obsidian", ".obsidian/snippets"],
    });
  });

  it("creates missing folders parent-first and then missing files", async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const createBinary = vi.fn().mockResolvedValue(undefined);
    const createFolder = vi.fn().mockResolvedValue(undefined);
    const initializer = new ObsidianVaultInitializer({
      vault: {
        adapter: {
          exists: vi.fn().mockResolvedValue(false),
          mkdir: vi.fn(),
          write: vi.fn(),
          writeBinary: vi.fn(),
        },
        create,
        createBinary,
        createFolder,
        getFileByPath: () => null,
        getFolderByPath: () => null,
      },
    } as never);

    await expect(
      initializer.applyInitializationPlan({
        existingFiles: [],
        existingFolders: [],
        filesToCreate: [
          {
            contentType: "text",
            path: "Templates/Tune.md",
            text: "template",
          },
          {
            base64: "AQID",
            contentType: "binary",
            path: "Repertoire/Dots/Tunes/example.png",
          },
        ],
        foldersToCreate: ["Repertoire/Dots/Tunes", "Templates", "Repertoire"],
      }),
    ).resolves.toEqual({
      filesCreated: 2,
      foldersCreated: 3,
    });

    const createdFolderPaths = createFolder.mock.calls.map(
      (call) => call[0] as string,
    );
    expect(createdFolderPaths).toEqual([
      "Repertoire",
      "Templates",
      "Repertoire/Dots/Tunes",
    ]);
    expect(create).toHaveBeenCalledWith("Templates/Tune.md", "template");
    expect(createBinary).toHaveBeenCalledWith(
      "Repertoire/Dots/Tunes/example.png",
      new Uint8Array([1, 2, 3]).buffer,
    );
  });

  it("creates hidden config folders and files through the vault adapter", async () => {
    const mkdir = vi.fn().mockResolvedValue(undefined);
    const write = vi.fn().mockResolvedValue(undefined);
    const initializer = new ObsidianVaultInitializer({
      vault: {
        adapter: {
          exists: vi.fn().mockResolvedValue(false),
          mkdir,
          write,
          writeBinary: vi.fn(),
        },
        create: vi.fn(),
        createBinary: vi.fn(),
        createFolder: vi.fn(),
        getFileByPath: () => null,
        getFolderByPath: () => null,
      },
    } as never);

    await expect(
      initializer.applyInitializationPlan({
        existingFiles: [],
        existingFolders: [],
        filesToCreate: [
          {
            contentType: "text",
            path: ".obsidian/snippets/hide-review-object.css",
            text: "css",
          },
        ],
        foldersToCreate: [".obsidian/snippets", ".obsidian"],
      }),
    ).resolves.toEqual({
      filesCreated: 1,
      foldersCreated: 2,
    });

    expect(mkdir.mock.calls.map((call) => call[0] as string)).toEqual([
      ".obsidian",
      ".obsidian/snippets",
    ]);
    expect(write).toHaveBeenCalledWith(
      ".obsidian/snippets/hide-review-object.css",
      "css",
    );
  });

  it("does not overwrite paths that already exist at apply time", async () => {
    const create = vi.fn();
    const createFolder = vi.fn();
    const plan: InitializationPlan = {
      existingFiles: [],
      existingFolders: [],
      filesToCreate: [
        {
          contentType: "text",
          path: "Templates/Tune.md",
          text: "template",
        },
      ],
      foldersToCreate: ["Templates"],
    };
    const initializer = new ObsidianVaultInitializer({
      vault: {
        adapter: {
          exists: vi.fn().mockResolvedValue(false),
        },
        create,
        createBinary: vi.fn(),
        createFolder,
        getFileByPath: () => ({ path: "Templates/Tune.md" }),
        getFolderByPath: () => ({ path: "Templates" }),
      },
    } as never);

    await expect(initializer.applyInitializationPlan(plan)).resolves.toEqual({
      filesCreated: 0,
      foldersCreated: 0,
    });
    expect(create).not.toHaveBeenCalled();
    expect(createFolder).not.toHaveBeenCalled();
  });
});

function emptySeed(): VaultSeed {
  return {
    files: [],
    folders: [],
  };
}
