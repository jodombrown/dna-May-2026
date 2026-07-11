/**
 * DIA — Verb Inference + Field Extraction (BD085)
 *
 * DIA's job at v0.0 is to turn a form into a conversation.
 *
 * Nobody fills a six-field form on a phone to offer four hours a week. So the
 * member writes plainly — "I can offer 4 hours a week of blockchain review to
 * any health startup" — and DIA proposes:
 *
 *     verb:   Offer or Ask  (Contribute)
 *     give:   4 hrs/week  →  to: health startups  →  impact: ship faster
 *
 * DIA PROPOSES. THE AUTHOR CONFIRMS OR EDITS. THE AUTHOR ALWAYS OWNS THE FINAL
 * VALUE. Nothing here is ever written without the member seeing it first.
 *
 * Routing (who should see this) is NOT DIA's job at v0.0 — that is the ranking
 * layer, deferred to Phase F.
 */

import { ComposerMode } from '@/config/composerModes';

export interface DIAExtraction {
  /** The verb DIA infers. Falls back to 'story' (Convey) when ambiguous. */
  mode: ComposerMode;
  /** 0–1. Below CONFIDENCE_FLOOR, DIA proposes nothing and stays quiet. */
  confidence: number;
  /** Structured fields DIA proposes for the inferred verb. All optional. */
  fields: Partial<ExtractedFields>;
  /** Why DIA thinks this — shown to the member, never hidden. */
  reason?: string;
}

export interface ExtractedFields {
  // Convene
  title: string;
  startDateTime: string;
  location: string;
  eventType: 'in_person' | 'virtual' | 'hybrid';
  // Contribute — the give → to → impact triple (BD084)
  direction: 'need' | 'offer';
  category: string;
  giveWhat: string;
  giveTo: string;
  intendedImpact: string;
  // Connect
  intent: string;
  // Convey
  subtitle: string;
}

/** Below this, DIA says nothing. A wrong guess is worse than no guess. */
export const CONFIDENCE_FLOOR = 0.55;

/** DIA does not interrupt before the member has said enough to be read. */
export const MIN_CHARS = 24;

// ---------------------------------------------------------------------------
// Verb inference
// ---------------------------------------------------------------------------

interface VerbSignal {
  mode: ComposerMode;
  patterns: RegExp[];
  weight: number;
}

