/**
 * DeclarationBody — renders the Affirmation declaration (shared core + role
 * extension) for a role. The words come from affirmation-ceremony.content
 * (INTERNAL VOICE); this component is only layout.
 *
 * Reused by the ceremony, pending, attest and affirmed-record surfaces.
 */

import React from 'react';
import {
  getCeremonyDeclaration,
  type AffirmRole,
  type CeremonySection,
} from '@/content/affirmation-ceremony.content';

const Section: React.FC<{ section: CeremonySection }> = ({ section }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium uppercase tracking-widest text-dna-copper">
      {section.heading}
    </p>
    <div className="space-y-1.5">
      {section.lines.map((line, i) => (
        <p
          key={i}
          className="text-lg sm:text-xl leading-relaxed text-dna-forest font-serif"
        >
          {line}
        </p>
      ))}
    </div>
  </div>
);

interface DeclarationBodyProps {
  role: AffirmRole;
  className?: string;
}

const DeclarationBody: React.FC<DeclarationBodyProps> = ({ role, className }) => {
  const declaration = getCeremonyDeclaration(role);
  return (
    <div className={`space-y-8 ${className ?? ''}`}>
      <Section section={declaration.core} />
      <Section section={declaration.extension} />
    </div>
  );
};

export default DeclarationBody;
