import { describe, expect, it } from 'vitest';
import {
  bedVolumeLitres,
  feetToMm,
  inchesToMm,
  mmToFeet,
  mmToInches,
  rectangleAreaSqM,
  sqFtToSqM,
  sqMToSqFt,
} from './length.js';

describe('inches and millimetres', () => {
  it('uses the exact definition of the international inch', () => {
    expect(inchesToMm(1)).toBe(25.4);
  });

  it('converts the spacings extension charts actually publish', () => {
    expect(inchesToMm(12)).toBeCloseTo(304.8, 10); // one square-foot cell
    expect(inchesToMm(18)).toBeCloseTo(457.2, 10); // e.g. tomato in-row spacing
    expect(inchesToMm(3)).toBeCloseTo(76.2, 10); // e.g. carrot thinning
  });

  it('round-trips without drift', () => {
    for (const inches of [0.5, 3, 12, 18, 36, 96]) {
      expect(mmToInches(inchesToMm(inches))).toBeCloseTo(inches, 10);
    }
  });
});

describe('feet and millimetres', () => {
  it('converts common bed dimensions', () => {
    expect(feetToMm(4)).toBeCloseTo(1219.2, 10);
    expect(feetToMm(8)).toBeCloseTo(2438.4, 10);
  });

  it('round-trips without drift', () => {
    for (const feet of [2, 3, 4, 8, 12.5]) {
      expect(mmToFeet(feetToMm(feet))).toBeCloseTo(feet, 10);
    }
  });
});

describe('area', () => {
  it('converts square feet to square metres', () => {
    expect(sqFtToSqM(1)).toBeCloseTo(0.09290304, 12);
    expect(sqFtToSqM(32)).toBeCloseTo(2.9728973, 6); // a 4x8 ft bed
  });

  it('round-trips without drift', () => {
    for (const sqft of [1, 32, 100, 200]) {
      expect(sqMToSqFt(sqFtToSqM(sqft))).toBeCloseTo(sqft, 8);
    }
  });

  it('computes a 4x8 ft bed as about 2.97 m²', () => {
    const area = rectangleAreaSqM(feetToMm(4), feetToMm(8));
    expect(area).toBeCloseTo(2.9728973, 6);
    expect(sqMToSqFt(area)).toBeCloseTo(32, 8);
  });
});

describe('bedVolumeLitres', () => {
  it('computes the soil needed to fill a 4x8 ft bed 10 inches deep', () => {
    // 2.9729 m² x 0.254 m = 0.7551 m³ = 755 litres, about 26.7 cubic feet.
    const litres = bedVolumeLitres(feetToMm(4), feetToMm(8), inchesToMm(10));
    expect(litres).toBeCloseTo(755.1159, 3);
  });

  it('scales linearly with depth', () => {
    const shallow = bedVolumeLitres(1000, 1000, 100);
    const deep = bedVolumeLitres(1000, 1000, 200);
    expect(deep).toBeCloseTo(shallow * 2, 10);
  });

  it('treats a cubic metre as 1000 litres', () => {
    expect(bedVolumeLitres(1000, 1000, 1000)).toBeCloseTo(1000, 10);
  });
});
