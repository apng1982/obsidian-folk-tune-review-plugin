import { describe, expect, it } from "vitest";

import { DEFAULT_VAULT_SEED } from "../../src/seed/default-vault-seed";

describe("default vault seed", () => {
  it("embeds the default initialization content in the plugin bundle", () => {
    expect(DEFAULT_VAULT_SEED.folders).toContain("Repertoire/Tunes");
    expect(DEFAULT_VAULT_SEED.folders).toContain("Templates");
    expect(DEFAULT_VAULT_SEED.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "README.md",
        "Tunes Base.base",
        "Sets Base.base",
        "Templates/Tune Template.md",
        "Repertoire/Tunes/Baltimore Beginners.md",
        "Repertoire/Dots/Tunes/placeholder-1.png",
      ]),
    );
  });

  it("uses normalized vault paths and includes text and binary files", () => {
    expect(
      DEFAULT_VAULT_SEED.files.every((file) => !file.path.includes("\\")),
    ).toBe(true);
    expect(
      DEFAULT_VAULT_SEED.files.some((file) => file.contentType === "text"),
    ).toBe(true);
    expect(
      DEFAULT_VAULT_SEED.files.some((file) => file.contentType === "binary"),
    ).toBe(true);
  });
});
