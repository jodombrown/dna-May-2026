import { useEffect, useRef, useState } from 'react';
import { Sparkle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/composer/fields/FieldError';
import {
  HEADLINE_HARD_MAX,
  HEADLINE_SOFT_MIN,
} from '@/types/contribute';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import { useDebouncedCallback } from '@/hooks/contribute/useManifest';

interface HeadlineEditorProps {
  manifestId: string;
  initialValue: string | null;
  onSave: (value: string) => void;
}

/**
 * Ceremonial single-sentence declaration that opens the Manifest.
 * Forest left border, generous padding, autosaved 600ms after the last edit.
 */
export function HeadlineEditor({ manifestId, initialValue, onSave }: HeadlineEditorProps) {
  const [value, setValue] = useState(initialValue ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastSaved = useRef(initialValue ?? '');

  // Sync only when the manifest identity changes (loading a different
  // manifest or first creation). Refetches after autosave would otherwise
  // clobber in-flight keystrokes mid-typing.
  useEffect(() => {
    setValue(initialValue ?? '');
    lastSaved.current = initialValue ?? '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifestId]);

  const scheduleSave = useDebouncedCallback((next: string) => {
    if (next === lastSaved.current) return;
    if (next.length > HEADLINE_HARD_MAX) return;
    lastSaved.current = next;
    onSave(next);
  });

  const handleChange = (next: string) => {
    setValue(next);
    if (next.length > HEADLINE_HARD_MAX) {
      setErrors({ headline: `Keep it under ${HEADLINE_HARD_MAX} characters.` });
      return;
    }
    setErrors({});
    scheduleSave(next);
  };

  const handleDiaDraft = () => {
    // Phase 1 mock: surface 3 prompts the user can pick from. Real DIA
    // wiring lands when the dia-headline-draft edge function ships.
    const drafts = [
      'I show up for the diaspora as a steady connector, advisor, and host.',
      'I show up for the diaspora by opening doors, sharing what I know, and lending what I have.',
      'I show up for the diaspora as a quiet builder of trust across the Atlantic.',
    ];
    const pick = drafts[Math.floor(Math.random() * drafts.length)];
    setValue(pick);
    scheduleSave(pick);
    trackContributeEvent({ type: 'manifest_headline_drafted_by_dia', accepted: true });
  };

  const charCount = value.length;
  const tooShort = charCount > 0 && charCount < HEADLINE_SOFT_MIN;

  return (
    <section
      className="relative pl-5 py-5 pr-4 bg-card rounded-lg border"
      style={{ borderLeft: '4px solid #2D6A4F' }}
      aria-labelledby="manifest-headline-label"
    >
      <div className="flex items-baseline justify-between mb-2">
        <label
          id="manifest-headline-label"
          htmlFor="manifest-headline"
          className="text-xs uppercase tracking-wide text-muted-foreground"
        >
          Your headline
        </label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleDiaDraft}
          className="h-9 gap-1.5 text-xs"
        >
          <Sparkle className="h-3.5 w-3.5" aria-hidden="true" />
          Draft with DIA
        </Button>
      </div>

      <Textarea
        id="manifest-headline"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="How do you show up for the diaspora?"
        className="min-h-20 text-lg md:text-2xl leading-snug font-serif border-0 bg-transparent p-0 resize-none focus-visible:ring-0"
        maxLength={HEADLINE_HARD_MAX + 20}
        aria-describedby="manifest-headline-help"
      />

      <div
        id="manifest-headline-help"
        className="mt-3 flex items-center justify-between text-xs text-muted-foreground"
      >
        <span>{tooShort ? 'A little more depth helps it land.' : 'Autosaved.'}</span>
        <span aria-live="polite">
          {charCount} / {HEADLINE_HARD_MAX}
        </span>
      </div>

      <FieldError field="headline" errors={errors} />
    </section>
  );
}
