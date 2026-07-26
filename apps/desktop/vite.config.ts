import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Injects the Content-Security-Policy, stricter in production than in dev.
 *
 * Dev needs two allowances that must never reach users: `'unsafe-inline'` styles,
 * because Vite injects CSS through a style tag before extracting it at build time,
 * and a websocket connection for hot reload. A single hand-written policy in
 * index.html would either break the dev server or ship those allowances — so the
 * policy is generated here, where the two cases can differ deliberately.
 *
 * `connect-src 'none'` in production is correct rather than restrictive: the
 * renderer talks to nothing. Weather requests are made by the Electron main
 * process, so the renderer has no reason to reach the network at all.
 */
function csp(): Plugin {
  return {
    name: 'garden-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const isDev = ctx.server !== undefined;
        const policy = [
          "default-src 'self'",
          "script-src 'self'",
          isDev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
          "img-src 'self' data:",
          "font-src 'self'",
          isDev ? "connect-src 'self' ws://localhost:5173" : "connect-src 'none'",
          "worker-src 'self'",
          "object-src 'none'",
          "frame-src 'none'",
          "child-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
          "frame-ancestors 'none'",
        ].join('; ');

        return html.replace(
          '<!--CSP-->',
          `<meta http-equiv="Content-Security-Policy" content="${policy}" />`
        );
      },
    },
  };
}

export default defineConfig({
  // Relative asset paths: a packaged build is loaded over file://, where
  // absolute paths resolve to the filesystem root and every asset 404s.
  base: './',

  plugins: [react(), csp()],

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
