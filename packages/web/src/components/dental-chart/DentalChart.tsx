'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { UPPER_TEETH, LOWER_TEETH, TOOTH_MAP } from '@/lib/toothMap';
import ToothSVG, { type ToothCondition } from './ToothSVG';
import ToothPopover from './ToothPopover';
import ChartLegend from './ChartLegend';

export interface ToothRecord {
  conditions: ToothCondition[];
  status: 'healthy' | 'missing' | 'implant';
  notes: string;
}

export interface DentalChartProps {
  /** Map of tooth number -> tooth record. Missing entries are treated as healthy with no conditions. */
  teethData?: Record<number, ToothRecord>;
  /** Called when a tooth's data is saved from the popover. */
  onToothSave?: (toothNumber: number, record: ToothRecord) => void;
  /** Read-only mode hides edit controls. */
  readOnly?: boolean;
}

const DEFAULT_RECORD: ToothRecord = {
  conditions: [],
  status: 'healthy',
  notes: '',
};

export default function DentalChart({
  teethData = {},
  onToothSave,
  readOnly = false,
}: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const getRecord = useCallback(
    (n: number): ToothRecord => teethData[n] ?? DEFAULT_RECORD,
    [teethData]
  );

  const handleToothClick = useCallback(
    (toothNumber: number) => {
      setSelectedTooth(toothNumber);
      if (!readOnly) {
        setPopoverOpen(true);
      }
    },
    [readOnly]
  );

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setPopoverOpen(open);
    if (!open) {
      setSelectedTooth(null);
    }
  }, []);

  const handleSave = useCallback(
    (toothNumber: number, conditions: ToothCondition[], notes: string) => {
      const existing = teethData[toothNumber];
      const record: ToothRecord = {
        conditions,
        status: existing?.status ?? 'healthy',
        notes,
      };
      onToothSave?.(toothNumber, record);
    },
    [teethData, onToothSave]
  );

  const renderTooth = useCallback(
    (toothNumber: number) => {
      const record = getRecord(toothNumber);
      const toothElement = (
        <ToothSVG
          key={toothNumber}
          toothNumber={toothNumber}
          conditions={record.conditions}
          status={record.status}
          isSelected={selectedTooth === toothNumber}
          onClick={handleToothClick}
          size={48}
        />
      );

      if (readOnly) {
        return <div key={toothNumber}>{toothElement}</div>;
      }

      return (
        <ToothPopover
          key={toothNumber}
          toothNumber={toothNumber}
          conditions={record.conditions}
          notes={record.notes}
          open={popoverOpen && selectedTooth === toothNumber}
          onOpenChange={handlePopoverOpenChange}
          onSave={handleSave}
        >
          <div>{toothElement}</div>
        </ToothPopover>
      );
    },
    [
      getRecord,
      selectedTooth,
      popoverOpen,
      readOnly,
      handleToothClick,
      handlePopoverOpenChange,
      handleSave,
    ]
  );

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Chart container */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        {/* Quadrant labels */}
        <div className="flex justify-between mb-1 px-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Upper Right
          </span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Upper Left
          </span>
        </div>

        {/* Upper arch */}
        <div className="flex justify-center">
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto">
            {UPPER_TEETH.slice(0, 8).map(renderTooth)}

            {/* Midline */}
            <div className="flex items-stretch mx-0.5">
              <div className="w-px bg-slate-300" />
            </div>

            {UPPER_TEETH.slice(8).map(renderTooth)}
          </div>
        </div>

        {/* Arch separator */}
        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 border-t border-dashed border-slate-200" />
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            MIDLINE
          </span>
          <div className="flex-1 border-t border-dashed border-slate-200" />
        </div>

        {/* Lower arch */}
        <div className="flex justify-center">
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto">
            {LOWER_TEETH.slice(0, 8).map(renderTooth)}

            {/* Midline */}
            <div className="flex items-stretch mx-0.5">
              <div className="w-px bg-slate-300" />
            </div>

            {LOWER_TEETH.slice(8).map(renderTooth)}
          </div>
        </div>

        {/* Lower quadrant labels */}
        <div className="flex justify-between mt-1 px-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Lower Right
          </span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Lower Left
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full max-w-4xl bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Legend
        </p>
        <ChartLegend />
      </div>
    </div>
  );
}
