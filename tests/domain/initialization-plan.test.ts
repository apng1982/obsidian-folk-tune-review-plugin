import { describe, expect, it } from "vitest";

import {
  buildInitializationPlan,
  hasInitializationChanges,
  type VaultSeed,
} from "../../src/domain/initialization-plan";

describe("initialization plan", () => {
  it("plans every seed folder and file when the vault is empty", () => {
    const seed = vaultSeed();

    const plan = buildInitializationPlan(seed, {
      filePaths: [],
      folderPaths: [],
    });

    expect(plan).toEqual({
      existingFiles: [],
      existingFolders: [],
      filesToCreate: seed.files,
      foldersToCreate: ["Ref", "Ref/Key", "Templates"],
    });
    expect(hasInitializationChanges(plan)).toBe(true);
  });

  it("does not plan existing folders or files for overwrite", () => {
    const seed = vaultSeed();

    const plan = buildInitializationPlan(seed, {
      filePaths: ["Ref/Key/D.md"],
      folderPaths: ["Ref", "Ref/Key"],
    });

    expect(plan.existingFiles).toEqual([seed.files[0]]);
    expect(plan.existingFolders).toEqual(["Ref", "Ref/Key"]);
    expect(plan.filesToCreate).toEqual([seed.files[1]]);
    expect(plan.foldersToCreate).toEqual(["Templates"]);
  });

  it("is idempotent when all seed folders and files already exist", () => {
    const seed = vaultSeed();

    const plan = buildInitializationPlan(seed, {
      filePaths: ["Ref/Key/D.md", "Templates/Tune Template.md"],
      folderPaths: ["Ref", "Ref/Key", "Templates"],
    });

    expect(plan.filesToCreate).toEqual([]);
    expect(plan.foldersToCreate).toEqual([]);
    expect(hasInitializationChanges(plan)).toBe(false);
  });

  it("normalizes slashes and leading or trailing separators in snapshots", () => {
    const seed = vaultSeed();

    const plan = buildInitializationPlan(seed, {
      filePaths: ["\\Ref\\Key\\D.md"],
      folderPaths: ["/Ref/", "\\Ref\\Key\\"],
    });

    expect(plan.existingFiles).toEqual([seed.files[0]]);
    expect(plan.existingFolders).toEqual(["Ref", "Ref/Key"]);
  });
});

function vaultSeed(): VaultSeed {
  return {
    files: [
      {
        contentType: "text",
        path: "Ref/Key/D.md",
        text: "---\nname: D\n---\n",
      },
      {
        contentType: "text",
        path: "Templates/Tune Template.md",
        text: "---\nlearn: true\n---\n",
      },
    ],
    folders: ["Ref/Key"],
  };
}
