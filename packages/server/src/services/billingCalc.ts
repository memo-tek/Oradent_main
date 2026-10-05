import type { InsuranceInfo } from '@prisma/client';

interface CoveragePercent {
  preventive: number;
  basic: number;
  major: number;
  orthodontic: number;
}

// CDT category mapping — more granular than simple D0-D9 prefix.
// Some code ranges within a category fall under different coverage tiers.
const CDT_CATEGORIES: Record<string, keyof CoveragePercent> = {
  D0: 'preventive',   // Diagnostic
  D1: 'preventive',   // Preventive
  D2: 'basic',        // Restorative (default basic)
  D3: 'major',        // Endodontics
  D4: 'basic',        // Periodontics (some plans classify as major)
  D5: 'major',        // Prosthodontics removable
  D6: 'major',        // Prosthodontics fixed / implants
  D7: 'basic',        // Oral surgery
  D8: 'orthodontic',  // Orthodontics
  D9: 'preventive',   // Adjunctive general
};

// More specific overrides for common codes
const CDT_OVERRIDES: Record<string, keyof CoveragePercent> = {
  // Crowns (D27xx) are typically major
  D2740: 'major', D2750: 'major', D2751: 'major', D2752: 'major',
  D2780: 'major', D2781: 'major', D2783: 'major', D2790: 'major',
  D2791: 'major', D2792: 'major', D2794: 'major',
  // Onlays are major
  D2542: 'major', D2543: 'major', D2544: 'major',
  // Inlays are major
  D2510: 'major', D2520: 'major', D2530: 'major',
  // Core buildups are major
  D2950: 'major', D2952: 'major', D2954: 'major',
  // Scaling & root planing (periodontics) — some plans classify as basic
  D4341: 'basic', D4342: 'basic',
  // Surgical perio is major on many plans
  D4260: 'major', D4261: 'major', D4263: 'major', D4264: 'major',
  // Bone grafts are major
  D4266: 'major', D4267: 'major',
};

function getCoverageCategory(cdtCode: string): keyof CoveragePercent {
  // Check specific code override first
  if (CDT_OVERRIDES[cdtCode]) return CDT_OVERRIDES[cdtCode];
  // Fall back to prefix-based category
  const prefix = cdtCode.substring(0, 2);
  return CDT_CATEGORIES[prefix] || 'basic';
}

export function estimateInsuranceCoverage(
  cdtCode: string,
  fee: number,
  insurance: InsuranceInfo | null
): { insurancePays: number; patientPays: number; category: string } {
  if (!insurance) {
    return { insurancePays: 0, patientPays: fee, category: 'none' };
  }

  const coverage = insurance.coveragePercent as unknown as CoveragePercent;
  if (!coverage) {
    return { insurancePays: 0, patientPays: fee, category: 'none' };
  }

  const category = getCoverageCategory(cdtCode);
  const coveragePercent = coverage[category] || 0;

  const remaining = insurance.remainingBenefit ?? Infinity;
  const deductibleRemaining = Math.max(0, (insurance.deductible || 0) - (insurance.deductibleMet || 0));

  // Preventive is typically not subject to deductible
  const effectiveDeductible = category === 'preventive' ? 0 : deductibleRemaining;
  const afterDeductible = Math.max(0, fee - effectiveDeductible);
  let insurancePays = (afterDeductible * coveragePercent) / 100;
  insurancePays = Math.min(insurancePays, remaining);

  const patientPays = fee - insurancePays;

  return {
    insurancePays: Math.round(insurancePays * 100) / 100,
    patientPays: Math.round(patientPays * 100) / 100,
    category,
  };
}

export function calculateTreatmentPlanEstimate(
  items: Array<{ cdtCode: string; fee: number }>,
  insurance: InsuranceInfo | null
): { totalFee: number; insuranceEst: number; patientEst: number; breakdown: Array<{ cdtCode: string; fee: number; insurancePays: number; patientPays: number; category: string }> } {
  let totalFee = 0;
  let insuranceEst = 0;
  let remainingBenefit = insurance?.remainingBenefit ?? Infinity;
  const breakdown: Array<{ cdtCode: string; fee: number; insurancePays: number; patientPays: number; category: string }> = [];

  for (const item of items) {
    totalFee += item.fee;
    const estimate = estimateInsuranceCoverage(item.cdtCode, item.fee, insurance);
    const actualInsurance = Math.min(estimate.insurancePays, remainingBenefit);
    insuranceEst += actualInsurance;
    remainingBenefit -= actualInsurance;

    breakdown.push({
      cdtCode: item.cdtCode,
      fee: item.fee,
      insurancePays: actualInsurance,
      patientPays: Math.round((item.fee - actualInsurance) * 100) / 100,
      category: estimate.category,
    });
  }

  return {
    totalFee: Math.round(totalFee * 100) / 100,
    insuranceEst: Math.round(insuranceEst * 100) / 100,
    patientEst: Math.round((totalFee - insuranceEst) * 100) / 100,
    breakdown,
  };
}
