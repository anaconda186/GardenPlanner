import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Which URLs the renderer is allowed to navigate to, and which may be handed to
 * the operating system.
 *
 * Deliberately free of any Electron import so it can be unit tested directly.
 * This is the code that decides whether a remote page can end up inside a window
 * holding the preload bridge, so it is worth testing on its own rather than only
 * through a running app.
 */
export interface UrlPolicy {
  /** The dev server's origin, or null in a packaged build. */
  devOrigin: string | null;
  /** Absolute path to the renderer's own files. Used when devOrigin is null. */
  rendererDir: string;
}

/**
 * Whether a URL belongs to this application.
 *
 * Compares parsed origins, never string prefixes. `startsWith` is unsafe here:
 * `http://localhost:5173@evil.example/` begins with `http://localhost:5173` yet
 * its origin is `http://evil.example`, because everything before the `@` is
 * userinfo. `http://localhost:51730/` defeats a prefix test the same way.
 */
export function isInternalUrl(rawUrl: string, policy: UrlPolicy): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (policy.devOrigin !== null) return parsed.origin === policy.devOrigin;

  // Packaged build: file: URLs only, and only inside the renderer's directory.
  // A bare protocol check would permit navigating to any file on the machine.
  if (parsed.protocol !== 'file:') return false;

  let target: string;
  try {
    target = path.normalize(fileURLToPath(parsed));
  } catch {
    return false;
  }

  const dir = path.normalize(policy.rendererDir);
  return target === dir || target.startsWith(dir + path.sep);
}

/**
 * Whether a URL is safe to hand to `shell.openExternal`.
 *
 * `openExternal` invokes the OS handler for whatever scheme it receives, so an
 * unvalidated URL turns a link into local code execution — on Windows, schemes
 * like `ms-msdt:`, `search-ms:` and `file:` launch local handlers. Only web
 * content is ever passed through.
 */
export function isSafeExternalUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}
