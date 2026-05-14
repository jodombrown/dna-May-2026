/**
 * /roadmap — DNA's Annual Flagship Event marketing page
 *
 * ROADMAP = Return Of the African Diaspora to Mobilize in support of Africa's Progress.
 * Inaugural edition: December 2026, Los Angeles, The Beehive (SoLa Impact OZ campus).
 *
 * Public, no auth required. Mobile-first at 375px. WCAG AA.
 * Inherits DNA design system completely.
 *
 * Reference: /docs/ROADMAP_Event_Page_Build_Brief.md
 */

import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, Calendar, ChevronDown, Loader2, MapPin, Mail, Users, Handshake, HeartHandshake, Megaphone, CheckCircle2, Building2 } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import PatternBackground from '@/components/ui/PatternBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const VENUE = {
  name: 'The Beehive',
  street: '961 E. 61st Street',
  city: 'Los Angeles, CA 90001',
  lat: 33.984,
  lng: -118.261,
};

const EDITION_YEAR = 2026;
const PARTNERSHIP_EMAIL = 'partnerships@diasporanetwork.africa';

const KEY_FACTS = [
  { icon: Calendar, label: 'December 2026' },
  { icon: MapPin, label: 'Los Angeles' },
  { icon: Building2, label: 'The Beehive' },
];

const DAYS = [
  {
    day: 'Day 1',
    pillar: 'Connect',
    color: 'connect',
    summary: 'Reunite the diaspora in one room.',
    details: [
      'Opening ceremony and a Pan-African welcome from DNA leadership.',
      'Curated networking salons by region of origin, sector, and city of residence.',
      'A members-only mixer for the DNA founding community.',
      'Office hours with continental partners visiting from the African Union, AfCFTA Secretariat, and AfDB.',
    ],
  },
  {
    day: 'Day 2',
    pillar: 'Collaborate & Contribute',
    color: 'collaborate',
    summary: 'Move from talk to commitments.',
    details: [
      'Working sessions on flagship diaspora-to-Africa initiatives across health, climate, capital, and culture.',
      'A live marketplace where continental partners post needs and diaspora members commit to contribute time, capital, or expertise.',
      'Sector-specific roundtables hosted by DNA Spaces leaders.',
      'A founders-and-funders matchmaking room.',
    ],
  },
  {
    day: 'Day 3',
    pillar: 'Convey',
    color: 'convey',
    summary: 'Tell the world what we built.',
    details: [
      'Plenary stage: stories, declarations, and signed commitments from the room.',
      'Press availability for partner organizations and member-led initiatives.',
      'A closing ceremony naming the host city for the next edition.',
      'Convey workshops on storytelling, media training, and policy advocacy.',
    ],
  },
] as const;

const MOBILIZATION_BULLETS = [
  {
    icon: Users,
    pillar: 'Connect',
    body: 'You will meet the diaspora members whose work intersects with yours, in person, in a room curated for relevance.',
  },
  {
    icon: Handshake,
    pillar: 'Collaborate',
    body: 'You will join a working session, contribute to a flagship initiative, and leave with collaborators and a next step.',
  },
  {
    icon: HeartHandshake,
    pillar: 'Contribute',
    body: 'You will respond to a real need posted by a continental partner with time, expertise, capital, or distribution.',
  },
  {
    icon: Megaphone,
    pillar: 'Convey',
    body: 'You will help shape the public story of what the diaspora committed to, and amplify it to your own networks.',
  },
  {
    icon: MateMasie,
    pillar: 'Convene',
    body: 'You will help us host. The room is built by you and for you, not performed at you.',
  },
];

const AUDIENCE_TIERS = [
  {
    title: 'DNA community',
    body: 'Founding members, ambassadors, and Spaces leaders from across the global diaspora.',
  },
  {
    title: 'US-based diaspora and Pan-African community',
    body: 'African-born professionals and second-generation diaspora across cities, sectors, and disciplines.',
  },
  {
    title: 'Continental partners',
    body: 'Government, multilateral, and ecosystem leaders traveling from the continent to meet the diaspora at scale.',
  },
  {
    title: 'Institutional partners',
    body: 'Foundations, banks, universities, and corporates building serious Africa-facing programs.',
  },
  {
    title: 'Cultural figures and press',
    body: 'Storytellers, artists, and journalists shaping how the diaspora narrative reaches the world.',
  },
];

