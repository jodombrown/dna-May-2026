import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Globe, Video, MapPin, Ticket, ArrowRight, Bell, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { Nkonsonkonson } from '@/components/icons/adinkra';

const features = [
  {
    icon: Calendar,
    title: 'Discover Events',
    description: 'Find gatherings aligned with your professional interests, geographic focus, and cultural background.'
  },
  {
    icon: Video,
    title: 'Hybrid Participation',
    description: 'Join events virtually or in-person, accommodating different time zones and travel realities.'
  },
  {
    icon: Users,
    title: 'See Who\'s Attending',
    description: 'Know which connections from DNA Connect are attending, maximizing relationship value at every event.'
  },
  {
    icon: MapPin,
    title: 'Host Your Own',
    description: 'Create and manage events with tools designed for diaspora-specific needs: multi-timezone scheduling, translation, cultural programming.'
  }
];

const flowItems = [
  { from: 'Attend an event', to: 'Meet professionals who share your mission' },
  { from: 'Build connections', to: 'Join collaborative projects together' },
  { from: 'Complete projects', to: 'Generate marketplace opportunities' },
  { from: 'Share learnings', to: 'Amplify your voice through Convey' }
];

export default function ComingSoonConvene() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dna-emerald/10 via-background to-dna-amber/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--dna-emerald)/0.15),transparent_50%)]" />
        
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
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              DNA <span className="text-dna-emerald">Convene</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Gather, learn, and build relationships that become action. From intimate virtual roundtables to major investment symposiums, transform scattered attendance into strategic community building.
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

      {/* How It Connects */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-h2 font-serif text-foreground mb-3">
            How Convene Connects to the Five C's
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Events are where relationships transform into action. Every gathering creates momentum that flows into your other DNA activities.
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
              <div className="flex-1 max-w-[200px] text-right">
                <span className="text-sm font-medium text-foreground">{item.from}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-dna-amber flex-shrink-0" />
              <div className="flex-1 max-w-[200px] text-left">
                <span className="text-sm text-muted-foreground">{item.to}</span>
              </div>
            </div>
          ))}
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
                  <Nkonsonkonson className="h-6 w-6 text-dna-emerald" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Get Ready for Convene
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  While Convene is in development, explore the features available now. Your connections and content will make Convene even more powerful when it launches.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/dna/connect/discover')}
                  className="bg-dna-emerald hover:bg-dna-emerald/90 text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Discover Members
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dna/feed')}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Explore Feed
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
