import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, relative, resolve, sep } from "node:path";

const seedSourceDirectory = resolve("requirements/initialise-vault-seed-content");
const seedOutputPath = resolve("src/seed/default-vault-seed.ts");

const folders = [];
const files = [];

walk(seedSourceDirectory);
addBuiltInSeedContent();

const output = [
  "// Generated from requirements/initialise-vault-seed-content. Do not edit by hand.",
  "",
  'import type { VaultSeed } from "../domain/initialization-plan";',
  "",
  `export const DEFAULT_VAULT_SEED = ${JSON.stringify(
    { folders, files },
    null,
    2,
  )} satisfies VaultSeed;`,
  "",
].join("\n");

writeFileSync(seedOutputPath, output, "utf8");

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  )) {
    const fullPath = resolve(directory, entry.name);
    const vaultPath = relative(seedSourceDirectory, fullPath)
      .split(sep)
      .join("/");

    if (entry.isDirectory()) {
      folders.push(vaultPath);
      walk(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (extname(entry.name).toLowerCase() === ".png") {
      files.push({
        base64: readFileSync(fullPath).toString("base64"),
        contentType: "binary",
        path: vaultPath,
      });
    } else {
      files.push({
        contentType: "text",
        path: vaultPath,
        text: readFileSync(fullPath, "utf8"),
      });
    }
  }
}

function addBuiltInSeedContent() {
  folders.push(".obsidian");
  folders.push(".obsidian/snippets");
  files.push({
    contentType: "text",
    path: ".obsidian/snippets/hide-review-object.css",
    text: [
      '.metadata-property[data-property-key="review"] {',
      "  display: none;",
      "}",
      "",
    ].join("\n"),
  });
}
