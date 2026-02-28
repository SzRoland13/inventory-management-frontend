import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanyState {
  name: string | null;
  logoUrl: string | null;
  logoUrlExpiry: number | null;
  setCompanyData: (data: Partial<CompanyState>) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      name: null,
      logoUrl: null,
      logoUrlExpiry: null,
      setCompanyData: (data) => set((state) => Object.assign(state, data)),
    }),
    {
      name: 'company-store',
    },
  ),
);
