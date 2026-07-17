/**
 * SettingsGroup — rounded grouped-list container (Claude-inspired).
 * Renders an optional uppercase label above a rounded card whose children
 * (typically <SettingsRow />) are separated by hairline dividers.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

interface SettingsGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsGroup({ label, children, className }: SettingsGroupProps) {
  return (
    <section className={cn('mb-6', className)}>
      {label ? (
        <h3 className="mb-2 px-1 text-micro uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-card [&>*+*]:border-t [&>*+*]:border-border/40">
        {children}
      </div>
    </section>
  );
}
