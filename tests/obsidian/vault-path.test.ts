import { describe, expect, it } from "vitest";

import {
  isDirectChildPath,
  normalizeVaultPath,
} from "../../src/obsidian/vault-path";

describe("vault paths", () => {
  it("normalizes separators and surrounding slashes", () => {
    expect(normalizeVaultPath("/Tunes\\Tunes/")).toBe("Tunes/Tunes");
  });

  it("matches only direct children of the configured flat tune folder", () => {
    expect(isDirectChildPath("Tunes/Tunes/Reel.md", "Tunes/Tunes")).toBe(true);
    expect(isDirectChildPath("Tunes/Tunes/Nested/Reel.md", "Tunes/Tunes")).toBe(false);
    expect(isDirectChildPath("Tunes/Reel.md", "Tunes/Tunes")).toBe(false);
  });
});
