/**
 * RoadmapBanner — non-intrusive top strip that drives the landing page
 * (/) to /roadmap, the public marketing home for DNA's annual flagship event.
 *
 * - Dismissible per session (sessionStorage)
 * - Honors prefers-reduced-motion
 * - WCAG AA: keyboard reachable, accessible name on dismiss button
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'dna.roadmapBanner.dismissedAt';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const RoadmapBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissedAt) {
        setVisible(true);
        return;
      }
      const ts = parseInt(dismissedAt, 10);
      if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="ROADMAP 2026 announcement"
      className="bg-dna-forest text-white"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-dna-copper-light shrink-0" aria-hidden />
        <p className="text-sm sm:text-[15px] flex-1 min-w-0">
          <span className="font-semibold tracking-[0.04em] mr-2">ROADMAP 2026</span>
          <span className="text-white/80">
            DNA's annual flagship event lands in Los Angeles this December.{' '}
          </span>
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-dna-copper-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dna-forest rounded-sm"
          >
            Learn more
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss ROADMAP announcement"
          className="shrink-0 rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default RoadmapBanner;
