import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Relative asset paths: a packaged build is loaded over file://, where
  // absolute paths resolve to the filesystem root and every asset 404s.
  base: './',

  plugins: [react()],

  resolve: {
    alias: {
      '@garden/core': resolvePath('../../packages/core/src/index.ts'),
    },
  },

  server: {
    port: 5173,
    // Fail rather than silently move to 5174 — the dev script waits on this
    // exact port before launching Electron, and a silent shift would hang it.
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
