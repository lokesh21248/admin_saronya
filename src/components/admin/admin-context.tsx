'use client';

import React, { createContext, useContext, useState } from 'react';

interface AdminUIContextType {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
}

const AdminUIContext = createContext<AdminUIContextType>({
  mobileNavOpen: false,
  setMobileNavOpen: () => {},
  toggleMobileNav: () => {},
});

export function AdminUIProvider({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminUIContext.Provider
      value={{
        mobileNavOpen,
        setMobileNavOpen,
        toggleMobileNav: () => setMobileNavOpen((prev) => !prev),
      }}
    >
      {children}
    </AdminUIContext.Provider>
  );
}

export function useAdminUI() {
  return useContext(AdminUIContext);
}
