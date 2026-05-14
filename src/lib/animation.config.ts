/**
 * DNA Platform Animation System
 * 
 * Standardized animation durations and patterns.
 * Only 3 durations allowed: fast, normal, slow.
 */

export const ANIMATION = {
  // Duration tokens (only use these 3)
  duration: {
    fast: 'duration-100',    // 100ms - Micro-interactions (checkbox, switch)
    normal: 'duration-150',  // 150ms - Default (hover, focus, button press)
    slow: 'duration-300',    // 300ms - Page transitions, modals, sheets
  },
  
  // Easing functions
  easing: {
    default: 'ease-out',      // Most hover/focus states
    smooth: 'ease-in-out',    // Modals, transitions
    spring: 'cubic-bezier(0.4, 0, 0.2, 1)', // Tailwind default
  },
  
  // Common animation patterns (use these instead of custom)
  patterns: {
    // Hover effect (cards, buttons)
    hover: 'transition-all duration-150 hover:shadow-lg hover:-translate-y-1',
    
    // Focus ring (all interactive elements)
    focus: 'focus:outline-none focus:ring-2 focus:ring-dna-emerald focus:ring-offset-2',
    
    // Active/Press state (buttons, interactive elements)
    active: 'active:scale-95 transition-transform duration-100',
    
    // Fade in (page load, content reveal)
    fadeIn: 'animate-fade-in',
    
    // Scale in (modals, dialogs)
    scaleIn: 'animate-scale-in',
    
    // Slide in (sheets, sidebars)
    slideIn: 'animate-slide-in-right',
  },
} as const;

/**
 * Combined Interactive Patterns:
 */

export const INTERACTIVE_CLASSES = {
  // Card hover effect
  card: 'transition-all duration-150 hover:shadow-md active:scale-[0.98]',
  
  // Button hover + active
  button: 'transition-all duration-150 hover:opacity-90 active:scale-95',
  
  // Link hover
  link: 'transition-colors duration-150 hover:text-dna-emerald',
  
  // Icon button (ghost style with hover background)
  iconButton: 'transition-all duration-150 hover:bg-neutral-100 active:scale-95',
} as const;

/**
 * Usage Examples:
 * 
 * Standard Hover:
 * ```tsx
 * <div className={INTERACTIVE_CLASSES.card}>
 *   Card content
 * </div>
 * ```
 * 
 * Custom Animation:
 * ```tsx
 * <button className={`${ANIMATION.duration.normal} ${ANIMATION.patterns.active}`}>
 *   Click me
 * </button>
 * ```
 * 
 * Focus Indicator:
 * ```tsx
 * <input className={ANIMATION.patterns.focus} />
 * ```
 */
