/**
 * DocumentChip - Tappable document attachment with type-specific icon and badge.
 */

import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/groupMessaging';

interface DocumentChipProps {
  doc: MediaItem;
  isOwn: boolean;
  /** When false, the chip becomes non-interactive and the download icon is hidden. */
  canDownload?: boolean;
}

type DocStyle = {
  Icon: typeof FileText;
  /** Tailwind class controlling icon color (uses semantic tokens where possible). */
  iconClass: string;
  /** Tailwind class for the icon background swatch */
  swatchClass: string;
  badge: string;
};

function getDocStyle(doc: MediaItem): DocStyle {
  const ext = (doc.name.split('.').pop() || '').toLowerCase();
  const mime = doc.mimeType || '';

  if (mime.includes('pdf') || ext === 'pdf') {
    return { Icon: FileText, iconClass: 'text-destructive', swatchClass: 'bg-destructive/10', badge: 'PDF' };
  }
  if (mime.includes('sheet') || mime.includes('excel') || ext === 'xls' || ext === 'xlsx') {
    return { Icon: FileSpreadsheet, iconClass: 'text-dna-success', swatchClass: 'bg-dna-success/10', badge: 'XLS' };
  }
  if (ext === 'csv' || mime === 'text/csv') {
    return { Icon: FileSpreadsheet, iconClass: 'text-dna-success', swatchClass: 'bg-dna-success/10', badge: 'CSV' };
  }
  if (mime.includes('presentation') || ext === 'ppt' || ext === 'pptx') {
    return { Icon: FileText, iconClass: 'text-dna-warning', swatchClass: 'bg-dna-warning/10', badge: 'PPT' };
  }
  if (mime.includes('word') || ext === 'doc' || ext === 'docx') {
    return { Icon: FileText, iconClass: 'text-primary', swatchClass: 'bg-primary/10', badge: 'DOC' };
  }
  if (mime.includes('zip') || ext === 'zip') {
    return { Icon: FileArchive, iconClass: 'text-muted-foreground', swatchClass: 'bg-muted', badge: 'ZIP' };
  }
  if (ext === 'txt' || ext === 'md' || mime.startsWith('text/')) {
    return {
      Icon: FileText,
      iconClass: 'text-muted-foreground',
      swatchClass: 'bg-muted',
      badge: ext.toUpperCase() || 'TXT',
    };
  }
  return {
    Icon: FileIcon,
    iconClass: 'text-muted-foreground',
    swatchClass: 'bg-muted',
    badge: ext ? ext.toUpperCase() : 'FILE',
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateName(name: string, max = 28): string {
  if (name.length <= max) return name;
  const ext = name.split('.').pop() || '';
  const base = name.slice(0, Math.max(0, max - ext.length - 4));
  return `${base}...${ext}`;
}

export function DocumentChip({ doc, isOwn, canDownload = true }: DocumentChipProps) {
  const { Icon, iconClass, swatchClass, badge } = getDocStyle(doc);

  const innerContent = (
    <>
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          isOwn ? 'bg-primary-foreground/20' : swatchClass,
        )}
      >
        <Icon className={cn('h-5 w-5', isOwn ? 'text-primary-foreground' : iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            isOwn ? 'text-primary-foreground' : 'text-foreground',
          )}
        >
          {truncateName(doc.name)}
        </p>
        <p
          className={cn(
            'flex items-center gap-1.5 text-xs',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'rounded px-1 py-px text-[10px] font-semibold',
              isOwn ? 'bg-primary-foreground/20' : 'bg-background/80',
            )}
          >
            {badge}
          </span>
          <span>{formatSize(doc.size)}</span>
          {!canDownload && (
            <span className="text-[10px] italic text-muted-foreground">read-only</span>
          )}
        </p>
      </div>
      {canDownload && (
        <Download
          className={cn(
            'h-4 w-4 flex-shrink-0',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        />
      )}
    </>
  );

  const baseClass = cn(
    'mt-1 flex min-w-[200px] items-center gap-3 rounded-lg p-3 transition-colors',
    isOwn
      ? 'bg-primary-foreground/10'
      : 'bg-muted',
    canDownload && (isOwn ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted/80'),
  );

  if (!canDownload) {
    return (
      <div
        className={cn(baseClass, 'cursor-not-allowed opacity-80')}
        aria-label={`${doc.name} (download not permitted)`}
        title="You don't have permission to download this file"
        onContextMenu={(e) => e.preventDefault()}
      >
        {innerContent}
      </div>
    );
  }

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      download={doc.name}
      className={baseClass}
    >
      {innerContent}
    </a>
  );
}
