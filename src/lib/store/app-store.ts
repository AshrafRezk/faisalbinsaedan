import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UnitFilters } from "../types";

interface AppState {
  // PWA Install
  installPromptEvent: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  showInstallBanner: boolean;
  setInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;
  setShowInstallBanner: (show: boolean) => void;
  dismissInstallBanner: () => void;

  // Search Filters
  filters: UnitFilters;
  setFilters: (filters: UnitFilters | ((prev: UnitFilters) => UnitFilters)) => void;
  clearFilters: () => void;

  // UI State
  isFilterDrawerOpen: boolean;
  setFilterDrawerOpen: (open: boolean) => void;

  // Maintenance Gate
  isMaintenanceAuthorized: boolean;
  authorizeMaintenance: (password: string) => boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const MAINTENANCE_PASSWORD = "binsaedan2025";

/** Default unit search filters — Support Available = Yes */
export const DEFAULT_UNIT_FILTERS: UnitFilters = {
  eligibleForSubsidies: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // PWA Install
      installPromptEvent: null,
      isInstallable: false,
      showInstallBanner: true,
      setInstallPrompt: (event) =>
        set({ installPromptEvent: event, isInstallable: event !== null }),
      setShowInstallBanner: (show) => set({ showInstallBanner: show }),
      dismissInstallBanner: () => set({ showInstallBanner: false }),

      // Search Filters
      filters: { ...DEFAULT_UNIT_FILTERS },
      setFilters: (filtersOrUpdater) =>
        set((state) => ({
          filters:
            typeof filtersOrUpdater === 'function'
              ? filtersOrUpdater(state.filters)
              : filtersOrUpdater,
        })),
      clearFilters: () => set({ filters: { ...DEFAULT_UNIT_FILTERS } }),

      // UI State
      isFilterDrawerOpen: false,
      setFilterDrawerOpen: (open) => set({ isFilterDrawerOpen: open }),

      // Maintenance Gate
      isMaintenanceAuthorized: false,
      authorizeMaintenance: (password) => {
        if (password === MAINTENANCE_PASSWORD) {
          set({ isMaintenanceAuthorized: true });
          return true;
        }
        return false;
      },
    }),
    {
      name: "binsaedan-app-storage",
      partialize: (state) => ({ 
        isMaintenanceAuthorized: state.isMaintenanceAuthorized,
        showInstallBanner: state.showInstallBanner 
      }),
    }
  )
);

