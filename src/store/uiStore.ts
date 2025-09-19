import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Map state
  mapCenter: [number, number];
  mapZoom: number;
  selectedVesselId: number | null;
  
  // Filters
  vesselStatusFilter: string | null;
  vesselTypeFilter: string | null;
  dateRange: { from: Date | null; to: Date | null };
  
  // Dashboard state
  sidebarOpen: boolean;
  activeTab: string;
  
  // Actions
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setSelectedVesselId: (id: number | null) => void;
  setVesselStatusFilter: (status: string | null) => void;
  setVesselTypeFilter: (type: string | null) => void;
  setDateRange: (range: { from: Date | null; to: Date | null }) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  resetFilters: () => void;
}

const initialState = {
  mapCenter: [35.0, 20.0] as [number, number],
  mapZoom: 5,
  selectedVesselId: null,
  vesselStatusFilter: null,
  vesselTypeFilter: null,
  dateRange: { from: null, to: null },
  sidebarOpen: true,
  activeTab: 'overview',
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      setSelectedVesselId: (id) => set({ selectedVesselId: id }),
      setVesselStatusFilter: (status) => set({ vesselStatusFilter: status }),
      setVesselTypeFilter: (type) => set({ vesselTypeFilter: type }),
      setDateRange: (range) => set({ dateRange: range }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      resetFilters: () => set({
        vesselStatusFilter: null,
        vesselTypeFilter: null,
        dateRange: { from: null, to: null },
        selectedVesselId: null,
      }),
    }),
    {
      name: 'ui-store',
    }
  )
);
