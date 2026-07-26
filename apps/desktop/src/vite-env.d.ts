import type { GardenBridge } from '../electron/bridge.js';

declare global {
  interface Window {
    /**
     * Exposed by the preload script via contextBridge. Present in the Electron
     * shell; absent if the renderer is ever opened in a plain browser tab, so
     * treat it as possibly undefined at the edges.
     */
    readonly garden: GardenBridge;
  }
}
