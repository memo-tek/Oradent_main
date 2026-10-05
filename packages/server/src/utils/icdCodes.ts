import fs from 'fs';
import path from 'path';

export interface ICDCode {
  code: string;
  description: string;
  category: string;
}

let icdCodes: ICDCode[] = [];

export function loadICDCodes(): ICDCode[] {
  if (icdCodes.length > 0) return icdCodes;

  try {
    const filePath = path.join(__dirname, '../../data/icd10-dental.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    icdCodes = JSON.parse(data);
  } catch {
    console.warn('ICD-10 codes file not found, using empty list');
    icdCodes = [];
  }

  return icdCodes;
}

export function searchICDCodes(query: string): ICDCode[] {
  const codes = loadICDCodes();
  const q = query.toLowerCase();
  return codes.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}
