import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  // why: vitest defaults `mode` to "test", so this auto-loads `.env`,
  // `.env.local`, `.env.test`, `.env.test.local` (later wins). Empty prefix
  // returns every var, not just the VITE_* subset.
  const env = loadEnv(mode, process.cwd(), '');
  // why: `test.env` reaches test workers, but globalSetup runs in the main
  // thread and reads process.env directly. Mirror loaded values into the
  // main thread so DATABASE_URL_TEST gets to globalSetup.
  // Shell-provided vars take precedence (??= leaves them untouched).
  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value;
  }
  return {
    plugins: [react()],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      globalSetup: ['./tests/global-setup.ts'],
      include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/integration/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
      css: true,
      // DB-touching test files share `clearAuthTables`; running them in parallel
      // would cause cross-file teardown collisions. Suite is small enough that
      // serial execution is fine.
      fileParallelism: false,
      env,
    },
  };
});
