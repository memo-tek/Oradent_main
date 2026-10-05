export const CONDITION_COLORS: Record<string, string> = {
  cavity: '#ef4444',
  filling: '#3b82f6',
  crown: '#f59e0b',
  bridge: '#f97316',
  implant: '#06b6d4',
  missing: '#d1d5db',
  rootCanal: '#8b5cf6',
  extraction: '#ec4899',
  veneer: '#a78bfa',
  sealant: '#10b981',
  fracture: '#dc2626',
  abscess: '#b91c1c',
  impacted: '#9ca3af',
  recession: '#facc15',
  mobility: '#fb923c',
  furcation: '#f87171',
  watchItem: '#fbbf24',
  healthy: '#e8f5e9',
};

export const CONDITION_LABELS: Record<string, string> = {
  cavity: 'Cavity',
  filling: 'Filling',
  crown: 'Crown',
  bridge: 'Bridge',
  implant: 'Implant',
  missing: 'Missing',
  rootCanal: 'Root Canal',
  extraction: 'Extraction',
  veneer: 'Veneer',
  sealant: 'Sealant',
  fracture: 'Fracture',
  abscess: 'Abscess',
  impacted: 'Impacted',
  recession: 'Recession',
  mobility: 'Mobility',
  furcation: 'Furcation',
  watchItem: 'Watch Item',
  healthy: 'Healthy',
};

/** All condition keys */
export const CONDITION_KEYS = Object.keys(CONDITION_COLORS);

/** Get the display color for a condition, with fallback */
export function getConditionColor(condition: string): string {
  return CONDITION_COLORS[condition] ?? '#e8f5e9';
}

/** Get the display label for a condition, with fallback */
export function getConditionLabel(condition: string): string {
  return CONDITION_LABELS[condition] ?? condition;
}
