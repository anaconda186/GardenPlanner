import { useEffect, useState } from 'react';
import {
  feetToMm,
  hardinessZone,
  fahrenheitToCelsius,
  rectangleAreaSqM,
  sqMToSqFt,
} from '@garden/core';

/**
 * Phase 0 status screen.
 *
 * Deliberately not a placeholder: it exercises the two seams that are expensive
 * to debug later. The version comes from the main process through the preload
 * bridge, proving IPC and context isolation work. The bed area and zone are
 * computed by @garden/core, proving the platform-free domain package is reachable
 * from the renderer with no bundler special-casing.
 *
 * Replaced by the real first-run flow in Phase 2.
 */
/**
 * Whether the preload bridge is present, decided once at module load.
 *
 * Not state and not an effect: it cannot change over the life of the window, so
 * making it reactive would only invite the cascading render the linter rightly
 * objects to.
 */
const bridge = typeof window.garden === 'undefined' ? null : window.garden;

export function App(): React.JSX.Element {
  const [version, setVersion] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  useEffect(() => {
    if (!bridge) return;
    // Guarded because StrictMode runs effects twice in development, and a
    // resolution arriving after unmount would otherwise set state on a dead tree.
    let cancelled = false;
    bridge.appVersion().then(
      (value) => {
        if (!cancelled) setVersion(value);
      },
      (error: unknown) => {
        if (!cancelled) setBridgeError(error instanceof Error ? error.message : String(error));
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // A 4x8 ft raised bed, the most common size there is.
  const bedAreaSqM = rectangleAreaSqM(feetToMm(4), feetToMm(8));
  // Minneapolis sits near a -15 °F mean annual extreme minimum: zone 5b.
  const zone = hardinessZone(fahrenheitToCelsius(-15));

  return (
    <main>
      <header>
        <h1>Garden Planner</h1>
        <p className="tagline">Phase 0 — foundations. The planting calendar arrives in Phase 2.</p>
      </header>

      <section aria-labelledby="shell-heading">
        <h2 id="shell-heading">Shell</h2>
        <dl>
          <dt>App version</dt>
          <dd>{version ?? (bridge === null ? '—' : 'loading…')}</dd>
          <dt>Platform</dt>
          <dd>{bridge?.platform ?? '—'}</dd>
        </dl>
        {bridge === null && (
          <p role="alert">Not running in the Electron shell — the preload bridge is absent.</p>
        )}
        {bridgeError !== null && <p role="alert">{bridgeError}</p>}
      </section>

      <section aria-labelledby="core-heading">
        <h2 id="core-heading">Domain core</h2>
        <p className="note">
          Computed by <code>@garden/core</code>, the platform-free package a future mobile app
          reuses unchanged.
        </p>
        <dl>
          <dt>A 4 × 8 ft bed</dt>
          <dd>
            {bedAreaSqM.toFixed(2)} m² ({sqMToSqFt(bedAreaSqM).toFixed(0)} sq ft)
          </dd>
          <dt>Zone at a −15 °F annual low</dt>
          <dd>{zone.label}</dd>
        </dl>
      </section>
    </main>
  );
}
