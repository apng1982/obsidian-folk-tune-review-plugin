import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const domainDirectory = join(process.cwd(), "src", "domain");

describe("domain boundaries", () => {
  it("does not import Obsidian APIs", () => {
    const domainSources = readdirSync(domainDirectory)
      .filter((fileName) => fileName.endsWith(".ts"))
      .map((fileName) => readFileSync(join(domainDirectory, fileName), "utf8"));

    expect(domainSources.join("\n")).not.toMatch(
      /(?:from\s+["']obsidian["']|import\s*\(\s*["']obsidian["']\s*\))/,
    );
  });
});
