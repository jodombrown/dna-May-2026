import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { features } from "@/config/features.config";
import { featureContentBySlug } from "@/data/featureContent";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function FeatureDetail() {
  useScrollToTop();
  const { slug } = useParams<{ slug: string }>();

  const feature = features.find((f) => f.slug === slug);
  const content = slug ? featureContentBySlug[slug] : null;

  if (!feature || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Feature Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The feature you're looking for doesn't exist or hasn't been documented yet.
          </p>
          <Link to="/documentation/features" className="text-dna-emerald hover:text-dna-forest font-medium">
            ← Back to Features Hub
          </Link>
        </div>
      </div>
    );
  }

  const cleanText = (text: string) => text.replace(/—/g, "-").replace(/–/g, "-");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-dna-emerald text-white";
      case "beta":
        return "bg-dna-copper text-white";
      case "coming-soon":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-dna-forest to-dna-emerald text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/documentation/features"
            className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Features Hub
          </Link>
          
          <div className="mb-4">
            <Badge className={getStatusColor(feature.status)}>
              {feature.status === "live" ? "Live" : feature.status === "beta" ? "Beta" : "Coming Soon"}
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.hero.title}</h1>
          <p className="text-xl text-white/90 mb-4">{cleanText(content.hero.oneLiner)}</p>
          <p className="text-lg text-white/80">
            <strong>Who it's for:</strong> {cleanText(content.hero.whoItsFor)}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* What it is */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">What is {feature.name}?</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{cleanText(content.whatItIs)}</p>
        </section>

        {/* What you can do */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground">What you can do with {feature.name}</h2>
          <div className="space-y-4">
            {content.whatYouCanDo.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-dna-emerald flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{cleanText(item)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground">How {feature.name} works behind the scenes</h2>
          <p className="text-muted-foreground mb-4">We keep the explanation simple, but the logic is thoughtful:</p>
          <div className="space-y-4">
            {content.howItWorks.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-dna-emerald flex-shrink-0 mt-2" />
                <p className="text-muted-foreground">{cleanText(item)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step by step */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground">How to get started with {feature.name}</h2>
          <div className="space-y-6">
            {content.stepByStep.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{cleanText(section.title)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-3">
                    {section.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-muted-foreground pl-2">
                        {cleanText(step)}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground">How {feature.name} might look in real life</h2>
          <div className="space-y-4">
            {content.examples.map((example, index) => (
              <Card key={index} className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">{cleanText(example.title)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{cleanText(example.description)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Related Features */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Related features</h2>
          <p className="text-muted-foreground mb-6">
            {feature.name} works closely with other parts of DNA:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.relatedFeatures.map((related, index) => {
              const Icon = related.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-dna-emerald" />
                      <CardTitle className="text-lg">{cleanText(related.name)}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{cleanText(related.description)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {content.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{cleanText(faq.question)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{cleanText(faq.answer)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-dna-forest to-dna-emerald text-white p-8 rounded-lg text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to join?</h3>
          <p className="mb-6">Join DNA today and start connecting with the global African diaspora.</p>
          <Link
            to="/auth?mode=signup"
            className="inline-block bg-white text-dna-forest px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Join Now
          </Link>
        </div>
      </div>
    </div>
  );
}
