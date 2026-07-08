/**
 * ViewState-Specific Module Configurations
 *
 * Default module configurations for each ViewState (5C).
 *
 * Resolution order:
 * 1. ViewState default (defined here)
 * 2. DEFAULT_MODULES constant (hardcoded fallback)
 *
 * Note: the ADA cohort/experiment/policy override layer was removed in the
 * Pass 10 dark-DB cleanup (2026-07). If per-cohort overrides are ever
 * reintroduced, they should slot in above the ViewState default here.
 */

import { ViewState } from '@/contexts/ViewStateContext';

export interface ModuleConfig {
  id: string;
  order: number;
  visible: boolean;
}

export interface ViewStateModulePreset {
  modules: ModuleConfig[];
}

/**
 * ViewState-specific module presets
 * Each 5C gets a tailored module mix
 */
export const VIEWSTATE_MODULE_PRESETS: Record<ViewState, ViewStateModulePreset> = {
  // DASHBOARD_HOME: Balanced overview
  DASHBOARD_HOME: {
    modules: [
      { id: 'resume_section', order: 1, visible: true },
      { id: 'whats_next', order: 2, visible: true },
      { id: 'upcoming_events', order: 3, visible: true },
      { id: 'suggested_people', order: 4, visible: true },
      { id: 'trending_hashtags', order: 5, visible: true },
      { id: 'recommended_spaces', order: 6, visible: true },
    ],
  },

  // CONNECT_MODE: People & networking focused
  CONNECT_MODE: {
    modules: [
      { id: 'suggested_people', order: 1, visible: true },
      { id: 'resume_section', order: 2, visible: true },
      { id: 'whats_next', order: 3, visible: true },
      { id: 'trending_hashtags', order: 4, visible: true },
      { id: 'upcoming_events', order: 5, visible: true },
      { id: 'recommended_spaces', order: 6, visible: false }, // Hidden by default in CONNECT
    ],
  },

  // CONVENE_MODE: Events & gatherings focused
  CONVENE_MODE: {
    modules: [
      { id: 'upcoming_events', order: 1, visible: true },
      { id: 'recommended_spaces', order: 2, visible: true },
      { id: 'open_needs', order: 3, visible: true },
      { id: 'suggested_people', order: 4, visible: true },
      { id: 'whats_next', order: 5, visible: false }, // Less relevant in events context
      { id: 'resume_section', order: 6, visible: false },
    ],
  },

  // COLLABORATE_MODE: Spaces & projects focused
  COLLABORATE_MODE: {
    modules: [
      { id: 'recommended_spaces', order: 1, visible: true },
      { id: 'open_needs', order: 2, visible: true },
      { id: 'upcoming_events', order: 3, visible: true },
      { id: 'whats_next', order: 4, visible: true },
      { id: 'suggested_people', order: 5, visible: true },
      { id: 'resume_section', order: 6, visible: false },
    ],
  },

  // CONTRIBUTE_MODE: Needs & impact focused
  CONTRIBUTE_MODE: {
    modules: [
      { id: 'open_needs', order: 1, visible: true },
      { id: 'whats_next', order: 2, visible: true },
      { id: 'recommended_spaces', order: 3, visible: true },
      { id: 'upcoming_events', order: 4, visible: true },
      { id: 'suggested_people', order: 5, visible: false }, // Less relevant in contribution context
      { id: 'trending_hashtags', order: 6, visible: false },
    ],
  },

  // CONVEY_MODE: Stories & content focused
  CONVEY_MODE: {
    modules: [
      { id: 'trending_hashtags', order: 1, visible: true },
      { id: 'featured_stories', order: 2, visible: true },
      { id: 'suggested_people', order: 3, visible: true },
      { id: 'upcoming_events', order: 4, visible: true },
      { id: 'recommended_spaces', order: 5, visible: false },
      { id: 'open_needs', order: 6, visible: false },
    ],
  },

  // MESSAGES_MODE: Minimal modules for focused messaging
  MESSAGES_MODE: {
    modules: [
      { id: 'suggested_people', order: 1, visible: true },
      { id: 'upcoming_events', order: 2, visible: true },
      { id: 'whats_next', order: 3, visible: false },
      { id: 'trending_hashtags', order: 4, visible: false },
      { id: 'recommended_spaces', order: 5, visible: false },
      { id: 'open_needs', order: 6, visible: false },
    ],
  },

  // FOCUS_DETAIL_MODE: Minimal modules for detail views
  FOCUS_DETAIL_MODE: {
    modules: [
      { id: 'whats_next', order: 1, visible: true },
      { id: 'suggested_people', order: 2, visible: true },
      { id: 'upcoming_events', order: 3, visible: false },
      { id: 'trending_hashtags', order: 4, visible: false },
      { id: 'recommended_spaces', order: 5, visible: false },
      { id: 'open_needs', order: 6, visible: false },
    ],
  },
};

/**
 * Get default module configuration for a ViewState
 */
export function getViewStateModulePreset(viewState: ViewState): ViewStateModulePreset {
  return VIEWSTATE_MODULE_PRESETS[viewState] || VIEWSTATE_MODULE_PRESETS.DASHBOARD_HOME;
}
