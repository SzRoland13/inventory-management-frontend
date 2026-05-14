import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanyState {
  id: number | null;
  name: string | null;
  logoId: number | null;
  logoUrl: string | null;
  logoUrlExpiry: string | null;
  setCompanyData: (data: Partial<CompanyState>) => void;
  clearCompanyData: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      id: null,
      name: null,
      logoId: null,
      logoUrl: null,
      logoUrlExpiry: null,
      setCompanyData: (data) => set((state) => Object.assign(state, data)),
      clearCompanyData: () =>
        set(() => ({
          id: null,
          name: null,
          logoId: null,
          logoUrl: null,
          logoUrlExpiry: null,
        })),
    }),
    {
      name: 'company-store',
    },
  ),
);
