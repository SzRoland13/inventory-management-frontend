import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProductColumnVisibility = Record<string, boolean>;
export type ProductColumnOrder = string[];

interface ProductTablePreferencesState {
  hasHydrated: boolean;
  visibilityByUser: Record<string, ProductColumnVisibility>;
  columnOrderByUser: Record<string, ProductColumnOrder>;
  setHasHydrated: (hasHydrated: boolean) => void;
  setVisibility: (userId: number, visibility: ProductColumnVisibility) => void;
  setColumnOrder: (userId: number, columnOrder: ProductColumnOrder) => void;
  resetPreferences: (userId: number) => void;
}

export const useProductTablePreferencesStore =
  create<ProductTablePreferencesState>()(
    persist(
      (set) => ({
        hasHydrated: false,
        visibilityByUser: {},
        columnOrderByUser: {},
        setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        setVisibility: (userId, visibility) =>
          set((state) => ({
            visibilityByUser: {
              ...state.visibilityByUser,
              [userId]: visibility,
            },
          })),
        setColumnOrder: (userId, columnOrder) =>
          set((state) => ({
            columnOrderByUser: {
              ...state.columnOrderByUser,
              [userId]: columnOrder,
            },
          })),
        resetPreferences: (userId) =>
          set((state) => {
            const visibilityByUser = { ...state.visibilityByUser };
            const columnOrderByUser = { ...state.columnOrderByUser };
            delete visibilityByUser[userId];
            delete columnOrderByUser[userId];
            return { visibilityByUser, columnOrderByUser };
          }),
      }),
      {
        name: 'product-table-preferences',
        partialize: (state) => ({
          visibilityByUser: state.visibilityByUser,
          columnOrderByUser: state.columnOrderByUser,
        }),
        skipHydration: true,
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
  );
