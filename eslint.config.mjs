import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["main.js", "node_modules/**", "release-assets/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"],
  })),
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["tests/**/*.ts", "vitest.config.ts"],
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
  },
  {
    files: ["*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["node:*"],
              message: "Node APIs are not available in the mobile Obsidian runtime.",
            },
            {
              group: ["electron", "electron/*"],
              message: "Electron APIs are not available in the mobile Obsidian runtime.",
            }
          ]
        }
      ]
    }
  }
);
