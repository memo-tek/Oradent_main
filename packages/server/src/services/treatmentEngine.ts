import { z } from 'zod';
import { callClaude } from './claudeAI';
import { logger } from '../utils/logger';
import type { ToothCondition, MedicalHistory, InsuranceInfo, FeeScheduleItem } from '@prisma/client';

const TREATMENT_SUGGESTION_PROMPT = `You are an expert dental treatment planning AI assistant. Based on the following patient dental chart conditions and medical history, suggest a comprehensive treatment plan.

IMPORTANT: You are an AI assistant providing suggestions to help the dentist. All treatment plans must be reviewed and approved by the licensed dentist. This is a decision-support tool, NOT a clinical directive.

Provide a treatment plan organized by priority:
Priority 1 — Urgent (pain, infection, structural failure)
Priority 2 — Soon (progressive conditions, at-risk teeth)
Priority 3 — Elective (cosmetic, optimization)

For each item provide:
- tooth_number, surfaces
- cdt_code, description
- rationale (why this treatment)
- estimated_fee
- insurance_coverage_estimate
- alternatives (other treatment options with pros/cons)
- sequencing_notes (what must come before/after)

Consider medical contraindications from the patient's medical history.

Return ONLY valid JSON with no markdown wrapping: { "treatment_plan": [...], "summary": "...", "total_estimated_cost": 0, "total_insurance_estimate": 0, "contraindications": [] }`;

const treatmentItemSchema = z.object({
  tooth_number: z.number().optional(),
  surfaces: z.array(z.string()).optional().default([]),
  cdt_code: z.string(),
  description: z.string(),
  rationale: z.string(),
  estimated_fee: z.number(),
  insurance_coverage_estimate: z.number().optional().default(0),
  alternatives: z.array(z.object({
    description: z.string(),
    pros: z.string().optional().default(''),
    cons: z.string().optional().default(''),
  })).optional().default([]),
  sequencing_notes: z.string().optional().default(''),
  priority: z.number().min(1).max(3).optional().default(2),
});

const treatmentPlanSchema = z.object({
  treatment_plan: z.array(treatmentItemSchema),
  summary: z.string(),
  total_estimated_cost: z.number(),
  total_insurance_estimate: z.number().optional().default(0),
  contraindications: z.array(z.string()).optional().default([]),
});

export type TreatmentPlanResult = z.infer<typeof treatmentPlanSchema>;

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

export async function suggestTreatment(
  dentalChart: ToothCondition[],
  medicalHistory: MedicalHistory | null,
  insurance: InsuranceInfo | null,
  feeSchedule: FeeScheduleItem[]
): Promise<TreatmentPlanResult> {
  try {
    const conditions = dentalChart.map((t) => ({
      tooth: t.toothNumber,
      conditions: t.conditions,
      status: t.status,
    }));

    const medicalAlerts: string[] = [];
    if (medicalHistory) {
      const allergies = medicalHistory.allergies as string[];
      const meds = medicalHistory.medications as string[];
      const conds = medicalHistory.conditions as string[];
      if (allergies?.length) medicalAlerts.push(`Allergies: ${allergies.join(', ')}`);
      if (meds?.length) medicalAlerts.push(`Medications: ${meds.join(', ')}`);
      if (conds?.length) medicalAlerts.push(`Conditions: ${conds.join(', ')}`);
      if (medicalHistory.isPregnant) medicalAlerts.push('Patient is pregnant — avoid elective radiographs and certain medications');
      if (medicalHistory.smokingStatus === 'current') medicalAlerts.push('Current smoker — increased periodontal and healing risk');
    }

    const coverage = insurance
      ? {
          company: insurance.company,
          coveragePercent: insurance.coveragePercent,
          remainingBenefit: insurance.remainingBenefit,
          deductible: insurance.deductible,
          deductibleMet: insurance.deductibleMet,
        }
      : null;

    // Send all fees (not just first 50) grouped by category for context
    const feesByCategory: Record<string, Array<{ code: string; description: string; fee: number }>> = {};
    for (const f of feeSchedule) {
      const cat = f.category || 'Other';
      if (!feesByCategory[cat]) feesByCategory[cat] = [];
      feesByCategory[cat].push({ code: f.cdtCode, description: f.description, fee: f.fee });
    }

    const userMessage = `
Patient dental conditions: ${JSON.stringify(conditions)}
Medical history alerts: ${medicalAlerts.join('; ') || 'None'}
Insurance coverage: ${coverage ? JSON.stringify(coverage) : 'No insurance'}
Fee schedule: ${JSON.stringify(feesByCategory)}
    `.trim();

    const response = await callClaude(TREATMENT_SUGGESTION_PROMPT, userMessage, {
      maxTokens: 8192,
    });

    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);
    return treatmentPlanSchema.parse(parsed);
  } catch (error) {
    logger.error(error, 'Treatment suggestion failed');
    throw error;
  }
}
