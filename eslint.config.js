import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/dist-electron/**', '**/coverage/**', '**/node_modules/**'],
  },

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Config files that sit outside tsconfig's include still need a parser
          // context, otherwise the project service refuses to lint them at all.
          allowDefaultProject: ['*.cjs', '*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Unused args are fine when prefixed with _, which keeps interface
      // implementations readable without disabling the check entirely.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
    },
  },

  // The core boundary, enforced a second way. dependency-cruiser is the primary
  // gate (it sees transitive reaches too); this catches violations in the editor
  // as you type, which is where they actually get prevented.
  // See CLAUDE.md and docs/adr/0001.
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'packages/core must stay free of UI frameworks.' },
            { name: 'electron', message: 'packages/core must stay free of platform APIs.' },
          ],
          patterns: [
            {
              group: ['node:*', 'fs', 'path', 'os', 'child_process', 'electron/*'],
              message:
                'packages/core must not touch the platform. Add a port in src/ports/ and inject an implementation.',
            },
          ],
        },
      ],
      // Domain logic must take Clock from ports/ — a test that reads the real
      // clock passes in July and fails in January. See CLAUDE.md.
      'no-restricted-globals': [
        'error',
        {
          name: 'Date',
          message: 'Inject Clock from src/ports/clock.ts instead of reading the clock.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Inject Clock from src/ports/clock.ts instead of calling new Date().',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Inject Clock from src/ports/clock.ts instead of calling Date.now().',
        },
      ],
    },
  },

  // Tests may construct fixed dates — that is the point of a deterministic clock.
  // ports/clock.ts is the one place in core allowed to touch Date: it *is* the
  // boundary the rule exists to push everything else through.
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'packages/core/src/ports/clock.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // Renderer: browser globals and the React rules of hooks.
  {
    files: ['apps/desktop/src/**/*.{ts,tsx}'],
    // configs.flat[...], not configs[...]: in eslint-plugin-react-hooks 7 the
    // top-level `recommended-latest` is still the eslintrc-style object, and
    // passing it to flat config fails with a "plugins must be an object" error.
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },

  // Electron main and preload: Node globals, and process.env is legitimate here
  // in a way it is not in core.
  {
    files: ['apps/desktop/electron/**/*.{ts,cts}'],
    languageOptions: { globals: globals.node },
  },

  // Config files: Node globals, and no type-aware rules since they sit outside
  // the TypeScript project.
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { globals: globals.node },
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'commonjs',
    },
    extends: [tseslint.configs.disableTypeChecked],
  },

  prettier
);
