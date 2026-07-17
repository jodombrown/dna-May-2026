/**
 * IdentitySheet — Claude-inspired identity/settings shell for DNA.
 *
 * Mobile: full-height Vaul drawer with drag handle (bottom sheet).
 * Desktop: right-side Radix Dialog panel (~440px), app dimmed behind.
 *
 * Owns close/back chrome and a lightweight subpage stack so children can push
 * deeper views without route changes. Honors prefers-reduced-motion.
 */

import * as React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface StackFrame {
  id: string;
  title: string;
  node: React.ReactNode;
}

interface IdentitySheetContextValue {
  push: (frame: StackFrame) => void;
  pop: () => void;
  close: () => void;
}

const IdentitySheetContext = React.createContext<IdentitySheetContextValue | null>(null);

export function useIdentitySheet() {
  const ctx = React.useContext(IdentitySheetContext);
  if (!ctx) throw new Error('useIdentitySheet must be used inside <IdentitySheet />');
  return ctx;
}

export interface IdentitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Root title shown when no subpage is pushed. */
  title: string;
  /** Root content. Use SettingsGroup + SettingsRow inside. */
  children: React.ReactNode;
  /** Optional header slot rendered above the first group (e.g. user identity card). */
  header?: React.ReactNode;
  /** Optional footer slot (e.g. sign out + legal). */
  footer?: React.ReactNode;
}

export function IdentitySheet({
  open,
  onOpenChange,
  title,
  children,
  header,
  footer,
}: IdentitySheetProps) {
  const isMobile = useIsMobile();
  const [stack, setStack] = React.useState<StackFrame[]>([]);

  // Reset stack when sheet closes.
  React.useEffect(() => {
    if (!open) setStack([]);
  }, [open]);

  const ctx = React.useMemo<IdentitySheetContextValue>(
    () => ({
      push: (frame) => setStack((s) => [...s, frame]),
      pop: () => setStack((s) => s.slice(0, -1)),
      close: () => onOpenChange(false),
    }),
    [onOpenChange],
  );

  const top = stack[stack.length - 1];
  const currentTitle = top?.title ?? title;
  const canGoBack = stack.length > 0;

  const body = (
    <IdentitySheetContext.Provider value={ctx}>
      <div className="flex h-full flex-col bg-background">
        {/* Header chrome */}
        <div className="relative flex items-center justify-center border-b border-border/40 px-4 py-3">
          {canGoBack ? (
            <button
              type="button"
              onClick={ctx.pop}
              className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-muted min-h-touch min-w-touch"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          <h2 className="text-title font-display">{currentTitle}</h2>
          <button
            type="button"
            onClick={ctx.close}
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-muted min-h-touch min-w-touch"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: either the root children or the top subpage */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {top ? (
            <div key={top.id} className="motion-safe:animate-fade-in">
              {top.node}
            </div>
          ) : (
            <div className="motion-safe:animate-fade-in">
              {header ? <div className="px-4 pt-4">{header}</div> : null}
              <div className="px-4 py-4">{children}</div>
              {footer ? <div className="px-4 pb-6">{footer}</div> : null}
            </div>
          )}
        </div>
      </div>
    </IdentitySheetContext.Provider>
  );

  if (isMobile) {
    return (
      <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-[1050] bg-foreground/50" />
          <DrawerPrimitive.Content
            className="fixed inset-x-0 bottom-0 z-[1051] flex h-[92vh] flex-col rounded-t-2xl border-t border-border bg-background outline-none"
            aria-describedby={undefined}
          >
            <DrawerPrimitive.Title className="sr-only">{title}</DrawerPrimitive.Title>
            {/* Vaul v0.9.3 handle workaround per project memory */}
            <div
              vaul-drawer-handle=""
              className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30"
              aria-hidden="true"
            />
            {body}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[1050] bg-foreground/40',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed right-0 top-0 z-[1051] flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            'duration-300',
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {body}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
