// Event timezone derivation and wall-time ⇄ UTC conversion.
//
// THE BUG THIS FIXES: `events.timezone` defaulted to 'UTC' and start_time was
// built from the ORGANIZER'S BROWSER clock. An Accra event created from Los
// Angeles was stored seven hours wrong. The rule now: an event's timezone
// comes from the EVENT'S LOCATION, never from whoever happens to be typing.
// The organizer never picks a timezone; the form derives it and shows the
// consequence ("Doors 7:00 PM in Accra. That's 12:00 PM for you.").
//
// Everything here is zone-explicit — no function reads the process/browser
// local timezone except browserTimezone(), which exists only as the stated
// fallback for virtual events with no location.

export interface LocationHint {
  countryCode?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// ---------------------------------------------------------------------------
// Wall time ⇄ UTC, via Intl (no tz database dependency)
// ---------------------------------------------------------------------------

/** Offset of `timeZone` from UTC at `instant`, in milliseconds. */
export function tzOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(instant)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === '24' ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * "2026-08-15" + "19:00" on the wall clock of `timeZone` → the UTC instant.
 * Runs the offset lookup twice so a DST boundary lands on the right side.
 */
export function wallTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const asIfUtc = Date.UTC(y, mo - 1, d, h, mi, 0);
  const first = tzOffsetMs(new Date(asIfUtc), timeZone);
  let utc = asIfUtc - first;
  const second = tzOffsetMs(new Date(utc), timeZone);
  if (second !== first) utc = asIfUtc - second;
  return new Date(utc);
}

