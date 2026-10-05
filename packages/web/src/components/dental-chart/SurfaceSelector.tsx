'use client';

import React, { useCallback } from 'react';
import { getCenterSurfaceLabel } from '@/lib/toothMap';

export interface SurfaceSelectorProps {
  toothNumber: number;
  selectedSurfaces: string[];
  onToggle: (surface: string) => void;
  size?: number;
}

const SURFACE_PATHS_LARGE = {
  top: 'M 0 0 L 100 0 L 66 34 L 34 34 Z',
  bottom: 'M 34 66 L 66 66 L 100 100 L 0 100 Z',
  left: 'M 0 0 L 34 34 L 34 66 L 0 100 Z',
  right: 'M 66 34 L 100 0 L 100 100 L 66 66 Z',
  center: 'M 34 34 L 66 34 L 66 66 L 34 66 Z',
};

const LABEL_POSITIONS_LARGE: Record<string, { x: number; y: number }> = {
  top: { x: 50, y: 17 },
  bottom: { x: 50, y: 85 },
  left: { x: 14, y: 50 },
  right: { x: 86, y: 50 },
  center: { x: 50, y: 52 },
};

function getSurfacePathMapForArch(arch: 'upper' | 'lower') {
  if (arch === 'upper') {
    return { B: 'top', L: 'bottom', M: 'left', D: 'right' };
  }
  return { L: 'top', B: 'bottom', M: 'left', D: 'right' };
}

export default function SurfaceSelector({
  toothNumber,
  selectedSurfaces,
  onToggle,
  size = 100,
}: SurfaceSelectorProps) {
  const { TOOTH_MAP } = require('@/lib/toothMap');
  const tooth = TOOTH_MAP[toothNumber];
  if (!tooth) return null;

  const arch = tooth.arch as 'upper' | 'lower';
  const centerLabel = getCenterSurfaceLabel(toothNumber);
  const surfacePathMap = getSurfacePathMapForArch(arch);

  const surfaceEntries: [string, string][] = [
    ...Object.entries(surfacePathMap),
    [centerLabel, 'center'],
  ];

  const isSelected = (s: string) => selectedSurfaces.includes(s);

  const handleClick = useCallback(
    (e: React.MouseEvent, surface: string) => {
      e.stopPropagation();
      onToggle(surface);
    },
    [onToggle]
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" width={size} height={size} className="block">
        {surfaceEntries.map(([surfaceLabel, pathKey]) => {
          const path =
            SURFACE_PATHS_LARGE[pathKey as keyof typeof SURFACE_PATHS_LARGE];
          const selected = isSelected(surfaceLabel);

          return (
            <g key={surfaceLabel}>
              <path
                d={path}
                fill={selected ? '#14b8a6' : '#f1f5f9'}
                stroke={selected ? '#0d9488' : '#94a3b8'}
                strokeWidth={1.5}
                className="cursor-pointer transition-colors duration-150 hover:opacity-80"
                onClick={(e) => handleClick(e, surfaceLabel)}
              />
              <text
                x={LABEL_POSITIONS_LARGE[pathKey].x}
                y={LABEL_POSITIONS_LARGE[pathKey].y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={600}
                fontFamily="'IBM Plex Mono', monospace"
                fill={selected ? '#ffffff' : '#475569'}
                pointerEvents="none"
                className="select-none"
              >
                {surfaceLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-slate-500">Click surfaces to select</p>
    </div>
  );
}
