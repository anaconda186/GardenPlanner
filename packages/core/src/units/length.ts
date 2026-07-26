/**
 * Length and area conversion.
 *
 * Millimetres are canonical for length and square metres for area, everywhere in
 * storage and in every engine. Imperial exists only at the UI edge. Storing the
 * display unit is how rounding drift starts: a 4 ft bed entered as inches,
 * rendered as centimetres and saved back as inches slowly stops being 4 ft.
 *
 * Spacing data from extension services is published in inches, so inch
 * conversion is exact rather than approximate: the international inch is defined
 * as exactly 25.4 mm.
 */

export const MM_PER_INCH = 25.4;
export const MM_PER_FOOT = 304.8;
/** Square feet to square metres: (0.3048 m)². */
export const SQM_PER_SQFT = 0.09290304;

export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

export function feetToMm(feet: number): number {
  return feet * MM_PER_FOOT;
}

export function mmToFeet(mm: number): number {
  return mm / MM_PER_FOOT;
}

export function sqFtToSqM(squareFeet: number): number {
  return squareFeet * SQM_PER_SQFT;
}

export function sqMToSqFt(squareMetres: number): number {
  return squareMetres / SQM_PER_SQFT;
}

/**
 * Area of a rectangular bed in square metres, from millimetre dimensions.
 *
 * Beds are stored in mm, but every per-area figure the app reasons about —
 * yield per square metre, how much space a household needs, seeding rates — is
 * metric area, so this conversion happens constantly.
 */
export function rectangleAreaSqM(widthMm: number, lengthMm: number): number {
  return (widthMm / 1000) * (lengthMm / 1000);
}

/** Volume in litres of a bed of the given footprint and soil depth, all mm. */
export function bedVolumeLitres(widthMm: number, lengthMm: number, depthMm: number): number {
  return (widthMm / 1000) * (lengthMm / 1000) * (depthMm / 1000) * 1000;
}
