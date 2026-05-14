// Legacy enum-based reactions (for backward compatibility)
export type ReactionType = 'like' | 'love' | 'celebrate' | 'insightful' | 'support' | 'curious';

// New: Any emoji string (unlimited emojis)
export type ReactionEmoji = string;

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: ReactionEmoji; // Updated to support any emoji
  created_at: string;
}

export interface ReactionCount {
  emoji: ReactionEmoji; // Updated to support any emoji
  count: number;
  users: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
  }[];
}

// Quick access reactions (always visible in quick bar)
// Includes LinkedIn-style + Diaspora-specific reactions
export const QUICK_REACTIONS: ReactionEmoji[] = [
  '👍',  // like
  '❤️',  // love
  '🎉',  // celebrate
  '🙌',  // support
  '💡',  // insightful
  '🤝',  // unity (diaspora-specific)
  '💪',  // strength (diaspora-specific)
];

// Legacy emoji mapping (for existing reactions)
export const LEGACY_EMOJI_MAP: Record<ReactionType, ReactionEmoji> = {
  like: '👍',
  love: '❤️',
  celebrate: '🎉',
  insightful: '💡',
  support: '🙌',
  curious: '🤔',
};

// Display labels for quick reactions
export const REACTION_EMOJIS: Record<ReactionType, { emoji: ReactionEmoji; label: string; color: string }> = {
  like: { emoji: '👍', label: 'Like', color: 'text-blue-500' },
  love: { emoji: '❤️', label: 'Love', color: 'text-red-500' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: 'text-yellow-500' },
  insightful: { emoji: '💡', label: 'Insightful', color: 'text-copper-500' },
  support: { emoji: '🙌', label: 'Support', color: 'text-green-500' },
  curious: { emoji: '🤔', label: 'Curious', color: 'text-orange-500' },
};

// Diaspora-specific reaction labels
export const DIASPORA_REACTIONS: Record<string, { emoji: ReactionEmoji; label: string; color: string }> = {
  unity: { emoji: '🤝', label: 'Unity', color: 'text-amber-500' },
  strength: { emoji: '💪', label: 'Strength', color: 'text-dna-copper' },
};

// Helper: Get emoji label for display
export const getEmojiLabel = (emoji: ReactionEmoji): string => {
  // Check if it's a diaspora reaction
  const diasporaMatch = Object.entries(DIASPORA_REACTIONS).find(([_, data]) => data.emoji === emoji);
  if (diasporaMatch) {
    return diasporaMatch[1].label;
  }

  // Check if it's a legacy reaction
  const legacyMatch = Object.entries(LEGACY_EMOJI_MAP).find(([_, e]) => e === emoji);
  if (legacyMatch) {
    const [type] = legacyMatch;
    return REACTION_EMOJIS[type as ReactionType].label;
  }

  // For custom emojis, just return the emoji itself
  return emoji;
};

// Helper: Check if emoji is in quick reactions
export const isQuickReaction = (emoji: ReactionEmoji): boolean => {
  return QUICK_REACTIONS.includes(emoji);
};
