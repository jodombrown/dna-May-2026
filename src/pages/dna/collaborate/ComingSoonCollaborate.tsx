import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Users, Target, Clock, CheckCircle2, ArrowRight, Heart, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { FuntunfunefuDenkyemfunefu } from '@/components/icons/adinkra';

const features = [
  {
    icon: Target,
    title: 'Launch Projects',
    description: 'Create projects with clear objectives, timelines, and role requirements, from feasibility studies to joint ventures.'
  },
  {
    icon: Users,
    title: 'Build Distributed Teams',
    description: 'Recruit team members from your network or discover new collaborators whose skills match your needs.'
  },
  {
    icon: Clock,
    title: 'Asynchronous-First',
    description: 'Tools designed for teams spanning Accra, Atlanta, and Amsterdam, with no synchronous coordination burdens.'
  },
  {
    icon: CheckCircle2,
    title: 'Track & Deliver',
    description: 'Manage workflows, track progress, maintain accountability, and celebrate milestones across distributed contributors.'
  }
];

const flowItems = [
  { from: 'Launch a project', to: 'Recruit skilled diaspora contributors' },
  { from: 'Complete milestones', to: 'Build verifiable track record' },
  { from: 'Document learnings', to: 'Share insights through Convey' },
  { from: 'Expand partnerships', to: 'Access marketplace opportunities' }
];

export default function ComingSoonCollaborate() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dna-emerald/10 via-background to-dna-amber/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--dna-emerald)/0.15),transparent_50%)]" />
        
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
                <Layers className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              DNA <span className="text-dna-emerald">Collaborate</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform conversations into coordinated action. The infrastructure that turns good intentions into completed initiatives, for distributed teams spanning time zones, countries, and contexts.
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

      {/* The Trust Dividend */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-h2 font-serif text-foreground mb-3">
            The Trust Dividend
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Completing projects builds your reputation in concrete, verifiable ways. When you've delivered on diaspora development projects, your profile carries weight that no amount of networking can manufacture.
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

      {/* For Contributors */}
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
                  <FolderKanban className="h-5 w-5 text-dna-amber" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">For Contributors</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover projects seeking your specific skills and diaspora perspective. Contribute meaningfully without requiring full-time commitment. Many diaspora members want to give back but have demanding primary careers. Collaborate enables structured contribution that respects your constraints while building a portfolio that demonstrates your capabilities and commitment.
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
                  <FuntunfunefuDenkyemfunefu className="h-6 w-6 text-dna-emerald" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Build Your Network Now
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The best collaborations start with strong connections. Use DNA Connect to find potential project partners and build relationships that will power future initiatives.
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
                  onClick={() => navigate('/dna/convey')}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Share Stories
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
