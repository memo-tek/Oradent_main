export interface ToothInfo {
  number: number;
  name: string;
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  quadrant: 1 | 2 | 3 | 4;
  arch: 'upper' | 'lower';
  side: 'right' | 'left';
  surfaces: string[];
  fdiNumber: number;
  palmerNotation: string;
}

const TOOTH_DATA: Record<number, Omit<ToothInfo, 'number' | 'surfaces'>> = {
  1:  { name: 'Upper Right Third Molar', type: 'molar', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 18, palmerNotation: '8┘' },
  2:  { name: 'Upper Right Second Molar', type: 'molar', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 17, palmerNotation: '7┘' },
  3:  { name: 'Upper Right First Molar', type: 'molar', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 16, palmerNotation: '6┘' },
  4:  { name: 'Upper Right Second Premolar', type: 'premolar', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 15, palmerNotation: '5┘' },
  5:  { name: 'Upper Right First Premolar', type: 'premolar', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 14, palmerNotation: '4┘' },
  6:  { name: 'Upper Right Canine', type: 'canine', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 13, palmerNotation: '3┘' },
  7:  { name: 'Upper Right Lateral Incisor', type: 'incisor', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 12, palmerNotation: '2┘' },
  8:  { name: 'Upper Right Central Incisor', type: 'incisor', quadrant: 1, arch: 'upper', side: 'right', fdiNumber: 11, palmerNotation: '1┘' },
  9:  { name: 'Upper Left Central Incisor', type: 'incisor', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 21, palmerNotation: '└1' },
  10: { name: 'Upper Left Lateral Incisor', type: 'incisor', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 22, palmerNotation: '└2' },
  11: { name: 'Upper Left Canine', type: 'canine', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 23, palmerNotation: '└3' },
  12: { name: 'Upper Left First Premolar', type: 'premolar', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 24, palmerNotation: '└4' },
  13: { name: 'Upper Left Second Premolar', type: 'premolar', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 25, palmerNotation: '└5' },
  14: { name: 'Upper Left First Molar', type: 'molar', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 26, palmerNotation: '└6' },
  15: { name: 'Upper Left Second Molar', type: 'molar', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 27, palmerNotation: '└7' },
  16: { name: 'Upper Left Third Molar', type: 'molar', quadrant: 2, arch: 'upper', side: 'left', fdiNumber: 28, palmerNotation: '└8' },
  17: { name: 'Lower Left Third Molar', type: 'molar', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 38, palmerNotation: '┌8' },
  18: { name: 'Lower Left Second Molar', type: 'molar', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 37, palmerNotation: '┌7' },
  19: { name: 'Lower Left First Molar', type: 'molar', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 36, palmerNotation: '┌6' },
  20: { name: 'Lower Left Second Premolar', type: 'premolar', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 35, palmerNotation: '┌5' },
  21: { name: 'Lower Left First Premolar', type: 'premolar', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 34, palmerNotation: '┌4' },
  22: { name: 'Lower Left Canine', type: 'canine', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 33, palmerNotation: '┌3' },
  23: { name: 'Lower Left Lateral Incisor', type: 'incisor', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 32, palmerNotation: '┌2' },
  24: { name: 'Lower Left Central Incisor', type: 'incisor', quadrant: 3, arch: 'lower', side: 'left', fdiNumber: 31, palmerNotation: '┌1' },
  25: { name: 'Lower Right Central Incisor', type: 'incisor', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 41, palmerNotation: '1┐' },
  26: { name: 'Lower Right Lateral Incisor', type: 'incisor', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 42, palmerNotation: '2┐' },
  27: { name: 'Lower Right Canine', type: 'canine', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 43, palmerNotation: '3┐' },
  28: { name: 'Lower Right First Premolar', type: 'premolar', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 44, palmerNotation: '4┐' },
  29: { name: 'Lower Right Second Premolar', type: 'premolar', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 45, palmerNotation: '5┐' },
  30: { name: 'Lower Right First Molar', type: 'molar', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 46, palmerNotation: '6┐' },
  31: { name: 'Lower Right Second Molar', type: 'molar', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 47, palmerNotation: '7┐' },
  32: { name: 'Lower Right Third Molar', type: 'molar', quadrant: 4, arch: 'lower', side: 'right', fdiNumber: 48, palmerNotation: '8┐' },
};

function getSurfaces(type: string): string[] {
  if (type === 'incisor' || type === 'canine') {
    return ['M', 'I', 'D', 'B', 'L'];
  }
  return ['M', 'O', 'D', 'B', 'L'];
}

export function getToothInfo(toothNumber: number): ToothInfo | null {
  const data = TOOTH_DATA[toothNumber];
  if (!data) return null;
  return {
    number: toothNumber,
    ...data,
    surfaces: getSurfaces(data.type),
  };
}

export function getAllTeeth(): ToothInfo[] {
  return Object.entries(TOOTH_DATA).map(([num, data]) => ({
    number: parseInt(num),
    ...data,
    surfaces: getSurfaces(data.type),
  }));
}

export function getUpperTeeth(): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
}

export function getLowerTeeth(): number[] {
  return [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];
}
