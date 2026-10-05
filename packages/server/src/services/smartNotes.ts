import { z } from 'zod';
import { callClaude } from './claudeAI';
import { logger } from '../utils/logger';

const SMART_NOTE_PROMPT = `You are an expert dental clinical note writer. Convert the dentist's brief clinical shorthand into a properly formatted SOAP note.

Use proper dental terminology and clinical language. Include relevant ICD-10 and CDT codes where appropriate.

IMPORTANT: Only include ICD-10 and CDT codes you are confident are correct. Do NOT make up codes.

Format the output as valid JSON with no markdown wrapping:
{
  "subjective": "Patient's chief complaint and history of present illness",
  "objective": "Clinical findings, exam results, radiographic findings",
  "assessment": "Diagnosis with ICD-10 codes",
  "plan": "Treatment plan with CDT codes and follow-up",
  "icd10_codes": ["K04.02 - Irreversible pulpitis"],
  "cdt_codes": ["D3330 - Root canal, molar"]
}`;

const smartNoteSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
  icd10_codes: z.array(z.string()).default([]),
  cdt_codes: z.array(z.string()).default([]),
});

export type SmartNoteResult = z.infer<typeof smartNoteSchema>;

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) return fenced[1];

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

export async function generateSmartNote(
  briefNote: string,
  noteType: string
): Promise<SmartNoteResult> {
  try {
    const userMessage = `Note type: ${noteType}\nBrief clinical note: ${briefNote}`;
    const response = await callClaude(SMART_NOTE_PROMPT, userMessage);

    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);
    return smartNoteSchema.parse(parsed);
  } catch (error) {
    logger.error(error, 'Smart note generation failed');
    throw error;
  }
}
