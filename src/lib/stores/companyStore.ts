import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanyState {
  name: string | null;
  logoUrl: string | null;
  logoUrlExpiry: number | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  setCompanyData: (data: Partial<CompanyState>) => void;
  clearCompanyData: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      name: null,
      logoUrl: null,
      logoUrlExpiry: null,
      description: null,
      email: null,
      phone: null,
      address: null,
      website: null,
      setCompanyData: (data) => set((state) => Object.assign(state, data)),
      clearCompanyData: () =>
        set(() => ({
          name: null,
          logoUrl: null,
          logoUrlExpiry: null,
          description: null,
          email: null,
          phone: null,
          address: null,
          website: null,
        })),
    }),
    {
      name: 'company-store',
    },
  ),
);
