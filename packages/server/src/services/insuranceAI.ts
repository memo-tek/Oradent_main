import { z } from 'zod';
import { callClaude } from './claudeAI';
import { logger } from '../utils/logger';
import type { Patient, InsuranceInfo, TreatmentPlan, TreatmentPlanItem, Practice, ToothCondition } from '@prisma/client';

const PRE_AUTH_PROMPT = `You are an expert dental insurance pre-authorization letter writer. Draft a professional pre-authorization letter that maximizes the chance of approval.

IMPORTANT: This letter will be reviewed and potentially modified by the dental provider before submission. Generate a professional draft.

Include:
- Proper dental terminology
- Clinical justification for each procedure
- Relevant ICD-10 diagnosis codes
- CDT procedure codes
- Narrative explaining medical necessity
- Supporting clinical findings
- Reference to ADA guidelines where applicable

Return valid JSON with no markdown wrapping:
{
  "letter": "Full letter text with proper formatting",
  "diagnosis_codes": ["K04.02 - Irreversible pulpitis"],
  "procedure_codes": ["D3330 - Root canal, molar"],
  "clinical_justification": "Summary of medical necessity",
  "supporting_evidence": ["Clinical finding 1", "Finding 2"]
}`;

const preAuthSchema = z.object({
  letter: z.string(),
  diagnosis_codes: z.array(z.string()).default([]),
  procedure_codes: z.array(z.string()).default([]),
  clinical_justification: z.string(),
  supporting_evidence: z.array(z.string()).optional().default([]),
});

export type PreAuthResult = z.infer<typeof preAuthSchema>;

type PatientWithRelations = Patient & {
  insurancePrimary: InsuranceInfo | null;
  dentalChart: ToothCondition[];
};

type PlanWithItems = TreatmentPlan & {
  items: TreatmentPlanItem[];
};

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

export async function draftPreAuthLetter(
  patient: PatientWithRelations,
  plan: PlanWithItems,
  practice: Practice
): Promise<PreAuthResult> {
  try {
    const userMessage = `
Practice: ${practice.name}, ${practice.address}, NPI: ${practice.npi || 'N/A'}
Patient: ${patient.firstName} ${patient.lastName}, DOB: ${patient.dateOfBirth.toISOString().split('T')[0]}
Insurance: ${patient.insurancePrimary?.company || 'N/A'}, Member ID: ${patient.insurancePrimary?.memberId || 'N/A'}
Group: ${patient.insurancePrimary?.groupNumber || 'N/A'}

Treatment Plan: ${plan.name}
Procedures:
${plan.items.map((item) => `- ${item.cdtCode}: ${item.description} (Tooth #${item.toothNumber || 'N/A'}, Surfaces: ${item.surfaces?.join(',') || 'N/A'}, Fee: $${item.fee})`).join('\n')}

Dental conditions:
${patient.dentalChart.map((t) => `Tooth #${t.toothNumber}: Status=${t.status}, Conditions=${JSON.stringify(t.conditions)}`).join('\n')}
    `.trim();

    const response = await callClaude(PRE_AUTH_PROMPT, userMessage, { maxTokens: 4096 });

    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);
    return preAuthSchema.parse(parsed);
  } catch (error) {
    logger.error(error, 'Pre-auth letter drafting failed');
    throw error;
  }
}
