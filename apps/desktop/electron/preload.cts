import { contextBridge, ipcRenderer } from 'electron';
import type { GardenBridge } from './bridge.js';

/**
 * CommonJS on purpose — note the `.cts` extension.
 *
 * Electron preload scripts must be CommonJS when `sandbox: true`, which it is.
 * The rest of this package is ESM, so this one file is compiled to `.cjs` while
 * `main.ts` compiles to ESM.
 */
const bridge: GardenBridge = {
  appVersion: () => ipcRenderer.invoke('app:version') as Promise<string>,
  platform: process.platform,
};

contextBridge.exposeInMainWorld('garden', bridge);
