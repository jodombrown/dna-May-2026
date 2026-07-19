/**
 * AccountDrawerContext — now a thin shim over the drawer shell (DR1 step 6).
 *
 * This used to own its own `isOpen` boolean while `<AccountDrawer />` rendered
 * at `BaseLayout` scope, which is DR0 defect 7: four layouts mounted no drawer
 * at all, so any route outside `BaseLayout` could call `open()` and set state
 * with nothing rendering it.
 *
 * The state lives in the URL now (`?drawer=account`), so this is kept only so
 * that the ~dozen existing `useAccountDrawer()` call sites keep working
 * unchanged. `isOpen` is DERIVED from the shell rather than mirrored into it —
 * mirroring is what produced the composer race at step 5.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useDrawerSafe } from '@/contexts/DrawerContext';
import { ACCOUNT_SURFACE_ID } from '@/components/drawer/surfaces/AccountSurface';

interface AccountDrawerContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const AccountDrawerContext = createContext<AccountDrawerContextType | undefined>(undefined);

export const AccountDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const drawer = useDrawerSafe();
  const isOpen = drawer?.stack.some((s) => s.surfaceId === ACCOUNT_SURFACE_ID) ?? false;

  const value = useMemo<AccountDrawerContextType>(
    () => ({
      isOpen,
      open: () => drawer?.openSurface(ACCOUNT_SURFACE_ID),
      close: () => drawer?.close(),
      toggle: () => (isOpen ? drawer?.close() : drawer?.openSurface(ACCOUNT_SURFACE_ID)),
    }),
    [drawer, isOpen],
  );

  return (
    <AccountDrawerContext.Provider value={value}>{children}</AccountDrawerContext.Provider>
  );
};

export const useAccountDrawer = () => {
  const context = useContext(AccountDrawerContext);
  if (!context) {
    throw new Error('useAccountDrawer must be used within AccountDrawerProvider');
  }
  return context;
};
