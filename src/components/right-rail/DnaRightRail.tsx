/**
 * DnaRightRail — composes the four right-rail surfaces in PRD order.
 */
import React from 'react';
import { PulseCompass } from './PulseCompass';
import { DiaDailyBrief } from './DiaDailyBrief';
import { TrendingInDna } from './TrendingInDna';
import { AskDiaCta } from './AskDiaCta';

export const DnaRightRail: React.FC = () => {
  return (
    <div className="space-y-3">
      <PulseCompass />
      <DiaDailyBrief />
      <TrendingInDna />
      <AskDiaCta />

      <div className="text-[11px] text-muted-foreground px-1 pt-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="/about" className="hover:underline">About</a>
          <span>·</span>
          <a href="/privacy-policy" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/terms-of-service" className="hover:underline">Terms</a>
        </div>
        <p className="mt-1.5">DNA © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default DnaRightRail;
