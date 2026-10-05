'use client';

import React from 'react';
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  CONDITION_KEYS,
} from '@/lib/conditionColors';

export interface ConditionPaletteProps {
  selectedCondition: string | null;
  onSelect: (condition: string) => void;
}

export default function ConditionPalette({
  selectedCondition,
  onSelect,
}: ConditionPaletteProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {CONDITION_KEYS.filter((k) => k !== 'healthy').map((key) => {
        const color = CONDITION_COLORS[key];
        const label = CONDITION_LABELS[key];
        const isActive = selectedCondition === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all
              ${
                isActive
                  ? 'ring-2 ring-blue-500 ring-offset-1 bg-slate-100'
                  : 'bg-white hover:bg-slate-50 border border-slate-200'
              }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="truncate text-slate-700">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
