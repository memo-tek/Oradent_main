export interface ToothData {
  number: number;
  name: string;
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  quadrant: 1 | 2 | 3 | 4;
  arch: 'upper' | 'lower';
  surfaces: string[];
}

const POSTERIOR_SURFACES = ['M', 'O', 'D', 'B', 'L'];
const ANTERIOR_SURFACES = ['M', 'I', 'D', 'B', 'L'];

export const TOOTH_MAP: Record<number, ToothData> = {
  // Upper Right Quadrant (1-8) - Quadrant 1
  1:  { number: 1,  name: 'Upper Right Third Molar',       type: 'molar',    quadrant: 1, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  2:  { number: 2,  name: 'Upper Right Second Molar',      type: 'molar',    quadrant: 1, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  3:  { number: 3,  name: 'Upper Right First Molar',       type: 'molar',    quadrant: 1, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  4:  { number: 4,  name: 'Upper Right Second Premolar',   type: 'premolar', quadrant: 1, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  5:  { number: 5,  name: 'Upper Right First Premolar',    type: 'premolar', quadrant: 1, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  6:  { number: 6,  name: 'Upper Right Canine',            type: 'canine',   quadrant: 1, arch: 'upper', surfaces: ANTERIOR_SURFACES },
  7:  { number: 7,  name: 'Upper Right Lateral Incisor',   type: 'incisor',  quadrant: 1, arch: 'upper', surfaces: ANTERIOR_SURFACES },
  8:  { number: 8,  name: 'Upper Right Central Incisor',   type: 'incisor',  quadrant: 1, arch: 'upper', surfaces: ANTERIOR_SURFACES },

  // Upper Left Quadrant (9-16) - Quadrant 2
  9:  { number: 9,  name: 'Upper Left Central Incisor',    type: 'incisor',  quadrant: 2, arch: 'upper', surfaces: ANTERIOR_SURFACES },
  10: { number: 10, name: 'Upper Left Lateral Incisor',    type: 'incisor',  quadrant: 2, arch: 'upper', surfaces: ANTERIOR_SURFACES },
  11: { number: 11, name: 'Upper Left Canine',             type: 'canine',   quadrant: 2, arch: 'upper', surfaces: ANTERIOR_SURFACES },
  12: { number: 12, name: 'Upper Left First Premolar',     type: 'premolar', quadrant: 2, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  13: { number: 13, name: 'Upper Left Second Premolar',    type: 'premolar', quadrant: 2, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  14: { number: 14, name: 'Upper Left First Molar',        type: 'molar',    quadrant: 2, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  15: { number: 15, name: 'Upper Left Second Molar',       type: 'molar',    quadrant: 2, arch: 'upper', surfaces: POSTERIOR_SURFACES },
  16: { number: 16, name: 'Upper Left Third Molar',        type: 'molar',    quadrant: 2, arch: 'upper', surfaces: POSTERIOR_SURFACES },

  // Lower Left Quadrant (17-24) - Quadrant 3
  17: { number: 17, name: 'Lower Left Third Molar',        type: 'molar',    quadrant: 3, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  18: { number: 18, name: 'Lower Left Second Molar',       type: 'molar',    quadrant: 3, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  19: { number: 19, name: 'Lower Left First Molar',        type: 'molar',    quadrant: 3, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  20: { number: 20, name: 'Lower Left Second Premolar',    type: 'premolar', quadrant: 3, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  21: { number: 21, name: 'Lower Left First Premolar',     type: 'premolar', quadrant: 3, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  22: { number: 22, name: 'Lower Left Canine',             type: 'canine',   quadrant: 3, arch: 'lower', surfaces: ANTERIOR_SURFACES },
  23: { number: 23, name: 'Lower Left Lateral Incisor',    type: 'incisor',  quadrant: 3, arch: 'lower', surfaces: ANTERIOR_SURFACES },
  24: { number: 24, name: 'Lower Left Central Incisor',    type: 'incisor',  quadrant: 3, arch: 'lower', surfaces: ANTERIOR_SURFACES },

  // Lower Right Quadrant (25-32) - Quadrant 4
  25: { number: 25, name: 'Lower Right Central Incisor',   type: 'incisor',  quadrant: 4, arch: 'lower', surfaces: ANTERIOR_SURFACES },
  26: { number: 26, name: 'Lower Right Lateral Incisor',   type: 'incisor',  quadrant: 4, arch: 'lower', surfaces: ANTERIOR_SURFACES },
  27: { number: 27, name: 'Lower Right Canine',            type: 'canine',   quadrant: 4, arch: 'lower', surfaces: ANTERIOR_SURFACES },
  28: { number: 28, name: 'Lower Right First Premolar',    type: 'premolar', quadrant: 4, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  29: { number: 29, name: 'Lower Right Second Premolar',   type: 'premolar', quadrant: 4, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  30: { number: 30, name: 'Lower Right First Molar',       type: 'molar',    quadrant: 4, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  31: { number: 31, name: 'Lower Right Second Molar',      type: 'molar',    quadrant: 4, arch: 'lower', surfaces: POSTERIOR_SURFACES },
  32: { number: 32, name: 'Lower Right Third Molar',       type: 'molar',    quadrant: 4, arch: 'lower', surfaces: POSTERIOR_SURFACES },
};

/** Upper arch teeth from right to left (patient perspective), displayed left to right */
export const UPPER_TEETH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

/** Lower arch teeth from right to left (patient perspective), displayed left to right */
export const LOWER_TEETH = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

/** Returns the tooth type for a given tooth number */
export function getToothType(toothNumber: number): ToothData['type'] | undefined {
  return TOOTH_MAP[toothNumber]?.type;
}

/** Returns true if the tooth is anterior (incisors and canines) */
export function isAnterior(toothNumber: number): boolean {
  const type = TOOTH_MAP[toothNumber]?.type;
  return type === 'incisor' || type === 'canine';
}

/** Returns the surface labels for a given tooth number */
export function getSurfaces(toothNumber: number): string[] {
  return TOOTH_MAP[toothNumber]?.surfaces ?? [];
}

/** Returns the center surface label: 'I' for anterior, 'O' for posterior */
export function getCenterSurfaceLabel(toothNumber: number): string {
  return isAnterior(toothNumber) ? 'I' : 'O';
}
