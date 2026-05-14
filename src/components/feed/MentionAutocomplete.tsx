import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMentionAutocomplete, MentionSuggestion } from '@/hooks/useMentionAutocomplete';

interface MentionAutocompleteProps {
  text: string;
  cursorPosition: number;
  onSelectMention: (mention: MentionSuggestion, startPos: number, endPos: number) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

/**
 * Autocomplete dropdown for @mentions
 * Shows when user types @ followed by characters
 */
export const MentionAutocomplete = ({
  text,
  cursorPosition,
  onSelectMention,
  textareaRef,
}: MentionAutocompleteProps) => {
  const [mentionTrigger, setMentionTrigger] = useState<{
    query: string;
    startPos: number;
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const suggestionsRef = useRef<MentionSuggestion[]>([]);
  const lastQueryRef = useRef<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect @ trigger and extract query
  useEffect(() => {
    const beforeCursor = text.substring(0, cursorPosition);

    // Find the last @ before cursor
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      setMentionTrigger(null);
      return;
    }

    // Check if there's a space or start of text before the @
    const charBeforeAt = lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
    if (charBeforeAt !== ' ' && charBeforeAt !== '\n' && lastAtIndex !== 0) {
      setMentionTrigger(null);
      return;
    }

    // Extract the query after @
    const afterAt = beforeCursor.substring(lastAtIndex + 1);

    // Check if there's a space after @ (which would end the mention)
    if (afterAt.includes(' ') || afterAt.includes('\n')) {
      setMentionTrigger(null);
      return;
    }

    // Valid mention trigger
    setMentionTrigger({
      query: afterAt,
      startPos: lastAtIndex,
    });
    // Only reset selection when the query actually changes, so caret moves
    // inside the same query (clicks, arrow-left/right) don't fight navigation.
    if (lastQueryRef.current !== afterAt) {
      setSelectedIndex(0);
      selectedIndexRef.current = 0;
      lastQueryRef.current = afterAt;
    }
  }, [text, cursorPosition]);

  const { data: suggestions = [] } = useMentionAutocomplete(
    mentionTrigger?.query || '',
    !!mentionTrigger
  );

  // Keep refs in sync so the (capture-phase) keydown handler always sees the
  // latest selection without needing to re-bind on every keystroke.
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);

  // Handle keyboard navigation. Bound to the textarea (not document) so that
  // it always wins against other global listeners and stays in sync with the
  // caret. Capture phase ensures we run before the textarea's own handlers.
  useEffect(() => {
    if (!mentionTrigger) return;
    const ta = textareaRef.current;
    if (!ta) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const list = suggestionsRef.current;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setMentionTrigger(null);
        return;
      }
      if (list.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % list.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + list.length) % list.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        const pick = list[selectedIndexRef.current] ?? list[0];
        if (pick) handleSelectMention(pick);
      }
    };

    ta.addEventListener('keydown', handleKeyDown, true);
    return () => ta.removeEventListener('keydown', handleKeyDown, true);
  }, [mentionTrigger, textareaRef]);

  const handleSelectMention = (mention: MentionSuggestion) => {
    if (!mentionTrigger) return;

    const endPos = cursorPosition;
    onSelectMention(mention, mentionTrigger.startPos, endPos);
    setMentionTrigger(null);
  };

  if (!mentionTrigger || suggestions.length === 0) {
    return null;
  }

  // Calculate dropdown position relative to textarea
  const getDropdownPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length;
    const lineHeight = 24; // Approximate line height in pixels

    return {
      top: currentLine * lineHeight,
      left: 16, // Offset from left edge
    };
  };

  const position = getDropdownPosition();

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg max-w-sm w-full"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="p-2">
        <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
          Mention a connection
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectMention(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={suggestion.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {suggestion.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-medium truncate">{suggestion.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{suggestion.username}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
