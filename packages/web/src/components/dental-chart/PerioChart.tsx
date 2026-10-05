'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { UPPER_TEETH, LOWER_TEETH } from '@/lib/toothMap';

export interface PerioReading {
  MB: number | null;
  B: number | null;
  DB: number | null;
  ML: number | null;
  L: number | null;
  DL: number | null;
  bleedingMB?: boolean;
  bleedingB?: boolean;
  bleedingDB?: boolean;
  bleedingML?: boolean;
  bleedingL?: boolean;
  bleedingDL?: boolean;
}

export type PerioSite = 'MB' | 'B' | 'DB' | 'ML' | 'L' | 'DL';
export type BleedingSite = 'bleedingMB' | 'bleedingB' | 'bleedingDB' | 'bleedingML' | 'bleedingL' | 'bleedingDL';

const SITES: PerioSite[] = ['MB', 'B', 'DB', 'ML', 'L', 'DL'];
const BUCCAL_SITES: PerioSite[] = ['MB', 'B', 'DB'];
const LINGUAL_SITES: PerioSite[] = ['ML', 'L', 'DL'];

const EMPTY_READING: PerioReading = {
  MB: null, B: null, DB: null,
  ML: null, L: null, DL: null,
  bleedingMB: false, bleedingB: false, bleedingDB: false,
  bleedingML: false, bleedingL: false, bleedingDL: false,
};

export interface PerioChartProps {
  /** Map of tooth number -> perio readings */
  readings?: Record<number, PerioReading>;
  /** Called when a reading changes */
  onReadingChange?: (toothNumber: number, reading: PerioReading) => void;
  /** Read-only mode */
  readOnly?: boolean;
}

function getDepthColor(value: number | null): string {
  if (value === null) return '';
  if (value <= 3) return 'text-green-600';
  if (value <= 5) return 'text-amber-500';
  return 'text-red-600';
}

function getDepthBg(value: number | null): string {
  if (value === null) return '';
  if (value <= 3) return 'bg-green-50';
  if (value <= 5) return 'bg-amber-50';
  return 'bg-red-50';
}

