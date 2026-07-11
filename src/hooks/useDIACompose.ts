/**
 * useDIACompose — DIA reads what you're writing (BD085)
 *
 * Debounced call to the dia-compose-read edge function. Returns the inferred
 * verb and the extracted fields.
 *
 * THREE RULES THIS HOOK ENFORCES:
 *
 * 1. DIA NEVER OVERWRITES THE MEMBER. Once a field is touched, it is the
 *    author's, permanently. DIA fills only what is empty or what DIA itself
 *    put there.
 * 2. DIA GOES QUIET ONCE THE MEMBER CHOOSES. Pick a verb by hand and DIA stops
 *    proposing verbs for the rest of the compose.
 * 3. FAILURE IS SILENCE. Model down, slow, or unsure → no proposal, and the
 *    composer behaves like an ordinary composer. Never an error, never a spinner
 *    that blocks writing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ComposerMode } from '@/config/composerModes';

/** DIA does not interrupt before the member has said enough to be read. */
const MIN_CHARS = 18;
/** Long enough to feel like reading, short enough to feel live. */
const DEBOUNCE_MS = 550;

/**
 * The edge function speaks in C verbs; the composer speaks in modes.
 * One mapping, here, so neither side leaks into the other.
 */
const VERB_TO_MODE: Record<string, ComposerMode> = {
  connect: 'connect',
  convene: 'event',
  collaborate: 'space',
  contribute: 'need',
  convey: 'story',
};

export interface DIAProposal {
  verb: ComposerMode;
  confidence: number;
  fields: Record<string, string>;
  reason: string | null;
}

interface UseDIAComposeArgs {
  text: string;
  /** True once the member has picked a verb by hand — DIA defers to them. */
  userPickedVerb: boolean;
  /** Fields the member has edited. DIA will never touch these again. */
  ownedByAuthor: Set<string>;
  enabled?: boolean;
}

interface UseDIAComposeResult {
  proposal: DIAProposal | null;
  /** True while DIA is reading — a quiet line, never a blocking spinner. */
  isReading: boolean;
  /** Fields currently filled by DIA and not yet touched by the author. */
  diaFilled: Set<string>;
  /** Call when the author edits a field: it becomes theirs, and DIA's mark clears. */
  releaseField: (key: string) => void;
  reset: () => void;
}

export function useDIACompose({
  text,
  userPickedVerb,
  ownedByAuthor,
  enabled = true,
}: UseDIAComposeArgs): UseDIAComposeResult {
  const [proposal, setProposal] = useState<DIAProposal | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [diaFilled, setDiaFilled] = useState<Set<string>>(new Set());

  const timer = useRef<ReturnType<typeof setTimeout>>();
  /** Guards against a slow response landing after a newer one. */
  const seq = useRef(0);
  /** Read at fire time so a stale closure never resurrects an owned field. */
  const ownedRef = useRef(ownedByAuthor);
  ownedRef.current = ownedByAuthor;

  const releaseField = useCallback((key: string) => {
    setDiaFilled((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setProposal(null);
    setDiaFilled(new Set());
    setIsReading(false);
    seq.current += 1;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const body = text.trim();
    if (body.length < MIN_CHARS) {
      setProposal(null);
      setIsReading(false);
      return;
    }

    setIsReading(true);
    clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      const mine = ++seq.current;

      try {
        const { data, error } = await supabase.functions.invoke('dia-compose-read', {
          body: { text: body },
        });

        // A newer keystroke already superseded this read.
        if (mine !== seq.current) return;

        const mode = data?.verb ? VERB_TO_MODE[data.verb] : undefined;
        if (error || !mode) {
          setProposal(null); // silence, not an error
          setIsReading(false);
          return;
        }

        const incoming: DIAProposal = {
          verb: mode,
          confidence: data.confidence ?? 0,
          fields: data.fields ?? {},
          reason: data.reason ?? null,
        };

        // RULE 1 — never overwrite the author. Strip anything they own.
        const proposable: Record<string, string> = {};
        Object.entries(incoming.fields).forEach(([k, v]) => {
          if (!ownedRef.current.has(k)) proposable[k] = v;
        });

        setProposal({ ...incoming, fields: proposable });
        setDiaFilled(new Set(Object.keys(proposable)));
        setIsReading(false);
      } catch {
        if (mine !== seq.current) return;
        setProposal(null);
        setIsReading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer.current);
    // `ownedByAuthor` is read at fire time (ownedRef); it must not re-trigger the call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);

  // RULE 2 — the member has spoken. DIA stops proposing verbs. Fields still
  // flow (into unowned inputs); only the verb goes quiet.
  return {
    proposal,
    isReading,
    diaFilled,
    releaseField,
    reset,
  };
}
