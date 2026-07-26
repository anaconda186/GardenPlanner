/**
 * @garden/core — pure domain logic for Garden Planner.
 *
 * Contains no UI, no platform APIs and no I/O. Everything the outside world
 * provides arrives through an interface in `./ports`, which is what lets a future
 * mobile app reuse every engine here verbatim. A dependency-cruiser rule fails
 * the build if that is violated; see CLAUDE.md and docs/adr/0001.
 *
 * All values are SI: millimetres, °C, grams, m², litres. Imperial conversion
 * happens at the UI edge only.
 */

export type { Clock } from './ports/clock.js';
export { fixedClock } from './ports/clock.js';
export type { Coordinates, DailyWeather, WeatherProvider } from './ports/weather-provider.js';
export type { Persisted, Repository, UnitOfWork } from './ports/repository.js';

export * from './units/length.js';
export * from './units/temperature.js';
