import { describe, expect, it, vi } from "vitest";

import {
  applyVaultInitializationPlan,
  buildVaultInitializationPlan,
} from "../../src/application/initialize-vault";
import type {
  InitializationPlan,
  VaultSeed,
} from "../../src/domain/initialization-plan";

describe("initialize vault application use case", () => {
  it("builds a plan from the initializer snapshot and supplied seed", async () => {
    const seed: VaultSeed = {
      files: [{ contentType: "text", path: "Templates/Tune.md", text: "" }],
      folders: ["Templates"],
    };
    const initializer = {
      applyInitializationPlan: vi.fn(),
      readSnapshot: vi.fn().mockResolvedValue({
        filePaths: [],
        folderPaths: [],
      }),
    };

    const plan = await buildVaultInitializationPlan(initializer, seed);

    expect(initializer.readSnapshot).toHaveBeenCalledWith(seed);
    expect(plan.filesToCreate).toEqual(seed.files);
    expect(plan.foldersToCreate).toEqual(["Templates"]);
  });

  it("applies a prebuilt plan through the initializer", async () => {
    const plan: InitializationPlan = {
      existingFiles: [],
      existingFolders: [],
      filesToCreate: [],
      foldersToCreate: [],
    };
    const initializer = {
      applyInitializationPlan: vi.fn().mockResolvedValue({
        filesCreated: 0,
        foldersCreated: 0,
      }),
      readSnapshot: vi.fn(),
    };

    await expect(
      applyVaultInitializationPlan(initializer, plan),
    ).resolves.toEqual({
      filesCreated: 0,
      foldersCreated: 0,
    });
    expect(initializer.applyInitializationPlan).toHaveBeenCalledWith(plan);
  });
});
