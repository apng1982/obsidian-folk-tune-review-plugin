import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface PluginManifest {
  id: string;
  isDesktopOnly: boolean;
  name: string;
  version: string;
}

interface PackageManifest {
  version: string;
}

const manifest = JSON.parse(
  readFileSync(new URL("../manifest.json", import.meta.url), "utf8"),
) as PluginManifest;
const packageManifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as PackageManifest;

const RELEASE_VERSION_PATTERN =
  /^\d+\.\d+\.\d+(?:-(?:beta|rc)\.\d+)?$/;

describe("plugin manifest", () => {
  it("uses the agreed plugin identity", () => {
    expect(manifest.id).toBe("folk-tune-review");
    expect(manifest.name).toBe("Folk Tune Review");
  });

  it("uses a release-compatible version matching package.json", () => {
    expect(manifest.version).toMatch(RELEASE_VERSION_PATTERN);
    expect(manifest.version).toBe(packageManifest.version);
  });

  it("allows the plugin to run on mobile", () => {
    expect(manifest.isDesktopOnly).toBe(false);
  });
});
