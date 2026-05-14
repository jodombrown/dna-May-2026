import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Archive, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMessage } from '@/contexts/MessageContext';
import { CURRENCY_VISUALS, VISIBILITY_LABELS } from '../manifest/currencyConfig';
import { NEED_SCOPE_LABELS, NEED_STATUS_LABELS } from './needsConfig';
import type { NeedDeclaration } from '@/types/contribute';

interface NeedCardProps {
  need: NeedDeclaration;
  variant: 'editor' | 'renderer';
  onEdit?: (need: NeedDeclaration) => void;
  onPublish?: (need: NeedDeclaration) => void;
  onClose?: (need: NeedDeclaration) => void;
  onDelete?: (need: NeedDeclaration) => void;
}

const STATUS_TONE_CLASS: Record<string, string> = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  progress: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-stone-100 text-stone-600 border-stone-200',
  idle: 'bg-stone-50 text-stone-500 border-stone-200',
  closed: 'bg-stone-50 text-stone-400 border-stone-200',
};

export function NeedCard({
  need,
  variant,
  onEdit,
  onPublish,
  onClose,
  onDelete,
}: NeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { openMessageOverlay } = useMessage();
  const visual = CURRENCY_VISUALS[need.currency];
  const Icon = visual.icon;
  const status = NEED_STATUS_LABELS[need.status];
  const scope = NEED_SCOPE_LABELS[need.scope];
  const isClosed = need.status === 'closed' || need.status === 'expired';

  const handleReachOut = () => {
    openMessageOverlay({
      recipientId: need.userId,
      originType: 'profile',
      originId: need.id,
      originMetadata: {
        title: need.title,
        preview: `Re: ${need.title}`,
      },
    });
  };

  return (
    <article
      className="relative bg-card border rounded-lg overflow-hidden"
      style={{
        borderLeft: `4px solid ${visual.barHex}`,
        opacity: isClosed ? 0.7 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-4 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        aria-expanded={expanded}
        aria-controls={`need-body-${need.id}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: visual.barHex }} aria-hidden="true" />
            <span
              className="text-xs uppercase tracking-wide font-medium"
              style={{ color: visual.labelHex }}
            >
              {visual.label}
            </span>
            <span className="text-xs text-muted-foreground">seeking</span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <h3 className="text-base md:text-lg font-medium leading-snug">{need.title}</h3>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md border ${STATUS_TONE_CLASS[status.tone]}`}>
            {status.short}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {scope.short}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {VISIBILITY_LABELS[need.visibility].short}
          </span>
        </div>
      </button>

      {expanded && (
        <div id={`need-body-${need.id}`} className="px-4 pb-4 pt-1 space-y-3 border-t">
          {need.context && (
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {need.context}
            </p>
          )}

          {need.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {need.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {need.expiresAt && need.status === 'open' && (
            <p className="text-xs text-muted-foreground">
              Open until {new Date(need.expiresAt).toLocaleDateString()}
            </p>
          )}

          {variant === 'editor' && (
            <div className="flex flex-wrap gap-2 pt-2">
              {need.status === 'draft' && (
                <Button
                  type="button"
                  size="sm"
                  className="h-9"
                  style={{ background: visual.barHex, color: 'white' }}
                  onClick={() => onPublish?.(need)}
                >
                  Publish
                </Button>
              )}
              {!isClosed && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9"
                  onClick={() => onEdit?.(need)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Edit
                </Button>
              )}
              {(need.status === 'open' || need.status === 'matched') && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 text-muted-foreground"
                  onClick={() => onClose?.(need)}
                >
                  <Archive className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Close
                </Button>
              )}
              {need.status === 'draft' && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 text-muted-foreground"
                  onClick={() => onDelete?.(need)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Delete
                </Button>
              )}
            </div>
          )}

          {variant === 'renderer' && need.status === 'open' && (
            <div className="pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={handleReachOut}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Reach out about this Need
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
