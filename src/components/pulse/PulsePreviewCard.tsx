/**
 * PulsePreviewCard - Hover Preview for Pulse Items
 *
 * Shows a compact preview card with top 3 items when hovering
 * over a Pulse Bar item.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PulseItem } from '@/types/pulse';

interface PulsePreviewCardProps {
  label: string;
  items: PulseItem[];
  href: string;
}

export function PulsePreviewCard({ label, items, href }: PulsePreviewCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-50 w-64">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200">
          <span className="text-xs font-semibold text-neutral-600 tracking-wide">
            {label}
          </span>
        </div>

        {/* Items */}
        <div className="divide-y divide-neutral-100">
          {items.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              to={item.action_url}
              className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 transition-colors"
            >
              {item.avatar_url ? (
                <img
                  src={item.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-dna-emerald/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-dna-emerald">
                    {item.title?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-neutral-500 truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <Link
          to={href}
          className={cn(
            'flex items-center justify-between px-3 py-2',
            'bg-neutral-50 border-t border-neutral-200',
            'hover:bg-neutral-100 transition-colors group'
          )}
        >
          <span className="text-xs font-medium text-dna-emerald">
            View All
          </span>
          <ChevronRight className="w-3 h-3 text-dna-emerald group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default PulsePreviewCard;
