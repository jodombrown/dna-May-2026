// Collaborate mobile menu-nav row. Mirrors ConnectMobileTabs so every /dna/*
// hub renders the same second row directly under DnaMobileHeader.
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Bookmark, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

type CollaborateTab = 'hub' | 'mine' | 'discover';

const TAB_CONFIG: Array<{
  value: CollaborateTab;
  icon: typeof Users;
  label: string;
  path: string;
}> = [
  { value: 'hub', icon: Users, label: 'Spaces', path: '/dna/collaborate' },
  { value: 'mine', icon: Bookmark, label: 'My Spaces', path: '/dna/collaborate/my-spaces' },
  { value: 'discover', icon: Compass, label: 'Discover', path: '/dna/collaborate/spaces' },
];

function resolveActive(pathname: string): CollaborateTab {
  if (pathname.startsWith('/dna/collaborate/my-spaces')) return 'mine';
  if (pathname.startsWith('/dna/collaborate/spaces')) return 'discover';
  return 'hub';
}

export function CollaborateMobileTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = resolveActive(pathname);

  return (
    <div className="px-3 py-1.5 bg-background border-b border-border">
      <div
        className="flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-lg"
        role="tablist"
        aria-label="Collaborate tabs"
      >
        {TAB_CONFIG.map(({ value, icon: Icon, label, path }) => {
          const isActive = active === value;
          return (
            <button
              key={value}
              onClick={() => navigate(path)}
              role="tab"
              aria-selected={isActive}
              aria-label={`${label} tab`}
              title={label}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-md transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-background shadow-sm flex-1 px-3'
                  : 'px-3 text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')}
                aria-hidden="true"
              />
              {isActive && <span className="text-xs font-medium truncate">{label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CollaborateMobileTabs;
