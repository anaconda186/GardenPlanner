/**
 * Launches Electron with a sanitised environment.
 *
 * VS Code's integrated terminal exports `ELECTRON_RUN_AS_NODE=1` (it uses Electron
 * internally for its extension host). Any Electron app started from that shell
 * inherits it and runs as **plain Node instead of Electron**: no window opens,
 * `require('electron')` returns the path to the binary rather than the API, and
 * the first symptom is a baffling `Cannot read properties of undefined (reading
 * 'handle')` from ipcMain. Nothing about that error points at the cause.
 *
 * Deleting the variable here means `npm run dev` behaves the same whether it is
 * run from VS Code, Windows Terminal or CI. cross-env cannot do this — it sets
 * variables, it cannot unset them.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

// electron's main export is the absolute path to its binary, which is exactly
// what is wanted here.
const require = createRequire(import.meta.url);
const electronBinary = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, ['.', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