export default function PerioChart({
  readings = {},
  onReadingChange,
  readOnly = false,
}: PerioChartProps) {
  const [localReadings, setLocalReadings] = useState<Record<number, PerioReading>>(readings);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const getReading = useCallback(
    (tooth: number): PerioReading => localReadings[tooth] ?? { ...EMPTY_READING },
    [localReadings]
  );

  const updateReading = useCallback(
    (tooth: number, site: PerioSite, value: number | null) => {
      setLocalReadings((prev) => {
        const current = prev[tooth] ?? { ...EMPTY_READING };
        const updated = { ...current, [site]: value };
        onReadingChange?.(tooth, updated);
        return { ...prev, [tooth]: updated };
      });
    },
    [onReadingChange]
  );

  const toggleBleeding = useCallback(
    (tooth: number, site: PerioSite) => {
      const bleedingKey = `bleeding${site}` as BleedingSite;
      setLocalReadings((prev) => {
        const current = prev[tooth] ?? { ...EMPTY_READING };
        const updated = { ...current, [bleedingKey]: !current[bleedingKey] };
        onReadingChange?.(tooth, updated);
        return { ...prev, [tooth]: updated };
      });
    },
    [onReadingChange]
  );

  /** Generate a unique key for each input to manage focus/tab */
  const getInputKey = (arch: string, tooth: number, site: PerioSite) =>
    `${arch}-${tooth}-${site}`;

  /** Advance focus to the next input in tab order */
  const advanceFocus = useCallback(
    (arch: string, teeth: number[], currentTooth: number, currentSite: PerioSite) => {
      const toothIdx = teeth.indexOf(currentTooth);
      const siteIdx = SITES.indexOf(currentSite);

      let nextToothIdx = toothIdx;
      let nextSiteIdx = siteIdx + 1;

      if (nextSiteIdx >= SITES.length) {
        nextSiteIdx = 0;
        nextToothIdx += 1;
      }

      if (nextToothIdx < teeth.length) {
        const key = getInputKey(arch, teeth[nextToothIdx], SITES[nextSiteIdx]);
        const input = inputRefs.current.get(key);
        input?.focus();
        input?.select();
      }
    },
    []
  );

  const handleInputChange = useCallback(
    (
      tooth: number,
      site: PerioSite,
      e: React.ChangeEvent<HTMLInputElement>,
      arch: string,
      teeth: number[]
    ) => {
      const raw = e.target.value.replace(/\D/g, '');
      if (raw === '') {
        updateReading(tooth, site, null);
        return;
      }
      const num = parseInt(raw, 10);
      if (num >= 1 && num <= 10) {
        updateReading(tooth, site, num);
        // Auto-advance on single digit entry
        advanceFocus(arch, teeth, tooth, site);
      }
    },
    [updateReading, advanceFocus]
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      arch: string,
      teeth: number[],
      tooth: number,
      site: PerioSite
    ) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        advanceFocus(arch, teeth, tooth, site);
      }
    },
    [advanceFocus]
  );

  /** Compute summary stats */
  const summary = useMemo(() => {
    let totalDepth = 0;
    let depthCount = 0;
    let bleedingCount = 0;
    let totalSites = 0;

    const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH];
    for (const tooth of allTeeth) {
      const r = localReadings[tooth];
      if (!r) continue;

      for (const site of SITES) {
        const val = r[site];
        if (val !== null && val !== undefined) {
          totalDepth += val;
          depthCount += 1;
        }
        const bleedingKey = `bleeding${site}` as BleedingSite;
        if (r[bleedingKey]) bleedingCount += 1;
        totalSites += 1;
      }
    }

    return {
      avgDepth: depthCount > 0 ? (totalDepth / depthCount).toFixed(1) : '--',
      bleedingPct: totalSites > 0 ? ((bleedingCount / totalSites) * 100).toFixed(0) : '--',
    };
  }, [localReadings]);

  const renderArchRow = (
    teeth: number[],
    sites: PerioSite[],
    archLabel: string,
    rowLabel: string
  ) => (
    <tr>
      <td className="sticky left-0 bg-white z-10 px-2 py-1 text-[10px] font-semibold text-slate-500 border-r border-slate-200 whitespace-nowrap">
        {rowLabel}
      </td>
      {teeth.map((tooth) => {
        const reading = getReading(tooth);
        return (
          <td key={tooth} className="border-r border-slate-100 px-0">
            <div className="flex">
              {sites.map((site) => {
                const val = reading[site];
                const bleedingKey = `bleeding${site}` as BleedingSite;
                const isBleeding = !!reading[bleedingKey];
                const inputKey = getInputKey(archLabel, tooth, site);

                return (
                  <div key={site} className="flex flex-col items-center w-5">
                    {/* Bleeding dot */}
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleBleeding(tooth, site)}
                      className={`w-2 h-2 rounded-full mb-0.5 transition-colors
                        ${isBleeding ? 'bg-red-500' : 'bg-slate-200'}
                        ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-red-300'}`}
                      aria-label={`Bleeding ${site} tooth ${tooth}`}
                      title={isBleeding ? 'Bleeding on probing' : 'No bleeding'}
                    />
                    {/* Depth input */}
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(inputKey, el);
                      }}
                      type="text"
                      inputMode="numeric"
                      readOnly={readOnly}
                      value={val ?? ''}
                      onChange={(e) => handleInputChange(tooth, site, e, archLabel, teeth)}
                      onKeyDown={(e) => handleKeyDown(e, archLabel, teeth, tooth, site)}
                      onFocus={(e) => e.target.select()}
                      className={`w-5 h-5 text-center text-[10px] font-mono border-0 p-0
                        focus:outline-none focus:ring-1 focus:ring-teal-400 rounded-sm
                        ${getDepthBg(val)} ${getDepthColor(val)}
                        ${readOnly ? 'cursor-default' : ''}`}
                      maxLength={2}
                    />
                  </div>
                );
              })}
            </div>
          </td>
        );
      })}
    </tr>
  );

  const renderArchSection = (
    teeth: number[],
    archLabel: string,
    label: string
  ) => (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
        {label}
      </h4>
      <div className="overflow-x-auto">
        <table className="border-collapse w-full min-w-[700px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 px-2 py-1 text-[10px] font-semibold text-slate-500 border-r border-slate-200 border-b border-slate-200">
                Site
              </th>
              {teeth.map((tooth) => (
                <th
                  key={tooth}
                  className="px-1 py-1 text-[10px] font-mono font-semibold text-slate-700 border-b border-slate-200 border-r border-slate-100 text-center"
                  style={{ minWidth: 60 }}
                >
                  {tooth}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderArchRow(teeth, BUCCAL_SITES, archLabel, 'Buccal (MB/B/DB)')}
            {renderArchRow(teeth, LINGUAL_SITES, archLabel, 'Lingual (ML/L/DL)')}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Periodontal Chart
          </h3>

          {/* Summary badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase">
                Avg Depth
              </span>
              <span className="text-sm font-bold font-mono text-slate-800">
                {summary.avgDepth}
                <span className="text-[10px] font-normal text-slate-400">mm</span>
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase">
                BOP
              </span>
              <span className="text-sm font-bold font-mono text-slate-800">
                {summary.bleedingPct}
                <span className="text-[10px] font-normal text-slate-400">%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Depth color key */}
        <div className="flex items-center gap-4 mb-4 text-[10px]">
          <span className="text-slate-400 font-medium">Depth:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300" />
            <span className="text-green-600 font-medium">1-3mm</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />
            <span className="text-amber-500 font-medium">4-5mm</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300" />
            <span className="text-red-600 font-medium">6+mm</span>
          </span>
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-500 font-medium">Bleeding on probing</span>
          </span>
        </div>

        {renderArchSection(UPPER_TEETH, 'upper', 'Upper Arch')}
        {renderArchSection(LOWER_TEETH, 'lower', 'Lower Arch')}
      </div>
    </div>
  );
}
