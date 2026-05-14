import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, Handshake, Shield, Globe, ArrowRight, Heart, Users, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { Adinkrahene } from '@/components/icons/adinkra';

const features = [
  {
    icon: DollarSign,
    title: 'Investment Opportunities',
    description: 'Discover vetted investment opportunities aligned with your thesis, from startups to established ventures focused on African development.'
  },
  {
    icon: Handshake,
    title: 'Professional Services',
    description: 'Access diaspora professionals offering legal, consulting, technical, and specialized services with cultural understanding built in.'
  },
  {
    icon: Globe,
    title: 'Business Partnerships',
    description: 'Find suppliers, distributors, and partners who bridge diaspora networks with continental opportunities.'
  },
  {
    icon: Shield,
    title: 'Trust Infrastructure',
    description: 'Transact with confidence. Sellers are verified through DNA community engagement, project completion, and platform reputation.'
  }
];

const flowItems = [
  { from: 'Post a need', to: 'Receive qualified offers from verified providers' },
  { from: 'Complete transaction', to: 'Seller becomes trusted collaborator' },
  { from: 'Share experience', to: 'Help others make informed decisions' },
  { from: 'Grow reputation', to: 'Access premium opportunities' }
];

export default function ComingSoonContribute() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dna-emerald/10 via-background to-dna-amber/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--dna-emerald)/0.15),transparent_50%)]" />
        
        <div className="container max-w-5xl mx-auto px-4 py-12 md:py-12 relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-center space-y-6"
          >
            <Badge variant="outline" className="bg-dna-amber/10 text-dna-amber border-dna-amber/30 px-4 py-1">
              Coming After Beta
            </Badge>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-dna-emerald to-dna-emerald/70">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              DNA <span className="text-dna-emerald">Contribute</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Exchange value through a purpose-driven marketplace. Infrastructure for the complex, trust-sensitive transactions the diaspora needs: investment, services, partnerships, and commerce designed for cross-border success.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((feature, idx) => (
            <Card key={idx} className="border-border/50 hover:border-dna-emerald/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-dna-emerald/10">
                    <feature.icon className="h-5 w-5 text-dna-emerald" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* The Liquidity Effect */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-h2 font-serif text-foreground mb-3">
            The Liquidity Effect
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            As marketplace activity grows, match quality improves for everyone. Your posted need reaches more qualified responders; your offering finds more appropriate buyers. The diaspora economy gains infrastructure it's never had.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
          className="space-y-4"
        >
          {flowItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 justify-center">
              <div className="flex-1 max-w-[220px] text-right">
                <span className="text-sm font-medium text-foreground">{item.from}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-dna-amber flex-shrink-0" />
              <div className="flex-1 max-w-[220px] text-left">
                <span className="text-sm text-muted-foreground">{item.to}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Reputation Matters */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.45 }}
        >
          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-dna-amber/10 flex-shrink-0">
                  <Scale className="h-5 w-5 text-dna-amber" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Your DNA Reputation Powers Trust</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlike anonymous marketplaces, your Contribute credibility is built on your entire DNA presence: your connections, event participation, project track record, and content engagement. This creates trust signals unavailable anywhere else, reducing friction for cross-border transactions that have historically been too risky or complicated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-dna-emerald/10 to-dna-amber/5 border-dna-emerald/20">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-dna-emerald/20">
                  <Adinkrahene className="h-6 w-6 text-dna-emerald" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Build Your Reputation Now
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your activity during beta builds the credibility that will power your marketplace success. Connect, engage, and share. Each action contributes to your DNA reputation.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/dna/connect/discover')}
                  className="bg-dna-emerald hover:bg-dna-emerald/90 text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Grow Your Network
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dna/convey')}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Share Your Story
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <MobileBottomNav />
    </div>
  );
}
