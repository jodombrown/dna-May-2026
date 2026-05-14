import type { NeedScope, NeedStatus } from '@/types/contribute';

export const NEED_SCOPE_LABELS: Record<NeedScope, { short: string; helper: string }> = {
  one_off: {
    short: 'One-off',
    helper: 'A single conversation, intro, or task.',
  },
  few_hours: {
    short: 'A few hours',
    helper: 'Discrete, time-boxed engagement.',
  },
  short_project: {
    short: 'Short project',
    helper: 'Days to a few weeks.',
  },
  extended: {
    short: 'Extended',
    helper: 'Weeks to months.',
  },
  open_ended: {
    short: 'Open-ended',
    helper: 'Ongoing, no fixed scope.',
  },
};

export const NEED_SCOPE_OPTIONS: NeedScope[] = [
  'one_off',
  'few_hours',
  'short_project',
  'extended',
  'open_ended',
];

export const NEED_STATUS_LABELS: Record<NeedStatus, { short: string; tone: 'live' | 'progress' | 'done' | 'idle' | 'closed' }> = {
  draft: { short: 'Draft', tone: 'idle' },
  open: { short: 'Open', tone: 'live' },
  matched: { short: 'Matched', tone: 'progress' },
  fulfilled: { short: 'Fulfilled', tone: 'done' },
  closed: { short: 'Closed', tone: 'closed' },
  expired: { short: 'Expired', tone: 'closed' },
};
