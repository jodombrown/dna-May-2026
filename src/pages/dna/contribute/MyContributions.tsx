/**
 * MyContributions — fulfiller-facing dashboard.
 * Phase 4 Group 1 scope: surface "My Offers".
 * Manifest + open needs sections will be re-added in a later sprint.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MyOffersSection } from '@/components/contribute/recognition/MyOffersSection';

export default function MyContributions() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-8">
      <Link
        to="/dna/contribute"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Contribute
      </Link>

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-[#2D6A4F] font-medium">
          Contribute
        </p>
        <h1 className="font-serif text-3xl text-foreground">My Contributions</h1>
        <p className="text-muted-foreground">
          Track the offers you've made and the recognition you've received.
        </p>
      </header>

      <MyOffersSection />
    </div>
  );
}
