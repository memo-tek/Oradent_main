'use client';

import React from 'react';
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  CONDITION_KEYS,
} from '@/lib/conditionColors';

export default function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-2 py-2">
      {CONDITION_KEYS.map((key) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm border border-slate-300"
            style={{ backgroundColor: CONDITION_COLORS[key] }}
          />
          <span className="text-[11px] text-slate-600 font-medium">
            {CONDITION_LABELS[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
