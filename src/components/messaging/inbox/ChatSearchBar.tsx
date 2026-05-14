import React, { useEffect, useMemo, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X, Calendar as CalendarIcon, CornerUpLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange, DateRangePreset } from '@/hooks/messaging/useChatSearch';

interface ChatSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  matches: string[];
  activeIndex: number;
  onActiveIndexChange: (idx: number) => void;
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  onReplyToActive?: () => void;
  onResetAll?: () => void;
  onClose: () => void;
}

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'custom', label: 'Custom range' },
];

const presetLabel = (r: DateRange): string => {
  if (r.preset === 'all') return 'Any date';
  if (r.preset === 'today') return 'Today';
  if (r.preset === 'week') return 'This week';
  if (r.preset === 'custom') {
    if (r.from && r.to) return `${r.from} - ${r.to}`;
    if (r.from) return `From ${r.from}`;
    if (r.to) return `Until ${r.to}`;
    return 'Custom';
  }
  return 'Any date';
};

/**
 * Phase 8 + 9 - in-thread search overlay.
 * Adds a date-range filter (today / this week / custom) and a Reply action
 * that hands the active match back to the thread for in-context reply.
 */
export const ChatSearchBar: React.FC<ChatSearchBarProps> = ({
  query,
  onQueryChange,
  matches,
  activeIndex,
  onActiveIndexChange,
  range,
  onRangeChange,
  onReplyToActive,
  onResetAll,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = matches.length;
  const hasMatches = total > 0;
  const hasFilter = !!query.trim() || range.preset !== 'all';
  const display = useMemo(
    () => (hasMatches ? `${activeIndex + 1} of ${total}` : hasFilter ? 'No results' : ''),
    [activeIndex, total, hasMatches, hasFilter],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const goPrev = () => {
    if (!hasMatches) return;
    onActiveIndexChange((activeIndex - 1 + total) % total);
  };
  const goNext = () => {
    if (!hasMatches) return;
    onActiveIndexChange((activeIndex + 1) % total);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Phase 11: Enter jumps to the active match and opens the reply composer.
      // Shift+Enter still navigates back (existing shortcut preserved).
      if (e.shiftKey) goPrev();
      else if (hasMatches && onReplyToActive) onReplyToActive();
      else goNext();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search in conversation (↑↓ navigate, Enter reply)"
          className="flex-1 bg-transparent text-[14px] leading-[1.25] outline-none placeholder:text-muted-foreground"
          aria-label="Search in conversation"
        />
        {hasFilter && (
          <span className={cn('text-[12px] flex-shrink-0', hasMatches ? 'text-muted-foreground' : 'text-destructive')}>
            {display}
          </span>
        )}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {hasMatches && onReplyToActive && (
            <button
              onClick={onReplyToActive}
              aria-label="Reply to selected match"
              title="Reply to this message"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <CornerUpLeft className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={goPrev}
            disabled={!hasMatches}
            aria-label="Previous match"
            className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={goNext}
            disabled={!hasMatches}
            aria-label="Next match"
            className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date filter row */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 h-7 text-[12px]',
                range.preset !== 'all'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
              aria-label="Filter by date"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{presetLabel(range)}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="flex flex-col gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.id === 'custom') {
                      onRangeChange({ preset: 'custom', from: range.from, to: range.to });
                    } else {
                      onRangeChange({ preset: p.id });
                    }
                  }}
                  className={cn(
                    'text-left px-2 py-1.5 rounded text-[13px]',
                    range.preset === p.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                >
                  {p.label}
                </button>
              ))}
              {range.preset === 'custom' && (
                <div className="mt-2 pt-2 border-t border-border space-y-1.5">
                  <div>
                    <label className="block text-[11px] text-muted-foreground">From</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="date"
                        value={range.from ?? ''}
                        onChange={(e) => onRangeChange({ ...range, preset: 'custom', from: e.target.value || undefined })}
                        className="flex-1 bg-background border border-border rounded px-2 h-8 text-[13px]"
                      />
                      {range.from && (
                        <button
                          onClick={() => onRangeChange({ ...range, preset: 'custom', from: undefined })}
                          aria-label="Reset From date"
                          className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground">To</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="date"
                        value={range.to ?? ''}
                        onChange={(e) => onRangeChange({ ...range, preset: 'custom', to: e.target.value || undefined })}
                        className="flex-1 bg-background border border-border rounded px-2 h-8 text-[13px]"
                      />
                      {range.to && (
                        <button
                          onClick={() => onRangeChange({ ...range, preset: 'custom', to: undefined })}
                          aria-label="Reset To date"
                          className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {range.preset !== 'all' && (
          <button
            onClick={() => onRangeChange({ preset: 'all' })}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Clear date
          </button>
        )}

        {(query.trim() || range.preset !== 'all') && onResetAll && (
          <button
            onClick={onResetAll}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 h-7 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/60"
            aria-label="Clear search and date filter"
            title="Clear search and date filter"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};
