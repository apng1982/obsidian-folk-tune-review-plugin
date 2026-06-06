import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface PluginManifest {
  id: string;
  isDesktopOnly: boolean;
  name: string;
  version: string;
}

const manifest = JSON.parse(
  readFileSync(new URL("../manifest.json", import.meta.url), "utf8"),
) as PluginManifest;

describe("plugin manifest", () => {
  it("uses the agreed plugin identity", () => {
    expect(manifest.id).toBe("folk-tune-review");
    expect(manifest.name).toBe("Folk Tune Review");
    expect(manifest.version).toBe("0.1.0");
  });

  it("allows the plugin to run on mobile", () => {
    expect(manifest.isDesktopOnly).toBe(false);
  });
});
