#!/usr/bin/env node
/**
 * scripts/install-local.mjs
 *
 * Build and copy the Obsidian plugin into a local desktop test vault.
 *
 * This script is for LOCAL DEVELOPMENT ONLY. It may use Node's fs/path APIs because
 * it runs outside Obsidian. The plugin runtime itself must remain mobile-safe and
 * must not import fs/path/electron.
 *
 * Usage:
 *
 *   OBSIDIAN_DEV_VAULT="/path/to/your/dev-vault" npm run install-local
 *
 * Optional:
 *
 *   OBSIDIAN_PLUGIN_ID="folk-tune-review" npm run install-local
 *   OBSIDIAN_SKIP_BUILD=true npm run install-local
 *   node scripts/install-local.mjs --vault "/path/to/dev-vault" --skip-build
 *
 * Expected package.json script:
 *
 *   {
 *     "scripts": {
 *       "install-local": "node scripts/install-local.mjs"
 *     }
 *   }
 *
 * Manual steps after running:
 *
 *   1. Open the target vault in Obsidian desktop.
 *   2. Enable community plugins if needed.
 *   3. Enable this plugin under Settings -> Community plugins.
 *   4. After subsequent installs, reload Obsidian or disable/re-enable the plugin.
 *
 * Files copied:
 *
 *   main.js
 *   manifest.json
 *   styles.css, if present
 */

import { access, copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const REQUIRED_ASSETS = ["main.js", "manifest.json"];
const OPTIONAL_ASSETS = ["styles.css"];

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function assertDirectory(dirPath, message) {
  try {
    const s = await stat(dirPath);
    if (!s.isDirectory()) {
      throw new Error(`${message}: ${dirPath} exists but is not a directory.`);
    }
  } catch (err) {
    if (err && err.code === "ENOENT") {
      throw new Error(`${message}: ${dirPath} does not exist.`);
    }
    throw err;
  }
}

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

async function readManifest() {
  const manifestPath = path.join(PROJECT_ROOT, "manifest.json");
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  if (!manifest.id || typeof manifest.id !== "string") {
    throw new Error("manifest.json must contain a string 'id' property.");
  }

  if (manifest.isDesktopOnly !== false) {
    console.warn(
      "WARNING: manifest.json does not have isDesktopOnly=false. " +
      "This plugin is intended to be mobile-first."
    );
  }

  return manifest;
}

async function main() {
  const vaultPath =
    getArgValue("--vault") ??
    process.env.OBSIDIAN_DEV_VAULT;

  if (!vaultPath) {
    throw new Error(
      "Missing target vault. Set OBSIDIAN_DEV_VAULT or pass --vault.\n" +
      'Example: OBSIDIAN_DEV_VAULT="/Users/arthur/Vaults/FolkTuneDev" npm run install-local'
    );
  }

  const skipBuild =
    hasFlag("--skip-build") ||
    process.env.OBSIDIAN_SKIP_BUILD === "true";

  await assertDirectory(PROJECT_ROOT, "Project root");
  await assertDirectory(path.resolve(vaultPath), "Obsidian dev vault");

  const manifest = await readManifest();
  const pluginId = process.env.OBSIDIAN_PLUGIN_ID || manifest.id;

  if (!skipBuild) {
    run("npm", ["run", "build"]);
  } else {
    console.log("Skipping build because --skip-build or OBSIDIAN_SKIP_BUILD=true was supplied.");
  }

  for (const asset of REQUIRED_ASSETS) {
    const assetPath = path.join(PROJECT_ROOT, asset);
    if (!(await exists(assetPath))) {
      throw new Error(
        `Required asset '${asset}' was not found at project root after build. ` +
        "Check your build output."
      );
    }
  }

  const targetDir = path.join(
    path.resolve(vaultPath),
    ".obsidian",
    "plugins",
    pluginId
  );

  await mkdir(targetDir, { recursive: true });

  const copied = [];

  for (const asset of REQUIRED_ASSETS) {
    await copyFile(
      path.join(PROJECT_ROOT, asset),
      path.join(targetDir, asset)
    );
    copied.push(asset);
  }

  for (const asset of OPTIONAL_ASSETS) {
    const source = path.join(PROJECT_ROOT, asset);
    if (await exists(source)) {
      await copyFile(source, path.join(targetDir, asset));
      copied.push(asset);
    }
  }

  console.log("\nInstalled local Obsidian plugin build.");
  console.log(`Vault:      ${path.resolve(vaultPath)}`);
  console.log(`Plugin ID:  ${pluginId}`);
  console.log(`Target:     ${targetDir}`);
  console.log(`Copied:     ${copied.join(", ")}`);

  console.log("\nNext manual steps:");
  console.log("1. Open the target vault in Obsidian desktop.");
  console.log("2. Enable the plugin if this is the first install.");
  console.log("3. Reload Obsidian, or disable/re-enable the plugin, after each copy.");
}

main().catch((err) => {
  console.error(`\ninstall-local failed: ${err.message}`);
  process.exit(1);
});
