import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // These are separate projects with their own toolchains (and, for
    // python/, a venv full of vendored JS this linter shouldn't touch).
    "backend/**",
    "python/**",
    "llm/**",
  ]),
]);

export default eslintConfig;
