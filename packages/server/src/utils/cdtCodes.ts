import fs from 'fs';
import path from 'path';

export interface CDTCode {
  code: string;
  description: string;
  category: string;
  fee: number;
}

let cdtCodes: CDTCode[] = [];

export function loadCDTCodes(): CDTCode[] {
  if (cdtCodes.length > 0) return cdtCodes;

  try {
    const filePath = path.join(__dirname, '../../data/cdt-codes.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    cdtCodes = JSON.parse(data);
  } catch {
    console.warn('CDT codes file not found, using empty list');
    cdtCodes = [];
  }

  return cdtCodes;
}

export function searchCDTCodes(query: string): CDTCode[] {
  const codes = loadCDTCodes();
  const q = query.toLowerCase();
  return codes.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
  );
}

export function getCDTCode(code: string): CDTCode | undefined {
  const codes = loadCDTCodes();
  return codes.find((c) => c.code === code);
}

export function getCDTCodesByCategory(category: string): CDTCode[] {
  const codes = loadCDTCodes();
  return codes.filter((c) => c.category === category);
}
