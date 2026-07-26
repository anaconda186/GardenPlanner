/**
 * Electron security gate.
 *
 * Runs Electronegativity over the desktop app and fails on any finding that is not
 * explicitly accepted below.
 *
 * Two deliberate choices:
 *
 * 1. This wrapper exists because `electronegativity` **always exits 0**, even with
 *    findings. Invoking it directly from CI would look like a gate and enforce
 *    nothing — the same trap as a secret scanner that reports a leak and passes.
 *
 * 2. It is run through `npx` at a pinned version rather than being a
 *    devDependency. Installing it pulls @mapbox/node-pre-gyp and tar@6.2.1, which
 *    is 16 advisories including one critical, and node-pre-gyp is a native-build
 *    toolchain — the dependency class CLAUDE.md forbids, and one that cannot
 *    compile in this environment at all. Keeping it out of package.json keeps the
 *    lockfile clean, `npm audit` meaningful, and Dependabot quiet. The version is
 *    pinned so the transient fetch is not an unpinned supply-chain risk.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Pinned: an unpinned npx fetch would run whatever was published most recently. */
const ELECTRONEGATIVITY = '@doyensec/electronegativity@1.10.3';

/**
 * Checks reviewed and accepted, with the reason. Anything not listed here fails.
 * Removing an entry is the way to re-open a question.
 */
const ACCEPTED = {
  // Flags the mere use of a preload script, asking that its surface be reviewed.
  // Ours exposes two members (app version, platform) and is contractually typed
  // in electron/bridge.ts. It will never gain a generic "run this SQL" call.
  PRELOAD_JS_CHECK: 'Preload surface is two read-only members; reviewed.',

  // Flags any use of shell.openExternal. Every call goes through
  // isSafeExternalUrl(), which permits only http and https — unit tested in
  // electron/url-policy.test.ts against ms-msdt:, search-ms:, file:, javascript:,
  // data: and vbscript:.
  OPEN_EXTERNAL_JS_CHECK: 'Scheme-validated by isSafeExternalUrl(); unit tested.',

  // Heuristic. The shipped policy contains no unsafe-inline, no unsafe-eval and no
  // wildcards, and sets connect-src to none. The substantive version of this
  // finding — unsafe-inline reaching production — was real and is fixed by the
  // csp() plugin in vite.config.ts, which emits a stricter policy for builds
  // than for the dev server.
  CSP_GLOBAL_CHECK: 'No unsafe-* or wildcard directives; dev allowances no longer ship.',

  // The tool's Electron release database predates the version in use, so it
  // cannot compare. Dependabot tracks Electron updates instead.
  AVAILABLE_SECURITY_FIXES_GLOBAL_CHECK:
    'Tool version DB predates our Electron; Dependabot tracks upgrades.',
};

const target = 'apps/desktop';
const workDir = mkdtempSync(path.join(tmpdir(), 'eneg-'));
const reportPath = path.join(workDir, 'report.csv');

try {
  // Invoke npm's own JS entry point with this Node binary, rather than the `npx`
  // shim. On Windows the shim is npx.cmd, and modern Node refuses to spawn a .cmd
  // without a shell (EINVAL) — while passing shell: true concatenates arguments
  // instead of escaping them, which is an injection risk Node warns about
  // (DEP0190). Going straight to npx-cli.js avoids needing a shell at all.
  const npxCli = path.join(
    path.dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npx-cli.js'
  );
  if (!existsSync(npxCli)) {
    console.error(`Could not locate npx-cli.js next to ${process.execPath}`);
    process.exit(1);
  }

  const run = spawnSync(
    process.execPath,
    [npxCli, '--yes', ELECTRONEGATIVITY, '-i', target, '-r', '-o', reportPath],
    { encoding: 'utf8' }
  );

  if (run.error) {
    console.error(`Could not run ${ELECTRONEGATIVITY}:`, run.error.message);
    process.exit(1);
  }

  const csv = readFileSync(reportPath, 'utf8').trim().split('\n');
  const findings = csv
    .slice(1)
    .map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')))
    .map(([issue, severity, confidence, filename]) => ({
      issue,
      severity,
      confidence,
      filename: filename ?? '',
    }))
    // Build output is a copy of the source that was already scanned.
    .filter((f) => !f.filename.replace(/\\/g, '/').includes('/dist'))
    .filter((f) => f.issue && !Object.hasOwn(ACCEPTED, f.issue));

  if (findings.length > 0) {
    console.error('Electron security findings that are not accepted:\n');
    for (const f of findings) {
      console.error(`  ${f.issue}  [${f.severity} | ${f.confidence}]`);
      console.error(`    ${f.filename}`);
    }
    console.error(
      '\nFix the finding, or — if it is genuinely acceptable — add it to ACCEPTED in\n' +
        'scripts/electron-security.mjs with the reason it is safe.'
    );
    process.exit(1);
  }

  console.log(
    `Electron security scan clean (${String(Object.keys(ACCEPTED).length)} checks accepted with documented reasons).`
  );
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
