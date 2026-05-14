import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Archive, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMessage } from '@/contexts/MessageContext';
import {
  AVAILABILITY_LABELS,
  CURRENCY_VISUALS,
  VISIBILITY_LABELS,
} from './currencyConfig';
import type { CurrencyStance } from '@/types/contribute';

interface CurrencyStanceCardProps {
  stance: CurrencyStance;
  variant: 'editor' | 'renderer';
  onEdit?: (stance: CurrencyStance) => void;
  onArchive?: (stance: CurrencyStance) => void;
}

export function CurrencyStanceCard({
  stance,
  variant,
  onEdit,
  onArchive,
}: CurrencyStanceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { openMessageOverlay } = useMessage();
  const visual = CURRENCY_VISUALS[stance.currency];
  const Icon = visual.icon;

  const handleReachOut = () => {
    openMessageOverlay({
      recipientId: stance.userId,
      originType: 'profile',
      originId: stance.id,
      originMetadata: {
        title: stance.title,
        preview: `Re: ${stance.title}`,
      },
    });
  };

  return (
    <article
      className="relative bg-card border rounded-lg overflow-hidden"
      style={{ borderLeft: `4px solid ${visual.barHex}` }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-4 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        aria-expanded={expanded}
        aria-controls={`stance-body-${stance.id}`}
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
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <h3 className="text-base md:text-lg font-medium leading-snug">{stance.title}</h3>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted">
            {AVAILABILITY_LABELS[stance.availability].short}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted">
            {VISIBILITY_LABELS[stance.visibility].short}
          </span>
        </div>
      </button>

      {expanded && (
        <div id={`stance-body-${stance.id}`} className="px-4 pb-4 pt-1 space-y-3 border-t">
          {stance.description && (
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {stance.description}
            </p>
          )}

          {stance.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {stance.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {variant === 'editor' && (
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => onEdit?.(stance)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 text-muted-foreground"
                onClick={() => onArchive?.(stance)}
              >
                <Archive className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Archive
              </Button>
            </div>
          )}

          {variant === 'renderer' && (
            <div className="pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={handleReachOut}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Reach out about this stance
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
