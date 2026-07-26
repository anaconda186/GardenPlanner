/**
 * The contract between the Electron main process and the renderer.
 *
 * Types only — this file emits no runtime code, so the renderer can import it
 * without pulling any Electron code into the browser bundle. Defining it once
 * here rather than declaring the shape separately on both sides is deliberate: a
 * duplicated contract drifts, and the drift shows up as a runtime `undefined` in
 * the renderer rather than a type error.
 *
 * Keep this surface small. Everything exposed here is reachable by renderer code,
 * so each addition widens what a compromised renderer could reach. Persistence
 * lands in Phase 1 as a handful of narrow, purpose-built calls — never a generic
 * "run this SQL" escape hatch.
 */
export interface GardenBridge {
  /** The app version from package.json, resolved in the main process. */
  appVersion(): Promise<string>;

  /** `win32`, `darwin` or `linux`. Read once at preload time. */
  readonly platform: string;
}
