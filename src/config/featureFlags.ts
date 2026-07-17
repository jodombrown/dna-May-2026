/**
 * Alpha Testing Feature Flags
 *
 * Controls alpha-specific features throughout the platform.
 * Toggle these flags to enable/disable alpha testing infrastructure.
 */

interface FeatureFlags {
  /** Shows alpha banner, test guide */
  isAlphaTest: boolean;
  /** Subtle "ALPHA" watermark in bottom-right corner */
  showAlphaWatermark: boolean;
  /** In-app test guide accessible from banner and navigation */
  enableTestGuide: boolean;
  /** Show DIA card reasoning metadata (for debugging only) */
  showDIADebugInfo: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  isAlphaTest: false,
  showAlphaWatermark: false,
  enableTestGuide: true,
  showDIADebugInfo: false,
};

/**
 * In-app DM / group messaging (BD063 founder call: OUT at v0.0).
 *
 * Hide-and-freeze: the messaging surface (nav entries, "Message" entry
 * buttons, and the /dna/messages routes) is hidden while messageService /
 * groupMessageService and all thread components stay frozen in the tree.
 * Set to `true` to unfreeze the entire surface in one place.
 *
 * NOTE: this gates DM/group messaging ONLY. Convene event threads
 * (EventThreadCTA) and Connect introductions are Charter-live and are NOT
 * gated by this flag.
 */
export const MESSAGING_ENABLED = false;

/**
 * Waitlist mode. When true:
 *   - All "Join Now" CTAs render as "Join the Waitlist"
 *   - The /auth signup tab redirects to /waitlist
 *
 * To restore Join Now:
 *   1. Set WAITLIST_MODE = false below
 *   2. Run: git grep -l "Join the Waitlist" src | xargs sed -i '' 's/Join the Waitlist/Join Now/g'
 *      (or the reverse of the sed used to swap them in)
 */
export const WAITLIST_MODE = true;

