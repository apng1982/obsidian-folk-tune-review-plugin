import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  mergePluginSettings,
} from "../../src/settings/plugin-settings";

describe("plugin settings", () => {
  it("uses mobile-ready review defaults when no settings exist", () => {
    expect(mergePluginSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({
      defaultReviewCount: 10,
      includeExcludedByDefault: false,
      includeSessionMaintainedByDefault: false,
      tuneFolder: "Tunes/Tunes",
    });
  });

  it("merges valid persisted values", () => {
    expect(
      mergePluginSettings({
        defaultReviewCount: 20,
        includeExcludedByDefault: true,
        includeSessionMaintainedByDefault: true,
        tuneFolder: "My Tunes",
      }),
    ).toEqual({
      defaultReviewCount: 20,
      includeExcludedByDefault: true,
      includeSessionMaintainedByDefault: true,
      tuneFolder: "My Tunes",
    });
  });

  it("replaces malformed persisted values with defaults", () => {
    expect(
      mergePluginSettings({
        defaultReviewCount: 0,
        includeExcludedByDefault: "yes",
        includeSessionMaintainedByDefault: null,
        tuneFolder: " ",
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });
});
