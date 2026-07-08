import { useParams, Link } from 'react-router-dom';
import { getSectorBySlug } from '@/config/partnerSectors';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { useAnalytics } from '@/hooks/useAnalytics';

const PartnerSector = () => {
  const { slug } = useParams<{ slug: string }>();
  const sector = slug ? getSectorBySlug(slug) : undefined;
  const { trackEvent } = useAnalytics();

  if (!sector) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Sector Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The sector you're looking for doesn't exist.
          </p>
          <EnhancedButton variant="dna" asChild>
            <Link to="/partner-with-dna">
              View All Sectors
            </Link>
          </EnhancedButton>
        </div>
      </div>
    );
  }

  const handleCTAClick = () => {
    trackEvent('partner_sector_cta_clicked', { 
      sector: sector.slug,
      page: 'partner-sector'
    });
  };

  const fiveCLabels: Record<string, string> = {
    connect: 'CONNECT',
    convene: 'CONVENE',
    collaborate: 'COLLABORATE',
    contribute: 'CONTRIBUTE',
    convey: 'CONVEY',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-mint/10 via-background to-dna-copper/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {sector.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {sector.heroSubtitle}
              </p>
            </div>
            <div className="relative h-64 lg:h-96 bg-gradient-to-br from-dna-emerald/20 to-dna-copper/20 rounded-lg flex items-center justify-center">
              {sector.heroImageUrl ? (
                <img 
                  src={sector.heroImageUrl} 
                  alt={sector.heroImageAlt}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-sm text-muted-foreground italic">
                    Sector hero image placeholder
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5Cs for This Sector */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Your Role in the 5C Mobilization Engine
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Object.entries(sector.fiveCsBullets).map(([key, value]) => (
              <div key={key} className="p-6 bg-card border border-border rounded-lg">
                <h3 className="text-lg font-bold mb-3 text-dna-emerald uppercase">
                  {fiveCLabels[key] || key}
                </h3>
                <p className="text-sm text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-mint/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            How You Create Impact Through DNA
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {sector.roles.map((role, index) => (
              <div key={index} className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-dna-emerald rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{role.title}</h3>
                    <p className="text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Bring / Receive */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            What You Bring + What You Receive
          </h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-dna-emerald">What You Bring</h3>
              <ul className="space-y-4">
                {sector.brings.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-dna-emerald text-xl">✓</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-dna-copper">What You Receive</h3>
              <ul className="space-y-4">
                {sector.receives.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-dna-copper text-xl">→</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Models */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-copper/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Partnership Models for Your Sector
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {sector.partnershipModels.map((model, index) => (
              <div key={index} className="p-6 bg-card border border-border rounded-lg">
                <h3 className="text-xl font-bold mb-3">{model.name}</h3>
                <p className="text-muted-foreground">{model.shortDescription}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <EnhancedButton variant="outline" asChild>
              <Link to="/partner-with-dna/models">
                View All Partnership Models
              </Link>
            </EnhancedButton>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Programs & Initiatives You Can Join
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sector.programs.map((program, index) => (
              <div key={index} className="p-6 bg-card border border-border rounded-lg hover:border-dna-emerald transition-colors">
                <h3 className="font-bold mb-3">{program.name}</h3>
                <p className="text-sm text-muted-foreground">{program.shortDescription}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-emerald/10 via-background to-dna-copper/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {sector.ctaLabel}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Let's explore how DNA can accelerate your impact.
          </p>
          <EnhancedButton 
            variant="dna" 
            size="lg" 
            asChild
            onClick={handleCTAClick}
          >
            <Link to={sector.ctaLink}>
              Join Now
            </Link>
          </EnhancedButton>
        </div>
      </section>
    </div>
  );
};

export default PartnerSector;