const VERB_SIGNALS: VerbSignal[] = [
  {
    mode: 'event',
    weight: 1,
    patterns: [
      /\b(hosting|host|join us|rsvp|doors open|we're gathering|meetup|summit|webinar|panel|workshop|conference)\b/i,
      /\b(on|this)\s+(mon|tue|wed|thu|fri|sat|sun)/i,
      /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i,
    ],
  },
  {
    mode: 'need',
    weight: 1,
    patterns: [
      /\b(i can offer|offering|i'm offering|available to|happy to help with|open to advising|i can give)\b/i,
      /\b(looking for help|we need|i need|need a|seeking|can anyone|does anyone have)\b/i,
      /\b\d+\s?(hrs?|hours?)\s?(a|per|\/)\s?(week|month|day)\b/i,
    ],
  },
  {
    mode: 'space',
    weight: 1,
    patterns: [
      /\b(starting a|building a|launching a|we're building|kicking off)\b.*\b(project|initiative|venture|collaboration|space|team)\b/i,
      /\b(looking to fill|recruiting|join the team|open roles?)\b/i,
    ],
  },
  {
    mode: 'connect',
    weight: 1,
    patterns: [
      /\b(looking for a|seeking a|want to meet|trying to connect with|anyone know a)\b.*\b(co-?founder|investor|mentor|advisor|collaborator|partner|expert)\b/i,
      /\b(open to (advising|mentoring)|happy to mentor|can introduce)\b/i,
    ],
  },
];

/**
 * Infers the verb from the member's text.
 * Ambiguous → Convey (BD075). Convey is a real verb, not a dumping ground.
 */
export function inferVerb(text: string): { mode: ComposerMode; confidence: number; reason?: string } {
  if (text.trim().length < MIN_CHARS) {
    return { mode: 'story', confidence: 0 };
  }

  const scores = VERB_SIGNALS.map((sig) => {
    const hits = sig.patterns.filter((p) => p.test(text)).length;
    return { mode: sig.mode, hits, score: hits * sig.weight };
  }).sort((a, b) => b.score - a.score);

  const top = scores[0];
  if (!top || top.score === 0) {
    return { mode: 'story', confidence: 0.4, reason: 'Reads like a story' };
  }

  const runnerUp = scores[1]?.score ?? 0;
  // Confidence rises with signal strength and with separation from the next best.
  const confidence = Math.min(0.95, 0.5 + top.score * 0.18 + (top.score - runnerUp) * 0.1);

  return {
    mode: top.mode,
    confidence,
    reason: REASONS[top.mode],
  };
}

const REASONS: Record<ComposerMode, string> = {
  event: 'Reads like an event',
  need: 'Reads like an offer or an ask',
  space: 'Reads like a collaboration',
  connect: 'Reads like you’re looking for someone',
  story: 'Reads like a story',
};

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

const DURATION_RE = /\b(\d+)\s?(hrs?|hours?)\s?(?:a|per|\/)\s?(week|month|day)\b/i;
const OFFER_RE = /\b(?:i can offer|offering|i'm offering|i can give|available to)\s+(.{3,60}?)(?:\.|,|\sto\s|$)/i;
const NEED_RE = /\b(?:we need|i need|need a|looking for|seeking)\s+(.{3,60}?)(?:\.|,|\sto\s|\sfor\s|$)/i;
const TO_RE = /\b(?:to|for)\s+((?:any\s+)?[a-z][\w\s-]{2,40}?)(?:\.|,|\sso\s|\sto\s|$)/i;
const IMPACT_RE = /\b(?:so (?:that|we can)|in order to|to reach|to help|to get to)\s+(.{3,50}?)(?:\.|,|$)/i;

/**
 * Proposes the give → to → impact triple (BD084) and direction from free text.
 * Every field is a proposal. The member confirms or overwrites.
 */
function extractContribute(text: string): Partial<ExtractedFields> {
  const isOffer = OFFER_RE.test(text) || /\b(offering|i can offer|happy to)\b/i.test(text);
  const fields: Partial<ExtractedFields> = {
    direction: isOffer ? 'offer' : 'need',
  };

  const duration = text.match(DURATION_RE);
  const offerMatch = text.match(OFFER_RE);
  const needMatch = text.match(NEED_RE);

  // GIVE — what is on the table.
  if (duration) {
    fields.giveWhat = `${duration[1]} hrs/${duration[3].toLowerCase()}`;
  } else if (isOffer && offerMatch) {
    fields.giveWhat = clean(offerMatch[1]);
  } else if (needMatch) {
    fields.giveWhat = clean(needMatch[1]);
  }

  // TO — who or what it goes to.
  const to = text.match(TO_RE);
  if (to) fields.giveTo = clean(to[1]);
  else if (isOffer) fields.giveTo = 'Open to match';

  // IMPACT — the consequence. This is the field that makes Contribute legible.
  const impact = text.match(IMPACT_RE);
  if (impact) fields.intendedImpact = clean(impact[1]);

  if (/\b(blockchain|engineer|architect|design|legal|marketing|finance|code|technical)\b/i.test(text)) {
    fields.category = 'skills_expertise';
  } else if (/\b(mentor|advis|coach)\b/i.test(text)) {
    fields.category = 'mentorship_guidance';
  } else if (/\b(intro|network|connect me)\b/i.test(text)) {
    fields.category = 'network_introductions';
  }

  return fields;
}

function extractConvene(text: string): Partial<ExtractedFields> {
  const fields: Partial<ExtractedFields> = {};

  if (/\b(virtual|online|zoom|remote)\b/i.test(text)) fields.eventType = 'virtual';
  else if (/\bhybrid\b/i.test(text)) fields.eventType = 'hybrid';
  else if (/\b(in person|venue|at the)\b/i.test(text)) fields.eventType = 'in_person';

  // First clause often reads as the title.
  const firstClause = text.split(/[.!?\n]/)[0]?.trim();
  if (firstClause && firstClause.length <= 70) fields.title = firstClause;

  const loc = text.match(/\b(?:in|at)\s+([A-Z][\w\s,-]{2,40})/);
  if (loc) fields.location = clean(loc[1]);

  return fields;
}

function extractConnect(text: string): Partial<ExtractedFields> {
  const m = text.match(
    /\b(co-?founder|investor|mentor|advisor|collaborator|partner|expert)\b/i
  );
  return m ? { intent: m[1].toLowerCase().replace('cofounder', 'co-founder') } : {};
}

const clean = (s: string) =>
  s.trim().replace(/\s+/g, ' ').replace(/[.,;]$/, '').slice(0, 60);

/**
 * The single entry point. Give it the member's text; get back a proposal.
 *
 * Returns `null` when DIA has nothing confident to say — silence is a valid,
 * and often correct, answer.
 */
export function extract(text: string): DIAExtraction | null {
  const { mode, confidence, reason } = inferVerb(text);

  if (confidence < CONFIDENCE_FLOOR) return null;

  let fields: Partial<ExtractedFields> = {};
  if (mode === 'need') fields = extractContribute(text);
  else if (mode === 'event') fields = extractConvene(text);
  else if (mode === 'connect') fields = extractConnect(text);

  return { mode, confidence, fields, reason };
}
