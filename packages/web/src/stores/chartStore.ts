import { create } from "zustand";
import type { ToothCondition, ToothConditionEntry } from "@/types";

export type ChartEditMode = "select" | "condition" | "perio";

interface ChartState {
  // Selection
  selectedTooth: number | null;
  selectedSurfaces: string[];

  // Edit mode
  editMode: ChartEditMode;
  activeConditionType: string | null;

  // Dental chart data
  conditions: Map<number, ToothCondition>;

  // View
  showDeciduous: boolean;
  zoomLevel: number;

  // Actions
  setSelectedTooth: (toothNumber: number | null) => void;
  setSelectedSurfaces: (surfaces: string[]) => void;
  toggleSurface: (surface: string) => void;
  setEditMode: (mode: ChartEditMode) => void;
  toggleEditMode: () => void;
  setActiveConditionType: (type: string | null) => void;
  updateConditions: (conditions: ToothCondition[]) => void;
  setToothCondition: (toothNumber: number, condition: ToothCondition) => void;
  addConditionEntry: (toothNumber: number, entry: ToothConditionEntry) => void;
  removeConditionEntry: (toothNumber: number, entryIndex: number) => void;
  setShowDeciduous: (show: boolean) => void;
  setZoomLevel: (level: number) => void;
  reset: () => void;
}

const initialState = {
  selectedTooth: null,
  selectedSurfaces: [] as string[],
  editMode: "select" as ChartEditMode,
  activeConditionType: null,
  conditions: new Map<number, ToothCondition>(),
  showDeciduous: false,
  zoomLevel: 1,
};

export const useChartStore = create<ChartState>((set, get) => ({
  ...initialState,

  setSelectedTooth: (toothNumber) => {
    set({ selectedTooth: toothNumber, selectedSurfaces: [] });
  },

  setSelectedSurfaces: (surfaces) => {
    set({ selectedSurfaces: surfaces });
  },

  toggleSurface: (surface) => {
    const current = get().selectedSurfaces;
    if (current.includes(surface)) {
      set({ selectedSurfaces: current.filter((s) => s !== surface) });
    } else {
      set({ selectedSurfaces: [...current, surface] });
    }
  },

  setEditMode: (mode) => {
    set({ editMode: mode });
  },

  toggleEditMode: () => {
    set((state) => ({
      editMode: state.editMode === "select" ? "condition" : "select",
    }));
  },

  setActiveConditionType: (type) => {
    set({ activeConditionType: type });
  },

  updateConditions: (conditionsArray) => {
    const conditionsMap = new Map<number, ToothCondition>();
    conditionsArray.forEach((c) => {
      conditionsMap.set(c.toothNumber, c);
    });
    set({ conditions: conditionsMap });
  },

  setToothCondition: (toothNumber, condition) => {
    set((state) => {
      const newConditions = new Map(state.conditions);
      newConditions.set(toothNumber, condition);
      return { conditions: newConditions };
    });
  },

  addConditionEntry: (toothNumber, entry) => {
    set((state) => {
      const newConditions = new Map(state.conditions);
      const existing = newConditions.get(toothNumber);
      if (existing) {
        newConditions.set(toothNumber, {
          ...existing,
          conditions: [...existing.conditions, entry],
        });
      } else {
        newConditions.set(toothNumber, {
          id: "",
          patientId: "",
          toothNumber,
          conditions: [entry],
          status: "PRESENT",
          isDeciduous: false,
          updatedAt: new Date().toISOString(),
        });
      }
      return { conditions: newConditions };
    });
  },

  removeConditionEntry: (toothNumber, entryIndex) => {
    set((state) => {
      const newConditions = new Map(state.conditions);
      const existing = newConditions.get(toothNumber);
      if (existing) {
        newConditions.set(toothNumber, {
          ...existing,
          conditions: existing.conditions.filter((_, i) => i !== entryIndex),
        });
      }
      return { conditions: newConditions };
    });
  },

  setShowDeciduous: (show) => {
    set({ showDeciduous: show });
  },

  setZoomLevel: (level) => {
    set({ zoomLevel: Math.max(0.5, Math.min(2, level)) });
  },

  reset: () => {
    set(initialState);
  },
}));
