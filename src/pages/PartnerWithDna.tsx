import { Link, useNavigate } from 'react-router-dom';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { partnerPageContent, fiveCsContent } from '@/config/partnerContent';
import { partnerSectors } from '@/config/partnerSectors';
import { useAnalytics } from '@/hooks/useAnalytics';

const PartnerWithDna = () => {
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const handleCTAClick = (ctaName: string, href?: string) => {
    trackEvent('partner_page_cta_clicked', { 
      cta_name: ctaName,
      page: 'partner-with-dna'
    });
    if (href) {
      if (href.startsWith('#')) {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      } else if (href.startsWith('/')) {
        navigate(href);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-mint/10 via-background to-dna-copper/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                {partnerPageContent.hero.headline}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                {partnerPageContent.hero.subheadline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <EnhancedButton 
                  variant="dna" 
                  size="lg"
                  onClick={() => handleCTAClick('explore-pathways', '#who-we-partner')}
                >
                  Explore Partnership Pathways
                </EnhancedButton>
                <EnhancedButton 
                  variant="dna-outline" 
                  size="lg"
                  asChild
                  onClick={() => handleCTAClick('book-call', '/partner-with-dna/start#call')}
                >
                  <Link to="/partner-with-dna/start#call">
                    Book a Strategic Call
                  </Link>
                </EnhancedButton>
                <EnhancedButton 
                  variant="outline" 
                  size="lg"
                  asChild
                  onClick={() => handleCTAClick('join-dna', '/waitlist')}
                >
                  <Link to="/waitlist">
                    Join the Waitlist
                  </Link>
                </EnhancedButton>
              </div>
            </div>
            <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-dna-emerald/20 to-dna-copper/20 rounded-lg flex items-center justify-center">
              {partnerPageContent.hero.heroImageUrl ? (
                <img 
                  src={partnerPageContent.hero.heroImageUrl} 
                  alt={partnerPageContent.hero.heroImageAlt}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-sm text-muted-foreground italic">
                    Hero image placeholder
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
            {partnerPageContent.whyPartner.title}
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-lg text-muted-foreground mb-6">
                {partnerPageContent.whyPartner.problem}
              </p>
              <p className="text-lg font-medium">
                {partnerPageContent.whyPartner.solution}
              </p>
            </div>
            <div className="relative h-64 lg:h-full bg-gradient-to-br from-dna-mint/20 to-dna-emerald/20 rounded-xl flex items-center justify-center">
              {partnerPageContent.whyPartner.imageUrl ? (
                <img 
                  src={partnerPageContent.whyPartner.imageUrl} 
                  alt={partnerPageContent.whyPartner.imageAlt}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-sm text-muted-foreground italic">
                    5C Mobilization Engine visual placeholder
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {partnerPageContent.whyPartner.values.map((value, index) => (
              <div key={index} className="p-6 border border-border rounded-lg hover:border-dna-emerald transition-colors">
                <h3 className="font-bold mb-2 text-dna-emerald">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5Cs Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-mint/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            How DNA Works With Partners
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {fiveCsContent.map((c) => (
              <div key={c.id} className="p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-dna-emerald">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors Grid */}
      <section id="who-we-partner" className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Who We Partner With
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerSectors.map((sector) => (
              <Link
                key={sector.slug}
                to={`/partner-with-dna/sectors/${sector.slug}`}
                className="group p-6 bg-card border border-border rounded-lg hover:border-dna-emerald hover:shadow-lg transition-all"
                onClick={() => trackEvent('partner_page_cta_clicked', { cta_name: 'view-sector', sector: sector.slug })}
              >
                <div className="h-12 w-12 mb-4 bg-gradient-to-br from-dna-emerald/20 to-dna-copper/20 rounded-lg flex items-center justify-center">
                  {sector.iconImageUrl ? (
                    <img src={sector.iconImageUrl} alt={sector.iconAlt} className="w-8 h-8" />
                  ) : (
                    <div className="w-8 h-8 bg-dna-emerald/30 rounded" />
                  )}
                </div>
                <h3 className="font-bold mb-2 group-hover:text-dna-emerald transition-colors">
                  {sector.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {sector.shortDescription}
                </p>
                <span className="text-sm text-dna-emerald font-medium">
                  View Sector →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Advantage */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-copper/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            {partnerPageContent.advantage.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {partnerPageContent.advantage.items.map((item, index) => (
              <div key={index} className="p-8 bg-card border border-border rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-dna-emerald">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-emerald/10 via-background to-dna-copper/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build with Us?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join leaders across the world creating Africa's next chapter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <EnhancedButton 
              variant="dna" 
              size="lg"
              asChild
              onClick={() => handleCTAClick('book-partnership-call', '/partner-with-dna/start#call')}
            >
              <Link to="/partner-with-dna/start#call">
                Book a Partnership Call
              </Link>
            </EnhancedButton>
            <EnhancedButton 
              variant="dna-outline" 
              size="lg"
              asChild
              onClick={() => handleCTAClick('submit-partnership-form', '/partner-with-dna/start#form')}
            >
              <Link to="/partner-with-dna/start#form">
                Submit a Partnership Form
              </Link>
            </EnhancedButton>
            <EnhancedButton 
              variant="outline" 
              size="lg"
              asChild
              onClick={() => handleCTAClick('join-now', '/waitlist')}
            >
              <Link to="/waitlist">
                Join the Waitlist
              </Link>
            </EnhancedButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnerWithDna;
