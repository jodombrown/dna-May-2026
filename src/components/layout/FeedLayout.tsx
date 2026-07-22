import { ReactNode } from 'react';

interface FeedLayoutProps {
  children: ReactNode;
}

/**
 * FeedLayout - mobile PulseDock is mounted globally in BaseLayout; do NOT
 * mount MobileBottomNav here (that produced a duplicate bottom nav).
 */
export function FeedLayout({ children }: FeedLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-bottom-nav md:pb-bottom-nav-0">
        {children}
      </main>
    </div>
  );
}
