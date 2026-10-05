import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Provider, Practice } from "@/types";

interface AuthState {
  token: string | null;
  provider: Provider | null;
  practice: Practice | null;
  isAuthenticated: boolean;
}

interface SidebarState {
  isCollapsed: boolean;
}

interface AppState extends AuthState, SidebarState {
  // Auth actions
  login: (token: string, provider: Provider, practice: Practice) => void;
  logout: () => void;
  updateProvider: (provider: Partial<Provider>) => void;
  updatePractice: (practice: Partial<Practice>) => void;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      token: null,
      provider: null,
      practice: null,
      isAuthenticated: false,

      // Sidebar state
      isCollapsed: false,

      // Auth actions
      login: (token: string, provider: Provider, practice: Practice) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("oradent_token", token);
        }
        set({
          token,
          provider,
          practice,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("oradent_token");
        }
        set({
          token: null,
          provider: null,
          practice: null,
          isAuthenticated: false,
        });
      },

      updateProvider: (updates: Partial<Provider>) => {
        const current = get().provider;
        if (current) {
          set({ provider: { ...current, ...updates } });
        }
      },

      updatePractice: (updates: Partial<Practice>) => {
        const current = get().practice;
        if (current) {
          set({ practice: { ...current, ...updates } });
        }
      },

      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({ isCollapsed: !state.isCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ isCollapsed: collapsed });
      },
    }),
    {
      name: "oradent-app-store",
      partialize: (state) => ({
        token: state.token,
        provider: state.provider,
        practice: state.practice,
        isAuthenticated: state.isAuthenticated,
        isCollapsed: state.isCollapsed,
      }),
    }
  )
);
