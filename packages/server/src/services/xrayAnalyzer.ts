import { readFile } from 'fs/promises';
import { z } from 'zod';
import { callClaudeVision } from './claudeAI';
import { logger } from '../utils/logger';

const XRAY_ANALYSIS_PROMPT = `You are an expert dental radiograph analyst AI assistant helping a dentist review dental X-rays. Analyze this dental radiograph and provide findings in the following JSON structure.

IMPORTANT: You are an AI assistant providing analysis to help the dentist. All findings must be reviewed and confirmed by the licensed dentist before any clinical decisions are made. This is NOT a diagnosis — it is a decision-support tool.

Analyze for:
1. Carious lesions (cavities) — location, size, proximity to pulp
2. Periapical pathology — radiolucencies, abscesses, granulomas
3. Periodontal bone loss — horizontal/vertical, severity
4. Existing restorations — quality, secondary caries, overhangs
5. Root abnormalities — resorption, fractures, dilaceration
6. Impacted teeth
7. Calculus deposits
8. Any other notable findings

Use FDI two-digit notation only. Upper right 11-18, upper left 21-28, lower left 31-38, lower right 41-48. Quadrants 1-2 are maxillary, 3-4 are mandibular. Make sure the jaw named in the description matches the tooth numbers.

For each finding, provide:
- tooth_number (integer, or null if the finding is not tooth-specific)
- finding_type
- location (surface/area)
- severity (mild/moderate/severe)
- confidence (0.0-1.0)
- description (brief clinical description)
- recommendation (suggested action)

Return ONLY valid JSON with no markdown wrapping: { "findings": [...], "summary": "...", "image_quality": "good/fair/poor", "image_type": "periapical/bitewing/panoramic", "overallConfidence": 0.0-1.0 }`;

const xrayFindingSchema = z.object({
  tooth_number: z.union([z.number(), z.string(), z.null()])
    .transform((value) => {
      if (value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      const number = Number(value);
      const toothNumber = Math.trunc(number);
      const quadrant = Math.floor(toothNumber / 10);
      const position = toothNumber % 10;
      return Number.isFinite(number) &&
        Number.isInteger(number) &&
        [1, 2, 3, 4].includes(quadrant) &&
        position >= 1 &&
        position <= 8
        ? toothNumber
        : null;
    }),
  finding_type: z.string(),
  location: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe']),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  recommendation: z.string(),
});

const xrayResultSchema = z.object({
  findings: z.array(xrayFindingSchema),
  summary: z.string(),
  image_quality: z.string(),
  image_type: z.string(),
  overallConfidence: z.number().min(0).max(1),
});

export type XrayFinding = z.infer<typeof xrayFindingSchema>;
export type XrayAnalysisResult = z.infer<typeof xrayResultSchema>;

function extractJSON(text: string): string {
  // Try to find JSON between code fences first
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) return fenced[1];

  // Find the outermost balanced braces
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  throw new Error('No valid JSON object found in AI response');
}

function detectMediaType(filePath: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function analyzeXray(
  filePath: string,
  imageType: string
): Promise<XrayAnalysisResult> {
  try {
    const imageBuffer = await readFile(filePath);
    const base64 = imageBuffer.toString('base64');
    const mediaType = detectMediaType(filePath);

    const response = await callClaudeVision(
      XRAY_ANALYSIS_PROMPT,
      base64,
      mediaType,
      `This is a ${imageType} dental radiograph. Please analyze it thoroughly.`
    );

    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);
    const result = xrayResultSchema.parse(parsed);

    return result;
  } catch (error) {
    logger.error(error, 'X-ray analysis failed');
    throw error;
  }
}
