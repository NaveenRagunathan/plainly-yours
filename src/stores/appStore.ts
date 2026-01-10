import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PricingTier } from '@/types';

interface AppState {
  // Auth (Synced with Supabase)
  user: User | null;
  isAuthenticated: boolean;
  selectedPlan: PricingTier['id'] | null;

  // UI State
  sidebarOpen: boolean;

  // Actions - Auth
  setUser: (user: User | null) => void;
  setSelectedPlan: (plan: PricingTier['id'] | null) => void;
  logout: () => void;

  // Actions - UI
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      selectedPlan: null,
      sidebarOpen: false,

      // Auth actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      logout: () => set({ user: null, isAuthenticated: false, selectedPlan: null }),

      // UI actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'plainly-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedPlan: state.selectedPlan,
      }),
    }
  )
);
