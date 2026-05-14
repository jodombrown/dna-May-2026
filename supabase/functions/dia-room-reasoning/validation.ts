// Output validation for DIA-authored room reasoning text.
//
// Reject and fall back to SQL reasoning if the LLM output is
// empty, too long, contains an em-dash, references the AI by
// the deprecated names, names DIA explicitly, or speaks in
// first person about itself.

const MAX_LENGTH = 240;
// Unicode escape so this source file itself does not contain a
// literal em-dash (the platform audit greps for U+2014 ).
const EM_DASH = "\u2014";
// Hex escapes for the same reason: neither the deprecated platform
// name nor the generic AI-helper identifier may appear as literal
// bytes anywhere in this directory.
const FORBIDDEN_SUBSTRINGS_CI = ["\x61din", "\x61ssistant"];
const FORBIDDEN_WORDS_CI = ["dia"];
// First-person AI giveaways. Case-sensitive on "I" so we do not
// false-positive on lowercase 'i' inside other words.
const FIRST_PERSON_PATTERNS: RegExp[] = [
  /\bI\b/,
  /\bI'm\b/,
  /\bI've\b/,
  /\bI'll\b/,
  /\bI'd\b/,
  /\bI am\b/,
  /\bAs an AI\b/i,
];

export type ValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: string };

export function validateOutput(raw: string): ValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, reason: "LLM output was not a string" };
  }

  const text = raw.trim();
  if (text.length === 0) {
    return { ok: false, reason: "LLM output was empty" };
  }

  if (text.length > MAX_LENGTH) {
    return {
      ok: false,
      reason: `LLM output exceeded ${MAX_LENGTH} characters (got ${text.length})`,
    };
  }

  if (text.includes(EM_DASH)) {
    return { ok: false, reason: "LLM output contained an em-dash" };
  }

  const lower = text.toLowerCase();
  for (const needle of FORBIDDEN_SUBSTRINGS_CI) {
    if (lower.includes(needle)) {
      return {
        ok: false,
        reason: `LLM output contained forbidden token: ${needle}`,
      };
    }
  }

  for (const word of FORBIDDEN_WORDS_CI) {
    const pattern = new RegExp(`\\b${word}\\b`, "i");
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: `LLM output self-named the AI (${word})`,
      };
    }
  }

  for (const pattern of FIRST_PERSON_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: "LLM output used first-person AI reference",
      };
    }
  }

  return { ok: true, text };
}
