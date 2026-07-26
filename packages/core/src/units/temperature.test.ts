import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  growingDegreeDays,
  hardinessZone,
} from './temperature.js';

describe('fahrenheit and celsius', () => {
  it.each([
    [32, 0],
    [212, 100],
    [-40, -40],
    [98.6, 37],
  ])('converts %d °F to %d °C', (f, c) => {
    expect(fahrenheitToCelsius(f)).toBeCloseTo(c, 10);
  });

  it('round-trips without drift', () => {
    for (const c of [-45, -12.7, 0, 18.3, 41.1]) {
      expect(fahrenheitToCelsius(celsiusToFahrenheit(c))).toBeCloseTo(c, 10);
    }
  });
});

describe('growingDegreeDays', () => {
  it('accrues the mean temperature above the base', () => {
    // mean 20 °C, base 10 °C
    expect(growingDegreeDays(15, 25, 10)).toBe(10);
  });

  it('accrues nothing on a day colder than the base', () => {
    expect(growingDegreeDays(2, 8, 10)).toBe(0);
  });

  it('never returns a negative value, so cold days do not undo progress', () => {
    expect(growingDegreeDays(-10, -2, 10)).toBe(0);
  });

  it('uses a crop-specific base: warm-season crops accrue less on the same day', () => {
    const coolSeasonBase = 4.4; // e.g. brassicas, peas
    const warmSeasonBase = 10; // e.g. tomatoes, beans
    const day = { min: 10, max: 20 }; // mean 15 °C
    expect(growingDegreeDays(day.min, day.max, coolSeasonBase)).toBeCloseTo(10.6, 10);
    expect(growingDegreeDays(day.min, day.max, warmSeasonBase)).toBeCloseTo(5, 10);
  });
});

describe('hardinessZone', () => {
  // The USDA definition: zone 1a starts at -60 °F, each zone spans 10 °F, the
  // 'a' half is the colder 5 °F. These are the published band boundaries.
  it.each([
    // [mean annual extreme minimum °F, expected label]
    [-60, '1a'],
    [-55, '1b'],
    [-50, '2a'],
    [-20, '5a'],
    [-15, '5b'],
    [-10, '6a'],
    [-5, '6b'],
    [0, '7a'],
    [5, '7b'],
    [10, '8a'],
    [20, '9a'],
    [35, '10b'],
    [60, '13a'],
  ])('maps a mean extreme minimum of %d °F to zone %s', (f, label) => {
    expect(hardinessZone(fahrenheitToCelsius(f)).label).toBe(label);
  });

  it('places a temperature inside a band in that band, not at its edge', () => {
    // -7 °F sits within 6a's -10..-5 °F band.
    expect(hardinessZone(fahrenheitToCelsius(-7)).label).toBe('6a');
  });

  it('splits zone and half so callers can compare zones numerically', () => {
    expect(hardinessZone(fahrenheitToCelsius(-3))).toEqual({ zone: 6, half: 'b', label: '6b' });
  });
});
