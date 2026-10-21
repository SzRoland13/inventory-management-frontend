import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProductColumnVisibility = Record<string, boolean>;

interface ProductTablePreferencesState {
  hasHydrated: boolean;
  visibilityByUser: Record<string, ProductColumnVisibility>;
  setHasHydrated: (hasHydrated: boolean) => void;
  setVisibility: (userId: number, visibility: ProductColumnVisibility) => void;
  resetVisibility: (userId: number) => void;
}

export const useProductTablePreferencesStore =
  create<ProductTablePreferencesState>()(
    persist(
      (set) => ({
        hasHydrated: false,
        visibilityByUser: {},
        setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        setVisibility: (userId, visibility) =>
          set((state) => ({
            visibilityByUser: {
              ...state.visibilityByUser,
              [userId]: visibility,
            },
          })),
        resetVisibility: (userId) =>
          set((state) => {
            const visibilityByUser = { ...state.visibilityByUser };
            delete visibilityByUser[userId];
            return { visibilityByUser };
          }),
      }),
      {
        name: 'product-table-preferences',
        partialize: (state) => ({ visibilityByUser: state.visibilityByUser }),
        skipHydration: true,
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
  );
