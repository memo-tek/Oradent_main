'use client';

import React, { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { X, Plus, Save } from 'lucide-react';
import { TOOTH_MAP } from '@/lib/toothMap';
import { getConditionColor, getConditionLabel } from '@/lib/conditionColors';
import SurfaceSelector from './SurfaceSelector';
import ConditionPalette from './ConditionPalette';
import type { ToothCondition } from './ToothSVG';

export interface ToothPopoverProps {
  toothNumber: number;
  conditions: ToothCondition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (toothNumber: number, conditions: ToothCondition[], notes: string) => void;
  notes?: string;
  children: React.ReactNode;
}

export default function ToothPopover({
  toothNumber,
  conditions: initialConditions,
  open,
  onOpenChange,
  onSave,
  notes: initialNotes = '',
  children,
}: ToothPopoverProps) {
  const tooth = TOOTH_MAP[toothNumber];
  const [conditions, setConditions] = useState<ToothCondition[]>(initialConditions);
  const [notes, setNotes] = useState(initialNotes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);

  // Reset state when popover opens
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setConditions(initialConditions);
        setNotes(initialNotes);
        setShowAddForm(false);
        setSelectedCondition(null);
        setSelectedSurfaces([]);
      }
      onOpenChange(isOpen);
    },
    [initialConditions, initialNotes, onOpenChange]
  );

  const handleRemoveCondition = useCallback((index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleToggleSurface = useCallback((surface: string) => {
    setSelectedSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface]
    );
  }, []);

  const handleAddCondition = useCallback(() => {
    if (!selectedCondition || selectedSurfaces.length === 0) return;

    const newConditions: ToothCondition[] = selectedSurfaces.map((surface) => ({
      surface,
      condition: selectedCondition,
    }));

    setConditions((prev) => {
      // Remove existing conditions for these surfaces, then add new
      const filtered = prev.filter(
        (c) => !selectedSurfaces.includes(c.surface)
      );
      return [...filtered, ...newConditions];
    });

    setSelectedCondition(null);
    setSelectedSurfaces([]);
    setShowAddForm(false);
  }, [selectedCondition, selectedSurfaces]);

  const handleSave = useCallback(() => {
    onSave(toothNumber, conditions, notes);
    onOpenChange(false);
  }, [toothNumber, conditions, notes, onSave, onOpenChange]);

  if (!tooth) return <>{children}</>;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
          sideOffset={8}
          align="center"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              #{toothNumber} &mdash; {tooth.name}
            </h3>
            <Popover.Close asChild>
              <button
                className="rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Popover.Close>
          </div>

          {/* Current conditions */}
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-500 mb-1.5">
              Current Conditions
            </p>
            {conditions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No conditions recorded
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span
                    key={`${c.surface}-${c.condition}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                    style={{ backgroundColor: getConditionColor(c.condition) }}
                  >
                    {c.surface}: {getConditionLabel(c.condition)}
                    <button
                      onClick={() => handleRemoveCondition(i)}
                      className="ml-0.5 rounded-full hover:bg-white/20 p-0.5"
                      aria-label={`Remove ${c.condition} from ${c.surface}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add condition form */}
          {showAddForm ? (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-500">
                Select Condition
              </p>
              <ConditionPalette
                selectedCondition={selectedCondition}
                onSelect={setSelectedCondition}
              />

              <p className="text-xs font-medium text-slate-500 mt-2">
                Select Surfaces
              </p>
              <div className="flex justify-center">
                <SurfaceSelector
                  toothNumber={toothNumber}
                  selectedSurfaces={selectedSurfaces}
                  onToggle={handleToggleSurface}
                  size={90}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddCondition}
                  disabled={!selectedCondition || selectedSurfaces.length === 0}
                  className="flex-1 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white
                    hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600
                    hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 rounded-md border border-dashed border-slate-300
                px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-teal-400 hover:text-teal-600
                transition-colors w-full justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Condition
            </button>
          )}

          {/* Notes */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical notes for this tooth..."
              rows={2}
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30
                focus:border-teal-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5
                text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <Popover.Close asChild>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600
                  hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </Popover.Close>
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
