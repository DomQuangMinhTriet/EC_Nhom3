import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import type { ESLint, Linter } from "eslint";

const typescriptPlugin = tsPlugin as unknown as ESLint.Plugin;
const typescriptParser = tsParser as unknown as Linter.Parser;

export default defineConfig([
  globalIgnores(["dist", "drizzle"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended],
    plugins: { "@typescript-eslint": typescriptPlugin },
    languageOptions: {
      parser: typescriptParser,
      globals: globals.node,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
