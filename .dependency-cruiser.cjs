/**
 * The architecture gate.
 *
 * packages/core is the only reason a future mobile app is cheap: it holds every
 * engine (climate, schedule, water, recommend) as pure TypeScript behind injected
 * ports, so Expo can reuse it verbatim. That property survives only if nothing in
 * core reaches for a platform API — and calling one directly is always the
 * shortest path to working code, so this is enforced rather than documented.
 *
 * See CLAUDE.md and docs/adr/0001-electron-shell-and-wasm-sqlite.md.
 */
module.exports = {
  forbidden: [
    {
      name: 'core-no-platform-apis',
      severity: 'error',
      comment:
        'packages/core must not import Node, Electron or browser platform APIs. Add an interface in packages/core/src/ports/ and inject an implementation from the app layer instead.',
      from: { path: '^packages/core/src' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'core-no-ui-or-shell',
      severity: 'error',
      comment:
        'packages/core must not depend on React, Electron, Vite or anything in apps/. Domain logic stays platform-free so mobile can reuse it.',
      from: { path: '^packages/core/src' },
      to: {
        path: '(^apps/)|(node_modules/(react|react-dom|electron|vite)($|/))',
      },
    },
    {
      name: 'crop-data-is-leaf',
      severity: 'error',
      comment:
        'packages/crop-data is a dataset plus its schema. It must not depend on core or on any app.',
      from: { path: '^packages/crop-data/src' },
      to: { path: '(^packages/core/)|(^apps/)' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make the module graph impossible to reason about.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Unreachable module — either wire it up or delete it.',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '(^|/)tsconfig[^/]*\\.json$',
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    // Build output is generated, so cruising it produces orphan warnings that are
    // pure noise — and noise trains you to stop reading the one report that
    // guards the architecture.
    exclude: { path: '(^|/)(dist|dist-electron|coverage)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.cts', '.mts'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
