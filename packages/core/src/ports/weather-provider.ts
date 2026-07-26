/**
 * Weather and climate input, as an interface so packages/core never makes a
 * network call itself.
 *
 * The desktop implementation talks to Open-Meteo, whose free tier needs no API
 * key and reaches back to 1940 — enough history to derive hardiness zone and
 * frost-date probabilities ourselves rather than depending on a zone lookup
 * service. Tests implement this against committed fixtures, so the suite is
 * fast, deterministic and works offline.
 */

/** A point on the earth. Latitude and longitude in decimal degrees. */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * One day of weather. All values SI; see CLAUDE.md on unit canonicalisation.
 *
 * Fields are optional because reanalysis and forecast data have different
 * coverage, and an absent value must degrade gracefully rather than be guessed —
 * a fabricated number here produces confidently wrong advice.
 */
export interface DailyWeather {
  /** Calendar date in the garden's local zone, as `YYYY-MM-DD`. */
  date: string;
  /** Minimum air temperature at 2 m, °C. Drives frost detection. */
  temperatureMinC?: number;
  /** Maximum air temperature at 2 m, °C. With the minimum, drives degree days. */
  temperatureMaxC?: number;
  /** Total precipitation, mm. Credited against soil moisture depletion. */
  precipitationMm?: number;
  /**
   * FAO-56 reference evapotranspiration (ET₀), mm — the water a well-watered
   * grass reference would lose. Multiplied by a crop coefficient to get the
   * crop's actual demand.
   */
  referenceEtMm?: number;
}

export interface WeatherProvider {
  /**
   * Observed daily weather for a past date range, inclusive. Used both for
   * climate derivation over decades and for the running water balance.
   */
  history(at: Coordinates, fromDate: string, toDate: string): Promise<DailyWeather[]>;

  /**
   * Forecast from today forward. Lets the agenda say "skip watering, rain
   * expected Thursday" and warn about a frost before it arrives.
   */
  forecast(at: Coordinates, days: number): Promise<DailyWeather[]>;
}
