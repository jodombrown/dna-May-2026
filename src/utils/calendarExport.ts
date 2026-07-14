import { createEvent, EventAttributes, DateArray } from 'ics';
import { config } from '@/lib/config';
import { datesAnnounced } from '@/lib/events/eventTime';
import { formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';

interface EventData extends EventPlaceInput {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  /** Callers must not export undated events (datesAnnounced === false);
   *  generateICSFile returns an error and the URL builders return '' when
   *  dates are missing anyway, so nothing fabricated ever reaches a
   *  calendar. */
  start_time: string | null;
  end_time: string | null;
  /** false → the hour is unverified; export dates only, never a clock. */
  time_confirmed?: boolean | null;
  date_confirmed?: boolean | null;
  meeting_url?: string;
  format: 'in_person' | 'virtual' | 'hybrid';
  organizer?: {
    full_name: string;
    email?: string;
  };
}

/** "Venue, street, locality" for calendar location fields. */
function physicalLocation(event: EventData, withStreet: boolean): string {
  const place = formatEventPlace(event, 'full');
  return [place.venue, withStreet ? place.street : null, place.locality]
    .filter(Boolean)
    .join(', ');
}

/**
 * Convert ISO date string to ICS DateArray format [year, month, day, hour, minute]
 */
function dateToICSFormat(isoString: string): DateArray {
  const date = new Date(isoString);
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1, // ICS months are 1-indexed
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

/** Date-only DateArray for events whose hour is unverified. */
function dateOnlyICSFormat(isoString: string): DateArray {
  const date = new Date(isoString);
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
}

/**
 * Generate a .ics file for an event
 */
export function generateICSFile(event: EventData): { error?: Error; value?: string } {
  if (!datesAnnounced(event) || !event.end_time) {
    return { error: new Error('Event has no announced dates to export') };
  }
  // Venue when known, else city/locality — never a placeholder.
  const location = event.format === 'virtual'
    ? event.meeting_url || 'Online Event'
    : physicalLocation(event, true);

  const eventUrl = `${window.location.origin}/dna/convene/events/${event.slug || event.id}`;
  
  const description = [
    event.description || '',
    event.format === 'virtual' && event.meeting_url ? `\nJoin here: ${event.meeting_url}` : '',
    `\nView on DNA Platform: ${eventUrl}`,
  ]
    .filter(Boolean)
    .join('\n')
    .substring(0, 1000); // Limit description length

  // An unverified hour exports as an all-day (date-only) entry — putting a
  // fabricated 9 AM on someone's phone is the fabrication with an alarm.
  const timeConfirmed = event.time_confirmed !== false;
  const eventAttributes: EventAttributes = {
    start: timeConfirmed ? dateToICSFormat(event.start_time) : dateOnlyICSFormat(event.start_time),
    end: timeConfirmed ? dateToICSFormat(event.end_time) : dateOnlyICSFormat(event.end_time),
    title: event.title,
    description,
    location,
    url: eventUrl,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: event.organizer ? {
      name: event.organizer.full_name,
      email: event.organizer.email,
    } : undefined,
    productId: config.APP_DOMAIN,
  };

  return createEvent(eventAttributes);
}

/**
 * Download .ics file to user's device
 */
export function downloadICSFile(event: EventData) {
  const result = generateICSFile(event);
  
  if (result.error) {
    throw result.error;
  }

  const blob = new Blob([result.value!], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function getGoogleCalendarUrl(event: EventData): string {
  if (!datesAnnounced(event) || !event.end_time) return '';
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  
  // Format dates as YYYYMMDDTHHMMSSZ — or YYYYMMDD (all-day) when the hour
  // is unverified.
  const timeConfirmed = event.time_confirmed !== false;
  const formatDate = (date: Date) => {
    if (!timeConfirmed) return date.toISOString().slice(0, 10).replace(/-/g, '');
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const location = event.format === 'virtual'
    ? event.meeting_url || 'Online'
    : physicalLocation(event, false);

  const details = [
    event.description || '',
    event.format === 'virtual' && event.meeting_url ? `Join: ${event.meeting_url}` : '',
    `View on DNA: ${window.location.origin}/dna/convene/events/${event.slug || event.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL (web version)
 */
export function getOutlookCalendarUrl(event: EventData): string {
  if (!datesAnnounced(event) || !event.end_time) return '';
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  const location = event.format === 'virtual'
    ? event.meeting_url || 'Online'
    : physicalLocation(event, false);

  const body = [
    event.description || '',
    event.format === 'virtual' && event.meeting_url ? `Join: ${event.meeting_url}` : '',
    `View on DNA: ${window.location.origin}/dna/convene/events/${event.slug || event.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body,
    location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Office 365 Calendar URL
 */
export function getOffice365CalendarUrl(event: EventData): string {
  if (!datesAnnounced(event) || !event.end_time) return '';
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  const location = event.format === 'virtual'
    ? event.meeting_url || 'Online'
    : physicalLocation(event, false);

  const body = [
    event.description || '',
    event.format === 'virtual' && event.meeting_url ? `Join: ${event.meeting_url}` : '',
    `View on DNA: ${window.location.origin}/dna/convene/events/${event.slug || event.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body,
    location,
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}
