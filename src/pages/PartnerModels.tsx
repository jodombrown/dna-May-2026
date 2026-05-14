import { Link, useNavigate } from 'react-router-dom';
import { partnershipModels } from '@/config/partnerModels';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { useAnalytics } from '@/hooks/useAnalytics';

const PartnerModels = () => {
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const handleCTAClick = (href?: string) => {
    trackEvent('partner_models_cta_clicked', { 
      page: 'partner-models'
    });
    if (href) {
      if (href.startsWith('/')) {
        navigate(href);
      } else {
        window.open(href, '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-mint/10 via-background to-dna-copper/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Partnership Models
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Choose the partnership structure that aligns with your goals, capacity, and timeline.
          </p>
        </div>
      </section>

      {/* Models Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partnershipModels.map((model) => (
              <div 
                key={model.id} 
                className="p-8 bg-card border border-border rounded-lg hover:border-dna-emerald hover:shadow-lg transition-all"
              >
                <h3 className="text-2xl font-bold mb-4 text-dna-emerald">
                  {model.name}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {model.purpose}
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide">
                      Partner Provides
                    </h4>
                    <ul className="space-y-2">
                      {model.partnerProvides.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-dna-emerald mt-1">✓</span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide">
                      DNA Provides
                    </h4>
                    <ul className="space-y-2">
                      {model.dnaProvides.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-dna-copper mt-1">→</span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide">
                      Use Cases
                    </h4>
                    <ul className="space-y-2">
                      {model.useCases.map((useCase, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm">
                      <span className="font-medium">Timeline:</span>{' '}
                      <span className="text-muted-foreground">{model.timeHorizon}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-emerald/10 via-background to-dna-copper/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Not Sure Which Model Fits?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start a conversation with our team to explore the best partnership approach.
          </p>
          <EnhancedButton 
            variant="dna" 
            size="lg" 
            asChild
            onClick={() => handleCTAClick('/partner-with-dna/start')}
          >
            <Link to="/partner-with-dna/start">
              Start a Conversation
            </Link>
          </EnhancedButton>
        </div>
      </section>
    </div>
  );
};

export default PartnerModels;
