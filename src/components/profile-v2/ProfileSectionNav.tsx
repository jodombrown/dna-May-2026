/**
 * Sticky sub-header for the public profile.
 * Appears once the hero scrolls out; highlights the active anchor as the
 * user scrolls; clicks scroll into view. Desktop/tablet only.
 */
import React, { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'activity', label: 'Activity' },
  { id: 'expertise', label: 'Expertise' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const ProfileSectionNav: React.FC = () => {
  const [active, setActive] = useState<SectionId>('about');

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el
    );
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id as SectionId);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Profile sections"
      className="hidden md:block sticky top-[var(--dna-header-height,64px)] z-30 -mx-2 mb-4 border-b border-border/40 bg-background/80 backdrop-blur-sm"
    >
      <div className="flex items-center gap-1 px-2 py-2">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => jump(s.id)}
              className={
                'rounded-lg px-3 py-1.5 text-caption transition-colors min-h-touch ' +
                (isActive
                  ? 'text-foreground font-medium bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60')
              }
              aria-current={isActive ? 'true' : undefined}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ProfileSectionNav;
