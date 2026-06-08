import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("application boundaries", () => {
  it("keeps domain, application, and ports independent from Obsidian APIs", () => {
    const source = ["domain", "application", "ports"]
      .flatMap((directory) => readTypeScriptFiles(join(process.cwd(), "src", directory)))
      .join("\n");

    expect(source).not.toMatch(
      /(?:from\s+["']obsidian["']|import\s*\(\s*["']obsidian["']\s*\))/,
    );
  });
});

function readTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? readTypeScriptFiles(path)
      : entry.name.endsWith(".ts")
        ? [readFileSync(path, "utf8")]
        : [];
  });
}