const FAQS = [
  {
    q: 'When is ROADMAP 2026?',
    a: 'December 2026. Specific dates and the full agenda are confirmed closer to the event. Subscribe above to be notified the moment registration opens.',
  },
  {
    q: 'Where is it being held?',
    a: 'In Los Angeles at The Beehive, 961 E. 61st Street, LA 90001. The Beehive is SoLa Impact\'s Black-owned Opportunity Zone business campus in South LA\'s historic Goodyear Tract.',
  },
  {
    q: 'Who is ROADMAP for?',
    a: 'The global African diaspora and the partners who want to mobilize alongside us. That includes DNA members, US-based diaspora professionals, continental partners visiting from Africa, institutional partners, and cultural figures and press.',
  },
  {
    q: 'How much will it cost?',
    a: 'Pricing tiers will be published with registration. There will be a meaningfully discounted rate for DNA members and dedicated access tracks for student and early-career diaspora attendees.',
  },
  {
    q: 'Do I need to be a DNA member?',
    a: 'No. ROADMAP is open to the diaspora and our partners. DNA members will receive priority access, member pricing, and a dedicated lounge.',
  },
  {
    q: 'What about travel and lodging?',
    a: 'Travel and lodging are arranged by attendees. We will publish a recommended hotel list, group rates, and travel partner offers as registration opens.',
  },
  {
    q: 'Will ROADMAP rotate to other cities?',
    a: 'Yes. Los Angeles hosts the inaugural edition. The host city for the following year is announced at the closing ceremony each year.',
  },
  {
    q: 'What does "Powered by DNA" mean?',
    a: 'ROADMAP is produced by Diaspora Network of Africa as our annual in-person flagship. DNA is the year-round operating system; ROADMAP is the year\'s in-person moment of truth.',
  },
];

// ─────────────────────────────────────────────────────────────
// Leaflet marker (avoid broken default icon under Vite)
// ─────────────────────────────────────────────────────────────

const venueIcon = L.divIcon({
  className: 'roadmap-venue-marker',
  html: `<div style="
    width: 32px; height: 32px;
    background: hsl(153 31% 42%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 14px;
    font-family: Inter, sans-serif;
  ">R</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// ─────────────────────────────────────────────────────────────
// Email capture form (shared between hero + footer CTA)
// ─────────────────────────────────────────────────────────────

interface EmailCaptureProps {
  source: 'hero' | 'footer-cta';
  variant?: 'light' | 'dark';
  ariaLabel: string;
  buttonLabel?: string;
  className?: string;
}

const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const EmailCapture: React.FC<EmailCaptureProps> = ({
  source,
  variant = 'light',
  ariaLabel,
  buttonLabel = 'Notify me',
  className,
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const inputId = `roadmap-email-${source}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RX.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('roadmap_subscribers' as any)
      .insert([{ email: trimmed, source, edition_year: EDITION_YEAR }]);

    // 23505 is unique-violation — treat as success (already on the list).
    if (error && error.code !== '23505') {
      setStatus('error');
      setMessage('Something went wrong. Please try again in a moment.');
      return;
    }

    setStatus('success');
    setMessage("You're on the list. We'll be in touch the moment registration opens.");
    setEmail('');
  };

  const isDark = variant === 'dark';

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={ariaLabel}
      className={cn('w-full', className)}
      noValidate
    >
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <Input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          disabled={status === 'submitting' || status === 'success'}
          aria-invalid={status === 'error'}
          aria-describedby={`${inputId}-msg`}
          className={cn(
            'h-12 text-base flex-1 rounded-dna-xl',
            isDark
              ? 'bg-white/10 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/60'
              : 'bg-white border-dna-stone',
          )}
        />
        <Button
          type="submit"
          size="lg"
          disabled={status === 'submitting' || status === 'success'}
          className={cn(
            'h-12 rounded-dna-xl px-6 whitespace-nowrap',
            isDark
              ? 'bg-white text-dna-emerald hover:bg-white/90'
              : 'bg-dna-emerald text-white hover:bg-dna-emerald-light',
          )}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>Submitting</span>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <span>You're in</span>
            </>
          ) : (
            <span>{buttonLabel}</span>
          )}
        </Button>
      </div>
      <p
        id={`${inputId}-msg`}
        role={status === 'error' ? 'alert' : 'status'}
        aria-live="polite"
        className={cn(
          'mt-2 text-sm min-h-[1.25rem]',
          status === 'error' && (isDark ? 'text-amber-200' : 'text-dna-crimson'),
          status === 'success' && (isDark ? 'text-white' : 'text-dna-emerald-dark'),
          status === 'idle' && (isDark ? 'text-white/70' : 'text-muted-foreground'),
        )}
      >
        {message ||
          (status === 'idle'
            ? "We'll only email you about ROADMAP. Unsubscribe anytime."
            : '')}
      </p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────
