/**
 * Temperature conversion and the frost threshold.
 *
 * Celsius is canonical. Fahrenheit exists only at the UI edge — but note that
 * USDA hardiness zones are *defined* in Fahrenheit (10 °F bands, 5 °F half
 * zones), so zone arithmetic deliberately happens in Fahrenheit and converts at
 * its boundary rather than trying to force metric bands onto an imperial
 * definition.
 */

/**
 * Water freezes at 0 °C, and that is the threshold frost-date probabilities are
 * computed against. Note this is an *air temperature at 2 m* threshold, which is
 * the conventional proxy — a radiation frost can damage foliage while the
 * reported air temperature is a degree or two above freezing, which is why the
 * app reports frost dates as probability bands rather than one date.
 */
export const FROST_THRESHOLD_C = 0;

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

/**
 * Growing degree days accrued in one day, given the day's minimum and maximum
 * air temperature and a crop-specific base temperature.
 *
 * Uses the standard single-triangulation method: average the day's extremes,
 * subtract the base, and floor at zero. Crops accumulate development with heat
 * rather than with calendar days, which is why a fixed "days to maturity" is
 * wrong every year and this correction matters.
 *
 * @param minC day's minimum air temperature, °C
 * @param maxC day's maximum air temperature, °C
 * @param baseC temperature below which the crop makes no progress, °C
 */
export function growingDegreeDays(minC: number, maxC: number, baseC: number): number {
  const mean = (minC + maxC) / 2;
  return Math.max(0, mean - baseC);
}

/**
 * The USDA hardiness zone for a given mean annual extreme minimum temperature.
 *
 * This is the actual USDA definition — the mean of the coldest temperature
 * recorded in each year over a 30-year period — which is why the app can derive
 * zones from reanalysis weather instead of depending on a zone lookup API, and
 * why it works outside the United States too.
 *
 * Zone 1 starts at −60 °F and each zone spans 10 °F; the `a` half spans the
 * colder 5 °F and `b` the warmer.
 *
 * @param meanExtremeMinC mean annual extreme minimum temperature, °C
 * @returns e.g. `{ zone: 6, half: 'b', label: '6b' }`
 */
export function hardinessZone(meanExtremeMinC: number): {
  zone: number;
  half: 'a' | 'b';
  label: string;
} {
  const f = celsiusToFahrenheit(meanExtremeMinC);
  // Zone 1a begins at -60 °F. Each zone is 10 °F wide, each half 5 °F.
  const halvesAboveFloor = Math.floor((f + 60) / 5);
  const zone = Math.floor(halvesAboveFloor / 2) + 1;
  const half: 'a' | 'b' = halvesAboveFloor % 2 === 0 ? 'a' : 'b';
  return { zone, half, label: `${String(zone)}${half}` };
}
