/**
 * parseNaturalWhen — turn a human "When" into eventDate / eventTime
 *
 * DIA extracts "when" exactly as the member wrote it ("Saturday at 6pm",
 * "Sat, Mar 15 · 6:00pm", "March 15"). The events substrate needs a concrete
 * start. This bridges the two WITHOUT guessing: if the phrase doesn't resolve
 * to a real future date, we return null and the composer asks the member —
 * a wrong date on an invitation is worse than a question.
 */

export interface ParsedWhen {
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm, 24h — undefined when the member gave no time. */
  time?: string;
}

const WEEKDAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];
const WEEKDAY_ABBR = ['sun', 'mon', 'tue', 'tues', 'wed', 'thu', 'thur', 'thurs', 'fri', 'sat'];
const ABBR_TO_DAY: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6,
};

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Pull "6pm" / "6:30 pm" / "18:00" out of the phrase. */
function extractTime(s: string): string | undefined {
  const ampm = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10) % 12;
    if (ampm[3].toLowerCase() === 'pm') h += 12;
    return `${pad(h)}:${ampm[2] ?? '00'}`;
  }
  const h24 = s.match(/\b(\d{1,2}):(\d{2})\b/);
  if (h24) {
    const h = parseInt(h24[1], 10);
    if (h >= 0 && h <= 23) return `${pad(h)}:${h24[2]}`;
  }
  return undefined;
}

export function parseNaturalWhen(raw: string, now: Date = new Date()): ParsedWhen | null {
  const input = raw.trim();
  if (!input) return null;

  const time = extractTime(input);
  const lower = input.toLowerCase();

  // Relative words first — Date.parse can't read them.
  if (/\btoday\b|\btonight\b/.test(lower)) {
    return { date: toDateStr(now), time: time ?? (/\btonight\b/.test(lower) ? '19:00' : undefined) };
  }
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return { date: toDateStr(d), time };
  }

  // A bare weekday ("Saturday at 6pm") → the next one.
  for (const [abbr, dayIdx] of Object.entries(ABBR_TO_DAY)) {
    const full = WEEKDAYS[dayIdx];
    const hasDay = new RegExp(`\\b(${full}|${abbr})\\b`, 'i').test(lower);
    // Only treat it as a bare weekday when no month/number date accompanies it.
    if (hasDay && !/\d{1,2}(st|nd|rd|th)?[\s,/-]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)/i.test(lower.replace(/\d{1,2}(:\d{2})?\s*(am|pm)/i, ''))) {
      const d = new Date(now);
      const delta = (dayIdx - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + delta);
      return { date: toDateStr(d), time };
    }
  }

  // Concrete dates — strip the time (already extracted), normalize
  // separators, strip weekday prefixes, then let Date.parse read a pure date.
  const cleaned = input
    .replace(/\d{1,2}(:\d{2})?\s*(am|pm)/gi, ' ')
    .replace(/\b\d{1,2}:\d{2}\b/g, ' ')
    .replace(/[·•]/g, ' ')
    .replace(/\bat\b/gi, ' ')
    .replace(new RegExp(`\\b(${[...WEEKDAYS, ...WEEKDAY_ABBR].join('|')})\\b[,\\s]*`, 'gi'), ' ')
    .replace(/(\d{1,2})(st|nd|rd|th)\b/gi, '$1')
    .replace(/[,\s]+/g, ' ')
    .trim();

  // Date.parse is lenient to the point of fabrication ("soon 2027" → Jan 1).
  // Only trust it when the phrase actually looks like a date.
  const MONTH = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
  const looksLikeDate =
    new RegExp(`\\b${MONTH}\\.?\\s+\\d{1,2}\\b`, 'i').test(cleaned) ||
    new RegExp(`\\b\\d{1,2}\\s+${MONTH}\\b`, 'i').test(cleaned) ||
    /\b\d{1,2}[/.-]\d{1,2}([/.-]\d{2,4})?\b/.test(cleaned) ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(cleaned);
  if (!looksLikeDate) return null;

  const candidates = /\d{4}/.test(cleaned)
    ? [cleaned]
    : [`${cleaned} ${now.getFullYear()}`, `${cleaned} ${now.getFullYear() + 1}`];
  for (const c of candidates) {
    const t = Date.parse(c);
    if (Number.isNaN(t)) continue;
    const d = new Date(t);
    // Roll a parsed-but-past date (no explicit year) into next year.
    if (d.getTime() < now.getTime() - 24 * 3600 * 1000 && !/\d{4}/.test(cleaned)) continue;
    return { date: toDateStr(d), time };
  }

  return null;
}
