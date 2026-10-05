'use client';

import React, { useCallback, useMemo } from 'react';
import { TOOTH_MAP, isAnterior, getCenterSurfaceLabel } from '@/lib/toothMap';
import { getConditionColor } from '@/lib/conditionColors';

export interface ToothCondition {
  surface: string;
  condition: string;
}

export interface ToothSVGProps {
  toothNumber: number;
  conditions?: ToothCondition[];
  status?: 'healthy' | 'missing' | 'implant';
  isSelected?: boolean;
  onClick?: (toothNumber: number) => void;
  onSurfaceClick?: (toothNumber: number, surface: string) => void;
  size?: number;
}

/**
 * SVG surface paths for the 5-sided cross pattern.
 * ViewBox is 60x60. Center square is 20x20 at (20,20)-(40,40).
 * Trapezoids extend from center square to edges.
 */
const SURFACE_PATHS = {
  // Top trapezoid: from top edge to center square top
  top: 'M 0 0 L 60 0 L 40 20 L 20 20 Z',
  // Bottom trapezoid: from center square bottom to bottom edge
  bottom: 'M 20 40 L 40 40 L 60 60 L 0 60 Z',
  // Left trapezoid: from left edge to center square left
  left: 'M 0 0 L 20 20 L 20 40 L 0 60 Z',
  // Right trapezoid: from center square right to right edge
  right: 'M 40 20 L 60 0 L 60 60 L 40 40 Z',
  // Center square: occlusal/incisal
  center: 'M 20 20 L 40 20 L 40 40 L 20 40 Z',
};

/**
 * Maps surface labels to path positions based on arch.
 * Upper teeth: Top=B, Bottom=L
 * Lower teeth: Top=L, Bottom=B
 */
function getSurfacePathMap(arch: 'upper' | 'lower') {
  if (arch === 'upper') {
    return {
      B: 'top',
      L: 'bottom',
      M: 'left',
      D: 'right',
    };
  }
  return {
    L: 'top',
    B: 'bottom',
    M: 'left',
    D: 'right',
  };
}

/** Label positions for each path region */
const LABEL_POSITIONS: Record<string, { x: number; y: number }> = {
  top: { x: 30, y: 12 },
  bottom: { x: 30, y: 53 },
  left: { x: 8, y: 32 },
  right: { x: 52, y: 32 },
  center: { x: 30, y: 33 },
};

export default function ToothSVG({
  toothNumber,
  conditions = [],
  status = 'healthy',
  isSelected = false,
  onClick,
  onSurfaceClick,
  size = 60,
}: ToothSVGProps) {
  const tooth = TOOTH_MAP[toothNumber];
  if (!tooth) return null;

  const isMissing = status === 'missing';
  const isImplant = status === 'implant';
  const centerLabel = getCenterSurfaceLabel(toothNumber);
  const surfacePathMap = getSurfacePathMap(tooth.arch);

  /** Build a map of surface -> condition color */
  const surfaceColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of conditions) {
      map[c.surface] = getConditionColor(c.condition);
    }
    return map;
  }, [conditions]);

  const handleClick = useCallback(() => {
    onClick?.(toothNumber);
  }, [onClick, toothNumber]);

  const handleSurfaceClick = useCallback(
    (e: React.MouseEvent, surface: string) => {
      e.stopPropagation();
      onSurfaceClick?.(toothNumber, surface);
    },
    [onSurfaceClick, toothNumber]
  );

  const healthyColor = '#e8f5e9';
  const missingColor = '#d1d5db';

  // All surface entries: [surfaceLabel, pathKey]
  const surfaceEntries: [string, string][] = [
    ...Object.entries(surfacePathMap),
    [centerLabel, 'center'],
  ];

  return (
    <div
      className="flex flex-col items-center gap-0.5 cursor-pointer select-none"
      onClick={handleClick}
    >
      <svg
        viewBox="0 0 60 60"
        width={size}
        height={size}
        className="block"
        role="img"
        aria-label={`Tooth ${toothNumber} - ${tooth.name}`}
      >
        {/* Selected ring */}
        {isSelected && (
          <rect
            x={-2}
            y={-2}
            width={64}
            height={64}
            rx={6}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={3}
          />
        )}

        {/* Implant border */}
        {isImplant && (
          <rect
            x={1}
            y={1}
            width={58}
            height={58}
            rx={4}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={2.5}
            strokeDasharray="4 2"
          />
        )}

        {/* Surface paths */}
        {surfaceEntries.map(([surfaceLabel, pathKey]) => {
          const path = SURFACE_PATHS[pathKey as keyof typeof SURFACE_PATHS];
          const fill = isMissing
            ? missingColor
            : surfaceColorMap[surfaceLabel] ?? healthyColor;

          return (
            <g key={surfaceLabel}>
              <path
                d={path}
                fill={fill}
                stroke="#94a3b8"
                strokeWidth={0.8}
                className="transition-colors duration-150 hover:brightness-110 hover:opacity-90"
                onClick={(e) => handleSurfaceClick(e, surfaceLabel)}
                style={{ cursor: 'pointer' }}
              />
              <text
                x={LABEL_POSITIONS[pathKey].x}
                y={LABEL_POSITIONS[pathKey].y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8}
                fontFamily="'IBM Plex Mono', monospace"
                fill="#475569"
                pointerEvents="none"
                className="select-none"
              >
                {surfaceLabel}
              </text>
            </g>
          );
        })}

        {/* Missing X overlay */}
        {isMissing && (
          <g>
            <line
              x1={5}
              y1={5}
              x2={55}
              y2={55}
              stroke="#6b7280"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={55}
              y1={5}
              x2={5}
              y2={55}
              stroke="#6b7280"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>

      {/* Tooth number label */}
      <span
        className={`text-[10px] font-mono leading-none ${
          isSelected ? 'text-blue-600 font-bold' : 'text-slate-600'
        }`}
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {toothNumber}
      </span>
    </div>
  );
}
