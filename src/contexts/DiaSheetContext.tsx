/**
 * DiaSheetContext — global open state for the DIA right-side sheet.
 * Any surface can call `openWith(prompt?)` to open the sheet and (optionally)
 * auto-submit a seeded prompt inside it.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface DiaSheetState {
  open: boolean;
  seedPrompt: string;
  seedNonce: number;
}

interface DiaSheetContextValue extends DiaSheetState {
  openWith: (prompt?: string) => void;
  close: () => void;
  setOpen: (open: boolean) => void;
}

const DiaSheetContext = createContext<DiaSheetContextValue | null>(null);

export const DiaSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DiaSheetState>({
    open: false,
    seedPrompt: '',
    seedNonce: 0,
  });

  const openWith = useCallback((prompt?: string) => {
    setState({
      open: true,
      seedPrompt: prompt ?? '',
      seedNonce: prompt ? Date.now() : 0,
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setState((s) => ({ ...s, open }));
  }, []);

  const value = useMemo<DiaSheetContextValue>(
    () => ({ ...state, openWith, close, setOpen }),
    [state, openWith, close, setOpen],
  );

  return <DiaSheetContext.Provider value={value}>{children}</DiaSheetContext.Provider>;
};

export function useDiaSheet(): DiaSheetContextValue {
  const ctx = useContext(DiaSheetContext);
  if (!ctx) throw new Error('useDiaSheet must be used inside <DiaSheetProvider>');
  return ctx;
}