/** A UTC instant → the wall-clock {date, time} it reads as in `timeZone`. */
export function utcToWallTime(iso: string, timeZone: string): { date: string; time: string } {
  const instant = new Date(iso);
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(instant)) parts[p.type] = p.value;
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${hour}:${parts.minute}` };
}

/** "7:00 PM" — an instant's clock time in a given zone. */
export function formatTimeInZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** The zone the viewer's device reports. Fallback only — never event truth. */
export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** "Africa/Accra" → "Accra", "America/Port_of_Spain" → "Port of Spain". */
export function zoneCityLabel(timeZone: string): string {
  const last = timeZone.split('/').pop() ?? timeZone;
  return last.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Location → IANA timezone
// ---------------------------------------------------------------------------

/** Countries with one timezone: ISO 3166-1 alpha-2 → IANA zone. */
const SINGLE_ZONE: Record<string, string> = {
  // Africa — complete
  DZ: 'Africa/Algiers', AO: 'Africa/Luanda', BJ: 'Africa/Porto-Novo',
  BW: 'Africa/Gaborone', BF: 'Africa/Ouagadougou', BI: 'Africa/Bujumbura',
  CM: 'Africa/Douala', CV: 'Atlantic/Cape_Verde', CF: 'Africa/Bangui',
  TD: 'Africa/Ndjamena', KM: 'Indian/Comoro', CG: 'Africa/Brazzaville',
  CI: 'Africa/Abidjan', DJ: 'Africa/Djibouti', EG: 'Africa/Cairo',
  GQ: 'Africa/Malabo', ER: 'Africa/Asmara', SZ: 'Africa/Mbabane',
  ET: 'Africa/Addis_Ababa', GA: 'Africa/Libreville', GM: 'Africa/Banjul',
  GH: 'Africa/Accra', GN: 'Africa/Conakry', GW: 'Africa/Bissau',
  KE: 'Africa/Nairobi', LS: 'Africa/Maseru', LR: 'Africa/Monrovia',
  LY: 'Africa/Tripoli', MG: 'Indian/Antananarivo', MW: 'Africa/Blantyre',
  ML: 'Africa/Bamako', MR: 'Africa/Nouakchott', MU: 'Indian/Mauritius',
  MA: 'Africa/Casablanca', MZ: 'Africa/Maputo', NA: 'Africa/Windhoek',
  NE: 'Africa/Niamey', NG: 'Africa/Lagos', RW: 'Africa/Kigali',
  ST: 'Africa/Sao_Tome', SN: 'Africa/Dakar', SC: 'Indian/Mahe',
  SL: 'Africa/Freetown', SO: 'Africa/Mogadishu', ZA: 'Africa/Johannesburg',
  SS: 'Africa/Juba', SD: 'Africa/Khartoum', TZ: 'Africa/Dar_es_Salaam',
  TG: 'Africa/Lome', TN: 'Africa/Tunis', UG: 'Africa/Kampala',
  ZM: 'Africa/Lusaka', ZW: 'Africa/Harare',
  // Caribbean & nearby
  JM: 'America/Jamaica', TT: 'America/Port_of_Spain', BB: 'America/Barbados',
  HT: 'America/Port-au-Prince', DO: 'America/Santo_Domingo', CU: 'America/Havana',
  BS: 'America/Nassau', GD: 'America/Grenada', LC: 'America/St_Lucia',
  AG: 'America/Antigua', VC: 'America/St_Vincent', DM: 'America/Dominica',
  KN: 'America/St_Kitts', GY: 'America/Guyana', SR: 'America/Paramaribo',
  BZ: 'America/Belize', PR: 'America/Puerto_Rico', BM: 'Atlantic/Bermuda',
  // Europe
  GB: 'Europe/London', IE: 'Europe/Dublin', FR: 'Europe/Paris',
  DE: 'Europe/Berlin', NL: 'Europe/Amsterdam', BE: 'Europe/Brussels',
  CH: 'Europe/Zurich', AT: 'Europe/Vienna', IT: 'Europe/Rome',
  ES: 'Europe/Madrid', PT: 'Europe/Lisbon', SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo', DK: 'Europe/Copenhagen', FI: 'Europe/Helsinki',
  PL: 'Europe/Warsaw', CZ: 'Europe/Prague', GR: 'Europe/Athens',
  TR: 'Europe/Istanbul', UA: 'Europe/Kyiv', RO: 'Europe/Bucharest',
  HU: 'Europe/Budapest', LU: 'Europe/Luxembourg', MT: 'Europe/Malta',
  CY: 'Asia/Nicosia',
  // Middle East & Asia
  AE: 'Asia/Dubai', SA: 'Asia/Riyadh', QA: 'Asia/Qatar', KW: 'Asia/Kuwait',
  BH: 'Asia/Bahrain', OM: 'Asia/Muscat', IL: 'Asia/Jerusalem', JO: 'Asia/Amman',
  LB: 'Asia/Beirut', IQ: 'Asia/Baghdad', IR: 'Asia/Tehran', AF: 'Asia/Kabul',
  IN: 'Asia/Kolkata', PK: 'Asia/Karachi', BD: 'Asia/Dhaka', LK: 'Asia/Colombo',
  NP: 'Asia/Kathmandu', CN: 'Asia/Shanghai', JP: 'Asia/Tokyo', KR: 'Asia/Seoul',
  SG: 'Asia/Singapore', MY: 'Asia/Kuala_Lumpur', TH: 'Asia/Bangkok',
  VN: 'Asia/Ho_Chi_Minh', PH: 'Asia/Manila', HK: 'Asia/Hong_Kong',
  TW: 'Asia/Taipei', GE: 'Asia/Tbilisi', AM: 'Asia/Yerevan', AZ: 'Asia/Baku',
  KZ: 'Asia/Almaty',
  // Americas with one zone
  AR: 'America/Argentina/Buenos_Aires', CL: 'America/Santiago',
  CO: 'America/Bogota', PE: 'America/Lima', VE: 'America/Caracas',
  EC: 'America/Guayaquil', BO: 'America/La_Paz', PY: 'America/Asuncion',
  UY: 'America/Montevideo', PA: 'America/Panama', CR: 'America/Costa_Rica',
  GT: 'America/Guatemala', HN: 'America/Tegucigalpa', SV: 'America/El_Salvador',
  NI: 'America/Managua',
  // Oceania
  NZ: 'Pacific/Auckland', FJ: 'Pacific/Fiji',
};

/**
 * Countries spanning several zones: candidate zones with a reference point;
 * the nearest reference to the event's coordinates wins. Without coordinates,
 * the first (most-populous) zone is used.
 */
const MULTI_ZONE: Record<string, Array<{ tz: string; lat: number; lng: number }>> = {
  US: [
    { tz: 'America/New_York', lat: 40.7, lng: -74.0 },
    { tz: 'America/Chicago', lat: 41.9, lng: -87.6 },
    { tz: 'America/Denver', lat: 39.7, lng: -105.0 },
    { tz: 'America/Los_Angeles', lat: 34.1, lng: -118.2 },
    { tz: 'America/Anchorage', lat: 61.2, lng: -149.9 },
    { tz: 'Pacific/Honolulu', lat: 21.3, lng: -157.9 },
  ],
  CA: [
    { tz: 'America/Toronto', lat: 43.7, lng: -79.4 },
    { tz: 'America/Winnipeg', lat: 49.9, lng: -97.1 },
    { tz: 'America/Edmonton', lat: 53.5, lng: -113.5 },
    { tz: 'America/Vancouver', lat: 49.3, lng: -123.1 },
    { tz: 'America/Halifax', lat: 44.6, lng: -63.6 },
    { tz: 'America/St_Johns', lat: 47.6, lng: -52.7 },
  ],
  BR: [
    { tz: 'America/Sao_Paulo', lat: -23.5, lng: -46.6 },
    { tz: 'America/Fortaleza', lat: -3.7, lng: -38.5 },
    { tz: 'America/Manaus', lat: -3.1, lng: -60.0 },
  ],
  MX: [
    { tz: 'America/Mexico_City', lat: 19.4, lng: -99.1 },
    { tz: 'America/Cancun', lat: 21.2, lng: -86.8 },
    { tz: 'America/Tijuana', lat: 32.5, lng: -117.0 },
  ],
  AU: [
    { tz: 'Australia/Sydney', lat: -33.9, lng: 151.2 },
    { tz: 'Australia/Brisbane', lat: -27.5, lng: 153.0 },
    { tz: 'Australia/Adelaide', lat: -34.9, lng: 138.6 },
    { tz: 'Australia/Darwin', lat: -12.5, lng: 130.8 },
    { tz: 'Australia/Perth', lat: -31.9, lng: 115.9 },
  ],
  RU: [
    { tz: 'Europe/Moscow', lat: 55.7, lng: 37.6 },
    { tz: 'Asia/Yekaterinburg', lat: 56.8, lng: 60.6 },
    { tz: 'Asia/Novosibirsk', lat: 55.0, lng: 82.9 },
    { tz: 'Asia/Vladivostok', lat: 43.1, lng: 131.9 },
  ],
  ID: [
    { tz: 'Asia/Jakarta', lat: -6.2, lng: 106.8 },
    { tz: 'Asia/Makassar', lat: -5.1, lng: 119.4 },
    { tz: 'Asia/Jayapura', lat: -2.5, lng: 140.7 },
  ],
  CD: [
    { tz: 'Africa/Kinshasa', lat: -4.3, lng: 15.3 },
    { tz: 'Africa/Lubumbashi', lat: -11.7, lng: 27.5 },
  ],
};

/** Common country NAMES (as geocoders/typing produce them) → ISO code. */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  ghana: 'GH', nigeria: 'NG', kenya: 'KE', 'south africa': 'ZA', egypt: 'EG',
  ethiopia: 'ET', senegal: 'SN', rwanda: 'RW', tanzania: 'TZ', uganda: 'UG',
  morocco: 'MA', algeria: 'DZ', tunisia: 'TN', cameroon: 'CM',
  "côte d'ivoire": 'CI', "cote d'ivoire": 'CI', 'ivory coast': 'CI',
  'democratic republic of the congo': 'CD', 'dr congo': 'CD',
  'congo-kinshasa': 'CD', 'republic of the congo': 'CG', 'congo-brazzaville': 'CG',
  zambia: 'ZM', zimbabwe: 'ZW', botswana: 'BW', namibia: 'NA', mozambique: 'MZ',
  angola: 'AO', mali: 'ML', 'burkina faso': 'BF', niger: 'NE', chad: 'TD',
  sudan: 'SD', 'south sudan': 'SS', somalia: 'SO', liberia: 'LR',
  'sierra leone': 'SL', guinea: 'GN', 'guinea-bissau': 'GW', gambia: 'GM',
  'the gambia': 'GM', benin: 'BJ', togo: 'TG', gabon: 'GA',
  'equatorial guinea': 'GQ', 'central african republic': 'CF', burundi: 'BI',
  malawi: 'MW', lesotho: 'LS', eswatini: 'SZ', djibouti: 'DJ', eritrea: 'ER',
  libya: 'LY', mauritania: 'MR', madagascar: 'MG', mauritius: 'MU',
  seychelles: 'SC', comoros: 'KM', 'cape verde': 'CV', 'cabo verde': 'CV',
  'são tomé and príncipe': 'ST', 'sao tome and principe': 'ST',
  'united states': 'US', 'united states of america': 'US', usa: 'US',
  canada: 'CA', 'united kingdom': 'GB', uk: 'GB', england: 'GB',
  scotland: 'GB', wales: 'GB', france: 'FR', germany: 'DE', netherlands: 'NL',
  belgium: 'BE', ireland: 'IE', italy: 'IT', spain: 'ES', portugal: 'PT',
  switzerland: 'CH', austria: 'AT', sweden: 'SE', norway: 'NO', denmark: 'DK',
  jamaica: 'JM', 'trinidad and tobago': 'TT', barbados: 'BB', haiti: 'HT',
  'dominican republic': 'DO', cuba: 'CU', bahamas: 'BS', 'the bahamas': 'BS',
  grenada: 'GD', guyana: 'GY', suriname: 'SR', belize: 'BZ',
  'puerto rico': 'PR', bermuda: 'BM',
  brazil: 'BR', mexico: 'MX', argentina: 'AR', colombia: 'CO', chile: 'CL',
  peru: 'PE',
  'united arab emirates': 'AE', uae: 'AE', 'saudi arabia': 'SA', qatar: 'QA',
  israel: 'IL', india: 'IN', china: 'CN', japan: 'JP', 'south korea': 'KR',
  singapore: 'SG', australia: 'AU', 'new zealand': 'NZ', russia: 'RU',
  turkey: 'TR', 'türkiye': 'TR', indonesia: 'ID', philippines: 'PH',
  pakistan: 'PK', bangladesh: 'BD', kazakhstan: 'KZ',
};

function countryCodeFor(hint: LocationHint): string | null {
  const code = hint.countryCode?.trim().toUpperCase();
  if (code && (SINGLE_ZONE[code] || MULTI_ZONE[code])) return code;
  const name = hint.country?.trim().toLowerCase();
  if (name && COUNTRY_NAME_TO_CODE[name]) return COUNTRY_NAME_TO_CODE[name];
  return null;
}

/**
 * The event's IANA timezone, from its location. Multi-zone countries pick the
 * zone whose reference city is nearest the event's coordinates (or the
 * most-populous zone when there are no coordinates). Returns null when the
 * country can't be recognized — callers fall back to the organizer's zone and
 * must SAY SO in the UI.
 */
export function timezoneForLocation(hint: LocationHint): string | null {
  const code = countryCodeFor(hint);
  if (!code) return null;
  if (SINGLE_ZONE[code]) return SINGLE_ZONE[code];

  const zones = MULTI_ZONE[code];
  if (!zones?.length) return null;
  const { lat, lng } = hint;
  if (typeof lat !== 'number' || typeof lng !== 'number') return zones[0].tz;

  let best = zones[0];
  let bestDist = Infinity;
  for (const z of zones) {
    const d = (z.lat - lat) ** 2 + (z.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best.tz;
}
