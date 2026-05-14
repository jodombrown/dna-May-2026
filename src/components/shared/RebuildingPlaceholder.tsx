import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type RebuildingModule = 'collaborate' | 'contribute';

const MODULE_COPY: Record<RebuildingModule, {
  hero: string;
  capModule: string;
  body: string;
  cardTitle: string;
  cardSubtitle: string;
  pageBack: string;
  pageBackHref: string;
}> = {
  collaborate: {
    hero: "COLLABORATE is being reimagined.",
    capModule: 'COLLABORATE',
    body:
      "We're rebuilding the way the diaspora builds together. Spaces — where capital, expertise, networks, and resources circulate — are entering a new chapter.\n\nWhat's coming will honor the same Five C's principle: every collaboration you create here circulates value across CONNECT, CONVENE, CONTRIBUTE, and CONVEY. The connections you've already made remain intact.\n\nStay close. The next version of COLLABORATE arrives soon.",
    cardTitle: "We're rebuilding Spaces",
    cardSubtitle:
      "DNA's COLLABORATE module is being reimagined. Space creation will return shortly.",
    pageBack: 'Return to /collaborate',
    pageBackHref: '/collaborate',
  },
  contribute: {
    hero: "CONTRIBUTE is being reimagined.",
    capModule: 'CONTRIBUTE',
    body:
      "Opportunities — the marketplace where the diaspora exchanges value with Africa — are entering a new chapter.\n\nWhat's coming will honor the same Five C's principle: every opportunity you post or apply to here circulates across CONNECT, CONVENE, COLLABORATE, and CONVEY. Your profile remains your application artifact.\n\nStay close. The next version of CONTRIBUTE arrives soon.",
    cardTitle: "We're rebuilding Opportunities",
    cardSubtitle:
      "DNA's CONTRIBUTE module is being reimagined. Opportunity posting will return shortly.",
    pageBack: 'Return to /contribute',
    pageBackHref: '/contribute',
  },
};

interface RebuildingCardProps {
  module: RebuildingModule;
  onDismiss?: () => void;
}

export function RebuildingCard({ module, onDismiss }: RebuildingCardProps) {
  const copy = MODULE_COPY[module];
  return (
    <Card
      className="border-l-4 p-6 bg-[#4A8D77]/5"
      style={{ borderLeftColor: '#4A8D77' }}
      role="status"
      aria-live="polite"
    >
      <h3 className="text-lg font-semibold text-foreground">{copy.cardTitle}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{copy.cardSubtitle}</p>
      {onDismiss && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onDismiss}
            className="border-[#4A8D77] text-[#4A8D77] hover:bg-[#4A8D77] hover:text-white"
          >
            Got it
          </Button>
        </div>
      )}
    </Card>
  );
}

interface RebuildingDetailPlaceholderProps {
  module: RebuildingModule;
}

export function RebuildingDetailPlaceholder({ module }: RebuildingDetailPlaceholderProps) {
  const copy = MODULE_COPY[module];
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <Card
        className="border-l-4 p-6 sm:p-8 bg-[#4A8D77]/5"
        style={{ borderLeftColor: '#4A8D77' }}
      >
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          This page is being rebuilt.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {copy.cardSubtitle}
        </p>
        <div className="mt-6">
          <Link
            to={copy.pageBackHref}
            className="inline-flex items-center text-sm font-medium text-[#4A8D77] hover:underline"
          >
            ← {copy.pageBack}
          </Link>
        </div>
      </Card>
    </div>
  );
}

interface RebuildingLandingProps {
  module: RebuildingModule;
}

export function RebuildingLanding({ module }: RebuildingLandingProps) {
  const copy = MODULE_COPY[module];
  const paragraphs = copy.body.split('\n\n');
  return (
    <main className="min-h-[60vh] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-12">
        <Card
          className="border-l-4 p-6 sm:p-10 bg-[#4A8D77]/5"
          style={{ borderLeftColor: '#4A8D77' }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {copy.hero}
          </h1>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/feed"
              className="inline-flex items-center text-sm font-medium text-[#4A8D77] hover:underline"
            >
              ← Back to your Feed
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
