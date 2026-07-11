/**
 * DNA Post Composer — DIA Intelligence Service
 *
 * Ambient analysis, mode detection, tag suggestions,
 * timezone intelligence, and cross-C suggestion engine.
 */

import {
  type ComposerMode,
  type DIASuggestion,
  type DIAAmbientConfig,
  DIA_AMBIENT_DEFAULTS,
} from '@/types/composer';

export const diaComposerService = {
  // ============================================
  // AMBIENT ANALYSIS — Runs on text input
  // ============================================

  async analyzeContent(
    text: string,
    currentMode: ComposerMode,
    config: DIAAmbientConfig = DIA_AMBIENT_DEFAULTS
  ): Promise<DIASuggestion | null> {
    if (text.length < config.analyzeAfterCharCount) return null;

    const modeSuggestion = this.detectModeMismatch(text, currentMode);
    if (
      modeSuggestion &&
      modeSuggestion.confidence >= config.suggestionConfidenceThreshold
    ) {
      return modeSuggestion;
    }

    return null;
  },

  detectModeMismatch(
    text: string,
    currentMode: ComposerMode
  ): DIASuggestion | null {
    const lowerText = text.toLowerCase();

    // Event detection patterns
    const eventPatterns = [
      /join us (on|this|next)/i,
      /save the date/i,
      /\b(rsvp|register|attend|happening on)\b/i,
      /\b(this|next) (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}/i,
    ];

    // Opportunity detection patterns
    const opportunityPatterns = [
      /looking for (a|an|someone)/i,
      /\b(hiring|seeking|need|wanted)\b/i,
      /i can (help|offer|provide|teach|mentor)/i,
      /\b(available for|open to)\b/i,
      /\b(freelance|contract|volunteer|intern)\b/i,
    ];

    // Story detection patterns
    const storyIndicators = [
      text.length > 1500,
      /\b(chapter|part \d|introduction|conclusion)\b/i.test(lowerText),
      /\b(lessons learned|my journey|looking back|reflecting on)\b/i.test(
        lowerText
      ),
    ];

    // Space detection patterns
    const spacePatterns = [
      /who wants to (work on|collaborate|build|join)/i,
      /\b(project|initiative|working group|task force)\b/i,
      /looking for (collaborators|team members|partners)/i,
      /let's (build|create|start|launch) (a|an|this)/i,
    ];

    if (
      currentMode !== 'event' &&
      eventPatterns.some((p) => p.test(lowerText))
    ) {
      return {
        id: crypto.randomUUID(),
        type: 'mode_switch',
        message:
          'This sounds like an event. Switch to Convene mode to add date, location, and registration?',
        action: {
          type: 'switch_mode',
          payload: { targetMode: 'event' },
        },
        confidence: 0.75,
      };
    }

    if (
      currentMode !== 'need' &&
      opportunityPatterns.some((p) => p.test(lowerText))
    ) {
      return {
        id: crypto.randomUUID(),
        type: 'mode_switch',
        message:
          'This looks like an opportunity. Switch to Contribute mode for better matching?',
        action: {
          type: 'switch_mode',
          payload: { targetMode: 'need' },
        },
        confidence: 0.7,
      };
    }

    if (
      currentMode !== 'story' &&
      storyIndicators.filter(Boolean).length >= 2
    ) {
      return {
        id: crypto.randomUUID(),
        type: 'content_upgrade',
        message:
          'This looks like it could be a Story. Stories get 3x more engagement on DNA.',
        action: {
          type: 'switch_mode',
          payload: { targetMode: 'story' },
        },
        confidence: 0.65,
      };
    }

    if (
      currentMode !== 'space' &&
      spacePatterns.some((p) => p.test(lowerText))
    ) {
      return {
        id: crypto.randomUUID(),
        type: 'mode_switch',
        message:
          'This sounds like a collaboration. Switch to Collaborate mode to set up a Space?',
        action: {
          type: 'switch_mode',
          payload: { targetMode: 'space' },
        },
        confidence: 0.7,
      };
    }

    return null;
  },

  // ============================================
  // TAG SUGGESTIONS
  // ============================================

  async suggestTags(text: string): Promise<string[]> {
    const keywords: string[] = [];

    // Extract hashtags already in text
    const hashtagMatches = text.match(/#\w+/g);
    if (hashtagMatches) {
      keywords.push(...hashtagMatches.map((h) => h.slice(1)));
    }

    // Extract capitalized multi-word phrases (potential proper nouns/topics)
    const phraseMatches = text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g);
    if (phraseMatches) {
      keywords.push(...phraseMatches);
    }

    return [...new Set(keywords)].slice(0, 5);
  },

  // ============================================
  // TIMEZONE INTELLIGENCE
  // ============================================

  generateTimezoneDisplays(
    eventTime: Date,
    eventTimezone: string,
    userConnectionTimezones: string[] = []
  ): { timezone: string; label: string; displayTime: string }[] {
    const coreTimezones = [
      'Africa/Lagos',
      'Africa/Nairobi',
      'Africa/Johannesburg',
      'Africa/Cairo',
    ];

    const allTimezones = [
      ...new Set([eventTimezone, ...coreTimezones, ...userConnectionTimezones]),
    ];

    return allTimezones.map((tz) => ({
      timezone: tz,
      label: this.getTimezoneLabel(tz),
      displayTime: eventTime.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    }));
  },

  getTimezoneLabel(tz: string): string {
    const labels: Record<string, string> = {
      'Africa/Lagos': 'Lagos (WAT)',
      'Africa/Nairobi': 'Nairobi (EAT)',
      'Africa/Johannesburg': 'Johannesburg (SAST)',
      'Africa/Cairo': 'Cairo (EET)',
      'Africa/Accra': 'Accra (GMT)',
      'America/New_York': 'New York (EST)',
      'America/Chicago': 'Chicago (CST)',
      'America/Los_Angeles': 'Los Angeles (PST)',
      'Europe/London': 'London (GMT)',
      'Europe/Paris': 'Paris (CET)',
    };
    return labels[tz] || tz.split('/').pop()?.replace('_', ' ') || tz;
  },

  // ============================================
  // CROSS-C SUGGESTION ENGINE
  // ============================================

  async suggestCrossLinks(
    mode: ComposerMode,
    fields: Record<string, unknown>
  ): Promise<DIASuggestion | null> {
    if (mode === 'event') {
      return {
        id: crypto.randomUUID(),
        type: 'cross_c_link',
        message:
          'Want to create a Space for ongoing collaboration after this event?',
        action: {
          type: 'navigate',
          payload: {
            openComposer: true,
            mode: 'space',
            prefill: { relatedEventId: fields.id },
          },
        },
        confidence: 0.7,
      };
    }

    if (mode === 'need') {
      return {
        id: crypto.randomUUID(),
        type: 'audience_suggestion',
        message:
          'Connections in your network match this opportunity. Share directly with them?',
        action: {
          type: 'share_with',
          payload: { matchedUserIds: [] },
        },
        confidence: 0.8,
      };
    }

    return null;
  },
};
