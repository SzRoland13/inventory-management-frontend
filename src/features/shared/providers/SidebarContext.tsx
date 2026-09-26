'use client';

import { createContext, useContext, useState } from 'react';

interface SidebarContextProps {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextProps | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setOpen,
        toggle: () => setOpen((prev) => !prev),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used inside <SidebarProvider>');
  }
  return context;
}
