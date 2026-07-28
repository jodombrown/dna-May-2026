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
 * Waitlist mode. When true the /auth signup tab redirects to /waitlist.
 *
 * Currently false: signup is open and public CTAs read "Sign up".
 *
 * To re-close signup:
 *   1. Set WAITLIST_MODE = true below
 *   2. Run: git grep -l "Sign up" src | xargs sed -i '' 's/>Sign up</>Join the Waitlist</g'
 *      (review each hit, the /auth page copy should stay "Sign up")
 */
export const WAITLIST_MODE = false;
