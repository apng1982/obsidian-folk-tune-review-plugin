export interface PluginSettings {
  readonly defaultReviewCount: number;
  readonly devTestMode: boolean;
  readonly includeExcludedByDefault: boolean;
  readonly includeSessionMaintainedByDefault: boolean;
  readonly tuneFolder: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  defaultReviewCount: 10,
  devTestMode: false,
  includeExcludedByDefault: false,
  includeSessionMaintainedByDefault: false,
  tuneFolder: "Repertoire/Tunes",
};

export function mergePluginSettings(value: unknown): PluginSettings {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  return {
    defaultReviewCount: readPositiveInteger(
      value.defaultReviewCount,
      DEFAULT_SETTINGS.defaultReviewCount,
    ),
    devTestMode: readBoolean(value.devTestMode, DEFAULT_SETTINGS.devTestMode),
    includeExcludedByDefault: readBoolean(
      value.includeExcludedByDefault,
      DEFAULT_SETTINGS.includeExcludedByDefault,
    ),
    includeSessionMaintainedByDefault: readBoolean(
      value.includeSessionMaintainedByDefault,
      DEFAULT_SETTINGS.includeSessionMaintainedByDefault,
    ),
    tuneFolder: readNonEmptyString(value.tuneFolder, DEFAULT_SETTINGS.tuneFolder),
  };
}

function readPositiveInteger(value: unknown, defaultValue: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : defaultValue;
}

function readBoolean(value: unknown, defaultValue: boolean): boolean {
  return typeof value === "boolean" ? value : defaultValue;
}

function readNonEmptyString(value: unknown, defaultValue: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : defaultValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
