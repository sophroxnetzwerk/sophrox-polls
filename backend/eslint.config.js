import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"

export default [
  { ignores: ["dist"] },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  ...tseslint.configs.recommended,
]
