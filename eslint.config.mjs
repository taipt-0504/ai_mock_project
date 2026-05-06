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
    // Test runtime artifacts:
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
  // Constitution Principle IV — no `console.*` outside the logger module.
  // Allowed exceptions: the logger itself (the actual emitter), the seed
  // script (a CLI tool), and the Login client error boundary (the server
  // logger can't run there — it uses node:async_hooks).
  {
    rules: {
      "no-console": "error",
    },
  },
  {
    files: [
      "src/lib/logger.ts",
      "prisma/seed.ts",
      "app/login/error.tsx",
      "app/global-error.tsx",
      "tests/**/*",
      "vitest.setup.ts",
      "scripts/**/*",
    ],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
