/**
 * Drawer shell constants.
 *
 * DR0 found three competing z-index regimes in the overlay layer:
 *   sheet        999 / 1000
 *   drawer      1050 / 1051
 *   alert-dialog      1100
 *
 * The shell takes ONE band and surfaces stop choosing. It sits above the sheet
 * band so a drawer is never buried by a legacy sheet, and below alert-dialog so
 * a destructive confirm can still appear over an open drawer.
 *
 * Exported as a constant, never written as a literal in a className, so the
 * band has exactly one definition.
 */
export const DRAWER_Z_INDEX = 1060;

/**
 * Handedness. DR1 ships the MECHANISM only: the shell reads this and mirrors
 * anchor edge, header control order, chevron direction and swipe direction off
 * it. The onboarding screen and the Settings toggle are DR2, and because the
 * seam exists now, DR2 is a config change rather than a refactor.
 */
export type Handedness = 'left' | 'right';

export const DEFAULT_HANDEDNESS: Handedness = 'right';

/** Mobile anchors to the bottom edge regardless of handedness. */
export function anchorFor(handedness: Handedness, isMobile: boolean): 'bottom' | 'left' | 'right' {
  if (isMobile) return 'bottom';
  return handedness === 'left' ? 'left' : 'right';
}
