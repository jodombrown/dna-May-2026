import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * IdentitySheet
 * A Claude-style, right-anchored panel that supports internal subpage
 * navigation. Non-modal on desktop (feed remains interactive, no scroll-lock),
 * modal-with-backdrop on mobile. Escape closes the top of the stack, or the
 * whole sheet if only the root is present.
 */

interface SubpageEntry {
  key: string;
  title: string;
  node: React.ReactNode;
}

interface IdentitySheetContextValue {
  push: (entry: SubpageEntry) => void;
  pop: () => void;
  close: () => void;
  replaceStack: (entries: SubpageEntry[]) => void;
}

const IdentitySheetContext = createContext<IdentitySheetContextValue | null>(null);

export function useIdentitySheet() {
  const ctx = useContext(IdentitySheetContext);
  if (!ctx) throw new Error('useIdentitySheet must be used within IdentitySheet');
  return ctx;
}

export interface IdentitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rootTitle: string;
  children: React.ReactNode;
}

export function IdentitySheet({ open, onOpenChange, rootTitle, children }: IdentitySheetProps) {
  const [stack, setStack] = useState<SubpageEntry[]>([]);

  useEffect(() => {
    if (!open) setStack([]);
  }, [open]);

  const push = useCallback((entry: SubpageEntry) => setStack((s) => [...s, entry]), []);
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const replaceStack = useCallback((entries: SubpageEntry[]) => setStack(entries), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stack.length > 0) pop();
        else close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stack.length, pop, close]);

  const ctx = useMemo(() => ({ push, pop, close, replaceStack }), [push, pop, close, replaceStack]);

  if (!open) return null;

  const top = stack[stack.length - 1];
  const title = top?.title ?? rootTitle;
  const canGoBack = stack.length > 0;

  return (
    <IdentitySheetContext.Provider value={ctx}>
      {/* Mobile backdrop only (desktop keeps feed interactive) */}
      <div
        className="fixed inset-0 z-40 bg-black/30 md:hidden"
        onClick={close}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="false"
        aria-label={title}
        className={cn(
          'fixed right-0 top-0 z-50 h-[100dvh] w-full sm:max-w-md',
          'bg-background border-l border-border shadow-xl',
          'flex flex-col animate-in slide-in-from-right duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          {canGoBack ? (
            <button
              type="button"
              onClick={pop}
              className="p-2 -ml-2 rounded-md hover:bg-muted"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-8" />
          )}
          <h2 className="flex-1 text-base font-semibold truncate">{title}</h2>
          <button
            type="button"
            onClick={close}
            className="p-2 -mr-2 rounded-md hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: root or top of stack */}
        <div className="flex-1 overflow-y-auto">
          {canGoBack ? top.node : children}
        </div>
      </aside>
    </IdentitySheetContext.Provider>
  );
}

/* ------------------------------ Primitives ------------------------------ */

export function SettingsGroup({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 pt-6', className)}>
      {label && (
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase px-2 pb-2">
          {label}
        </div>
      )}
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export interface SettingsRowProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  right?: React.ReactNode;
}

export function SettingsRow({
  icon: Icon,
  label,
  hint,
  onClick,
  chevron = true,
  destructive,
  right,
}: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'hover:bg-muted/60 focus:outline-none focus-visible:bg-muted/80',
        destructive && 'text-destructive',
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            destructive ? 'text-destructive' : 'text-muted-foreground',
          )}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {hint && <div className="text-xs text-muted-foreground truncate">{hint}</div>}
      </div>
      {right}
      {chevron && !right && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}
