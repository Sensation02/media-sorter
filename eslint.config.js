import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "src-tauri/target/",
      "src-tauri/gen/",
      "node_modules/",
      "coverage/",
      "src/test/",
    ],
  },

  // Base JS rules everywhere
  js.configs.recommended,

  // Type-checked TS rules ONLY for source files
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },

  // Untyped TS rules for config files (no project info needed)
  {
    files: ["*.config.{js,ts,mjs,cjs}", "vite.config.ts", "vitest.config.ts", "eslint.config.js"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
  },

  // Prettier last to disable conflicting rules
  prettier,
);
