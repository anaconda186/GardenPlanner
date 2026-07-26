import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@garden/core': resolve('./packages/core/src/index.ts'),
      '@garden/crop-data': resolve('./packages/crop-data/src/index.ts'),
    },
  },
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/*/src/**/*.test.{ts,tsx}',
      // The Electron main process holds the navigation and external-link policy,
      // which decides whether a remote page can reach the preload bridge. That
      // belongs under test, so this directory is in scope too.
      'apps/*/electron/**/*.test.ts',
    ],
    environment: 'node',
    // No network in tests: Open-Meteo responses are committed as fixtures.
    // See CLAUDE.md.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/core/src/**'],
      exclude: ['**/*.test.ts', '**/ports/**', '**/index.ts'],
      // Raised as the engines land. Ports are interfaces with no behaviour to cover.
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
