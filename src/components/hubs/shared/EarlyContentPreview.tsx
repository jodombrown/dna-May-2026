// src/components/hubs/shared/EarlyContentPreview.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface PreviewItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  image?: string | null;
  href: string;
}

interface EarlyContentPreviewProps {
  items: PreviewItem[];
  hub: 'convene' | 'collaborate' | 'contribute' | 'convey';
}

export function EarlyContentPreview({ items, hub }: EarlyContentPreviewProps) {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Be among the first to explore
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="block bg-card rounded-lg border border-border overflow-hidden hover:border-dna-emerald transition-colors"
          >
            {item.image && (
              <div className="aspect-video bg-muted">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <h4 className="font-medium text-sm text-foreground line-clamp-2">
                {item.title}
              </h4>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
              )}
              {item.date && (
                <p className="text-xs text-dna-emerald mt-1">
                  {format(new Date(item.date), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EarlyContentPreview;