// Section helpers
// ─────────────────────────────────────────────────────────────

const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}> = ({ eyebrow, title, subtitle, align = 'left' }) => (
  <div className={cn('mb-10 lg:mb-14', align === 'center' && 'text-center')}>
    {eyebrow && (
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-dna-copper mb-3">
        {eyebrow}
      </p>
    )}
    <h2 className="font-heritage text-3xl sm:text-4xl lg:text-5xl font-bold text-dna-forest leading-[1.15] tracking-[-0.01em]">
      {title}
    </h2>
    {subtitle && (
      <p
        className={cn(
          'mt-4 text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl',
          align === 'center' && 'mx-auto',
        )}
      >
        {subtitle}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Day card with expandable detail
// ─────────────────────────────────────────────────────────────

const DayCard: React.FC<{
  day: typeof DAYS[number];
  defaultOpen?: boolean;
}> = ({ day, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const colorClass =
    day.color === 'connect'
      ? 'bg-dna-emerald'
      : day.color === 'collaborate'
        ? 'bg-dna-forest'
        : 'bg-dna-ocean';

  return (
    <Card className="snap-start shrink-0 w-[85vw] sm:w-[420px] lg:w-auto rounded-dna-xl border-dna-stone shadow-dna-1 hover:shadow-dna-2 transition-shadow overflow-hidden">
      <div className={cn('h-1.5 w-full', colorClass)} aria-hidden />
      <CardContent className="p-6 lg:p-8">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {day.day}
        </p>
        <h3 className="font-heritage text-2xl lg:text-3xl font-bold text-dna-forest mt-2">
          {day.pillar}
        </h3>
        <p className="mt-3 text-base lg:text-lg text-foreground/80 leading-relaxed">
          {day.summary}
        </p>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`day-${day.day.replace(/\s/g, '-').toLowerCase()}-detail`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-dna-emerald hover:text-dna-emerald-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dna-emerald focus-visible:ring-offset-2 rounded-dna-sm"
        >
          {open ? 'Hide details' : 'See what happens'}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        <div
          id={`day-${day.day.replace(/\s/g, '-').toLowerCase()}-detail`}
          hidden={!open}
          className="mt-5 pt-5 border-t border-dna-stone"
        >
          <ul className="space-y-3">
            {day.details.map((d, i) => (
              <li key={i} className="flex gap-3 text-sm lg:text-base text-foreground/85 leading-relaxed">
                <span
                  className={cn('mt-2 h-1.5 w-1.5 rounded-full shrink-0', colorClass)}
                  aria-hidden
                />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

const Roadmap: React.FC = () => {
  useScrollToTop();
  const reducedMotion = useReducedMotion();
  const aboutRef = useRef<HTMLDivElement | null>(null);

  // Smooth-scroll to "What ROADMAP Is"
  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  // Force a layout pass for Leaflet on mount (it sometimes needs an
  // invalidateSize() trigger when rendered inside a long page).
  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
    return () => window.clearTimeout(t);
  }, []);

  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: "ROADMAP 2026 | DNA's Annual Diaspora Mobilization Event",
    description:
      'DNA\'s annual flagship event for the African diaspora. Pan-African, pan-sector, in person, once a year.',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: VENUE.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: VENUE.street,
        addressLocality: 'Los Angeles',
        addressRegion: 'CA',
        postalCode: '90001',
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: VENUE.lat,
        longitude: VENUE.lng,
      },
    },
    image: `${config.APP_URL}/og-roadmap.png`,
    organizer: {
      '@type': 'Organization',
      name: 'Diaspora Network of Africa',
      url: config.APP_URL,
    },
    url: `${config.APP_URL}/roadmap`,
  };

  const fadeIn = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.5, ease: 'easeOut' as const },
      };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ROADMAP 2026 | DNA's Annual Diaspora Mobilization Event | Los Angeles</title>
        <meta
          name="description"
          content="December 2026, Los Angeles. DNA's annual flagship event for the African diaspora. Pan-African, pan-sector, in person, once a year."
        />
        <link rel="canonical" href={`${config.APP_URL}/roadmap`} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="ROADMAP 2026 | DNA's Annual Diaspora Mobilization Event"
        />
        <meta
          property="og:description"
          content="December 2026, Los Angeles. Pan-African, pan-sector, in person, once a year."
        />
        <meta property="og:url" content={`${config.APP_URL}/roadmap`} />
        <meta property="og:site_name" content="Diaspora Network of Africa" />
        <meta property="og:image" content={`${config.APP_URL}/og-roadmap.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="ROADMAP 2026 | DNA's Annual Diaspora Mobilization Event"
        />
        <meta
          name="twitter:description"
          content="December 2026, Los Angeles. Pan-African, pan-sector, in person, once a year."
        />
        <meta name="twitter:image" content={`${config.APP_URL}/og-roadmap.png`} />

        <script type="application/ld+json">{JSON.stringify(eventSchema)}</script>
      </Helmet>

      <UnifiedHeader />

      <main id="main" className="pt-16">
        {/* ───────── 1. HERO ───────── */}
        <PatternBackground
          pattern="kente"
          intensity="moderate"
          className="relative bg-gradient-to-br from-dna-emerald-subtle via-background to-dna-copper-light/40"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
            <motion.div {...fadeIn}>
              {/* Powered by DNA lockup */}
              <div className="inline-flex items-center gap-2 rounded-dna-xl bg-dna-emerald/10 px-3 py-1.5 mb-6">
                <span className="h-2 w-2 rounded-full bg-dna-emerald" aria-hidden />
                <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-dna-emerald-dark">
                  Powered by DNA
                </span>
              </div>

              {/* ROADMAP wordmark */}
              <h1
                className="font-heritage font-bold text-dna-forest leading-none tracking-[-0.02em] text-[64px] xs:text-[76px] sm:text-[112px] lg:text-[160px] xl:text-[200px]"
                aria-label="ROADMAP"
              >
                ROADMAP
              </h1>

              {/* Headline */}
              <p className="mt-6 lg:mt-8 font-heritage text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-dna-forest font-semibold leading-[1.2] max-w-3xl">
                Where the diaspora gathers to mobilize.
              </p>

              {/* Subhead */}
              <p className="mt-4 lg:mt-5 text-base sm:text-lg lg:text-xl text-foreground/80 leading-relaxed max-w-2xl">
                DNA's annual flagship event. Pan-African. Pan-sector. Once a year. In person.
              </p>

              {/* Key facts row */}
              <ul
                className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-6 sm:gap-y-3"
                aria-label="Key facts"
              >
                {KEY_FACTS.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-dna-forest"
                  >
                    <Icon className="h-5 w-5 text-dna-copper" aria-hidden />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="mt-8 lg:mt-10 max-w-xl">
                <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-dna-forest/80 mb-3">
                  Notify me when registration opens
                </p>
                <EmailCapture
                  source="hero"
                  ariaLabel="Get notified when ROADMAP 2026 registration opens"
                  buttonLabel="Notify me"
                />

                <button
                  type="button"
                  onClick={scrollToAbout}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-dna-emerald hover:text-dna-emerald-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dna-emerald focus-visible:ring-offset-2 rounded-dna-sm"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </motion.div>
          </div>
        </PatternBackground>

        {/* ───────── 2. WHAT ROADMAP IS ───────── */}
        <section
          ref={aboutRef}
          id="about"
          aria-labelledby="about-heading"
          className="bg-background"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-12">
            <motion.div {...fadeIn}>
              <SectionHeading
                eyebrow="What ROADMAP Is"
                title="One room. One weekend. One job."
              />
              <h2 id="about-heading" className="sr-only">
                What ROADMAP is
              </h2>

              <div className="space-y-6 text-lg lg:text-xl text-foreground/85 leading-relaxed">
                <p>
                  ROADMAP is the annual gathering of the global African diaspora and the
                  partners who want to move with us. It is the single weekend each year
                  where the network DNA builds online steps off the screen and into a
                  shared room.
                </p>
                <p>
                  The name says the work.{' '}
                  <strong className="text-dna-forest font-semibold">
                    R
                  </strong>
                  eturn{' '}
                  <strong className="text-dna-forest font-semibold">O</strong>f the{' '}
                  <strong className="text-dna-forest font-semibold">A</strong>frican{' '}
                  <strong className="text-dna-forest font-semibold">D</strong>iaspora to{' '}
                  <strong className="text-dna-forest font-semibold">M</strong>obilize in
                  support of{' '}
                  <strong className="text-dna-forest font-semibold">A</strong>frica's{' '}
                  <strong className="text-dna-forest font-semibold">P</strong>rogress.
                  Not a return as nostalgia. A return as commitment, with a calendar and
                  a venue.
                </p>
                <p>
                  Three days. Five C's made physical. Connect on Day 1. Collaborate and
                  Contribute on Day 2. Convey on Day 3. By the closing ceremony, the
                  room has produced commitments, partnerships, and a public record of
                  what the diaspora chose to mobilize this year.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ───────── 3. FIVE C'S MADE PHYSICAL ───────── */}
        <PatternBackground
          pattern="adinkra"
          intensity="subtle"
          className="bg-dna-sand-light/60"
        >
          <section aria-labelledby="days-heading" className="py-16 lg:py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeIn}>
                <SectionHeading
                  eyebrow="The Five C's, Made Physical"
                  title="A three-day arc, by design."
                  subtitle="Each day moves the room from meeting to making to telling. Tap a card to see what happens."
                />
                <h2 id="days-heading" className="sr-only">
                  The Five C's, Made Physical
                </h2>
              </motion.div>

              {/* Mobile: horizontal scroll. Desktop: grid. */}
              <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory">
                <div className="flex gap-4 pb-4">
                  {DAYS.map((d, i) => (
                    <DayCard key={d.day} day={d} defaultOpen={i === 0} />
                  ))}
                </div>
              </div>
              <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                {DAYS.map((d) => (
                  <DayCard key={d.day} day={d} defaultOpen />
                ))}
              </div>
            </div>
          </section>
        </PatternBackground>

        {/* ───────── 4. INAUGURAL DETAILS ───────── */}
        <section aria-labelledby="venue-heading" className="bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-12">
            <motion.div {...fadeIn}>
              <SectionHeading
                eyebrow="Inaugural Details"
                title="December 2026, in South Los Angeles."
              />
              <h2 id="venue-heading" className="sr-only">
                Inaugural details
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <motion.div {...fadeIn} className="space-y-6">
                <Card className="rounded-dna-xl border-dna-stone shadow-dna-1">
                  <CardContent className="p-6 lg:p-8 space-y-5">
                    <div className="flex gap-4">
                      <Calendar className="h-6 w-6 text-dna-copper shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Date
                        </p>
                        <p className="text-lg font-semibold text-dna-forest mt-0.5">
                          December 2026
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Specific dates to be announced. Subscribe above to be the first to know.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <MapPin className="h-6 w-6 text-dna-copper shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          City
                        </p>
                        <p className="text-lg font-semibold text-dna-forest mt-0.5">
                          Los Angeles, California
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Building2 className="h-6 w-6 text-dna-copper shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Venue
                        </p>
                        <p className="text-lg font-semibold text-dna-forest mt-0.5">
                          {VENUE.name}
                        </p>
                        <p className="text-sm text-foreground/80 mt-0.5">
                          {VENUE.street}
                          <br />
                          {VENUE.city}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="prose prose-base max-w-none text-foreground/85 leading-relaxed">
                  <p>
                    The inaugural ROADMAP convenes at{' '}
                    <strong className="text-dna-forest font-semibold">The Beehive</strong>,
                    SoLa Impact's Black-owned Opportunity Zone business campus in South
                    Los Angeles. The campus sits in the historic Goodyear Tract, a
                    neighborhood whose industrial legacy has been reimagined as a hub
                    for Black-led enterprise.
                  </p>
                  <p className="mt-4">
                    The Beehive is the first OZ business campus in the nation, and one of
                    the most intentional examples of Black wealth-building infrastructure
                    in the United States. Hosting our inaugural here is the message: the
                    diaspora mobilizes from places we own, to places we are building.
                  </p>
                </div>
              </motion.div>

              <motion.div {...fadeIn}>
                <div
                  className="rounded-dna-xl overflow-hidden border border-dna-stone shadow-dna-2 h-[420px] lg:h-[560px]"
                  role="region"
                  aria-label={`Map showing ${VENUE.name} at ${VENUE.street}, ${VENUE.city}`}
                >
                  <MapContainer
                    center={[VENUE.lat, VENUE.lng]}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="w-full h-full z-0"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[VENUE.lat, VENUE.lng]} icon={venueIcon}>
                      <Popup>
                        <strong>{VENUE.name}</strong>
                        <br />
                        {VENUE.street}
                        <br />
                        {VENUE.city}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ───────── 5. THE MOBILIZATION JOB ───────── */}
        <PatternBackground
          pattern="mudcloth"
          intensity="subtle"
          className="bg-dna-emerald-subtle/40"
        >
          <section
            aria-labelledby="mobilization-heading"
            className="py-16 lg:py-12"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeIn}>
                <SectionHeading
                  eyebrow="The Mobilization Job"
                  title="What you will do in the room."
                  subtitle="ROADMAP is participatory by design. Here is the work the room expects of you."
                />
                <h2 id="mobilization-heading" className="sr-only">
                  The mobilization job
                </h2>
              </motion.div>

              <ul className="space-y-4 lg:space-y-5">
                {MOBILIZATION_BULLETS.map(({ icon: Icon, pillar, body }) => (
                  <motion.li
                    key={pillar}
                    {...fadeIn}
                    className="flex gap-4 lg:gap-5 p-5 lg:p-6 rounded-dna-xl bg-white border border-dna-stone shadow-dna-1"
                  >
                    <div className="shrink-0 h-12 w-12 rounded-dna-md bg-dna-emerald/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-dna-emerald" aria-hidden />
                    </div>
                    <div>
                      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-dna-copper">
                        {pillar}
                      </p>
                      <p className="mt-1 text-base lg:text-lg text-foreground/85 leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>
        </PatternBackground>

        {/* ───────── 6. WHO'S IN THE ROOM ───────── */}
        <section aria-labelledby="audience-heading" className="bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-12">
            <motion.div {...fadeIn}>
              <SectionHeading
                eyebrow="Who's in the Room"
                title="Five tiers of attendance, one shared agenda."
              />
              <h2 id="audience-heading" className="sr-only">
                Who's in the room
              </h2>
            </motion.div>

            <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {AUDIENCE_TIERS.map((tier, i) => (
                <motion.li
                  key={tier.title}
                  {...fadeIn}
                  className="rounded-dna-xl bg-white border border-dna-stone p-6 lg:p-7 shadow-dna-1 hover:shadow-dna-2 transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="h-8 w-8 rounded-full bg-dna-forest text-white font-heritage font-bold text-sm flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h3 className="font-heritage text-lg lg:text-xl font-semibold text-dna-forest leading-tight">
                      {tier.title}
                    </h3>
                  </div>
                  <p className="text-sm lg:text-base text-foreground/80 leading-relaxed">
                    {tier.body}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── 7. PARTNERS ───────── */}
        <section aria-labelledby="partners-heading" className="bg-dna-sand-light/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-12">
            <motion.div {...fadeIn}>
              <SectionHeading eyebrow="Partners & Sponsors" title="Built with serious partners." />
              <h2 id="partners-heading" className="sr-only">
                Partners and sponsors
              </h2>
            </motion.div>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-8"
              aria-label="Partner placeholders"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="aspect-[3/2] rounded-dna-xl border border-dashed border-dna-stone bg-white/60"
                />
              ))}
            </div>

            <div className="rounded-dna-xl bg-white border border-dna-stone p-6 lg:p-8 text-center">
              <p className="text-base lg:text-lg text-foreground/80">
                Partners and sponsors announced as confirmed.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Partnership inquiries:{' '}
                <a
                  href={`mailto:${PARTNERSHIP_EMAIL}?subject=ROADMAP%202026%20Partnership%20Inquiry`}
                  className="font-semibold text-dna-emerald hover:text-dna-emerald-dark underline underline-offset-4"
                >
                  {PARTNERSHIP_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ───────── 8. SPEAKERS ───────── */}
        <section aria-labelledby="speakers-heading" className="bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-12">
            <motion.div {...fadeIn}>
              <SectionHeading eyebrow="Speakers" title="The voices in the room." />
              <h2 id="speakers-heading" className="sr-only">
                Speakers
              </h2>
            </motion.div>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 mb-8"
              aria-label="Speaker placeholders"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="aspect-square rounded-dna-xl border border-dashed border-dna-stone bg-dna-sand-light/60"
                />
              ))}
            </div>

            <p className="text-center text-base lg:text-lg text-foreground/80">
              Speakers announced beginning July 2026.
            </p>
          </div>
        </section>

        {/* ───────── 9. FAQ ───────── */}
        <PatternBackground
          pattern="ndebele"
          intensity="subtle"
          className="bg-dna-sand-light/60"
        >
          <section aria-labelledby="faq-heading" className="py-16 lg:py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeIn}>
                <SectionHeading
                  eyebrow="Frequently Asked"
                  title="Answers to the questions we hear most."
                />
                <h2 id="faq-heading" className="sr-only">
                  Frequently asked questions
                </h2>
              </motion.div>

              <Accordion type="single" collapsible className="bg-white rounded-dna-xl border border-dna-stone shadow-dna-1 px-4 lg:px-6">
                {FAQS.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`faq-${i}`}
                    className={cn(i === FAQS.length - 1 && 'border-b-0')}
                  >
                    <AccordionTrigger className="text-left font-heritage text-base lg:text-lg font-semibold text-dna-forest hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-foreground/80 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </PatternBackground>

        {/* ───────── 10. FOOTER CTA ───────── */}
        <section
          aria-labelledby="cta-heading"
          className="bg-dna-forest text-white"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-12 text-center">
            <motion.div {...fadeIn}>
              <Badge className="bg-white/15 text-white hover:bg-white/15 mb-5 font-ui text-[11px] font-semibold uppercase tracking-[0.18em] px-3 py-1.5 border-0">
                Powered by DNA
              </Badge>
              <h2
                id="cta-heading"
                className="font-heritage text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]"
              >
                Be the first to know when registration opens.
              </h2>
              <p className="mt-4 text-base lg:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                We send one email when registration goes live, then a short stream of
                ROADMAP-only updates. No noise.
              </p>

              <div className="mt-8 max-w-xl mx-auto">
                <EmailCapture
                  source="footer-cta"
                  variant="dark"
                  ariaLabel="Be the first to know when ROADMAP 2026 registration opens"
                  buttonLabel="Notify me"
                />
              </div>

              <p className="mt-8 inline-flex items-center gap-2 text-white/70 text-sm">
                <Mail className="h-4 w-4" aria-hidden />
                Partnership inquiries:{' '}
                <a
                  href={`mailto:${PARTNERSHIP_EMAIL}?subject=ROADMAP%202026%20Partnership%20Inquiry`}
                  className="underline underline-offset-4 hover:text-white"
                >
                  {PARTNERSHIP_EMAIL}
                </a>
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Roadmap;
