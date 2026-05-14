
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PatternBackground from '@/components/ui/PatternBackground';
import { Search, Palette, Users, Code, TestTube } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

const phases = [
  {
    phase: 1,
    title: "Market Research",
    description: "Understanding diaspora needs and validating our concept",
    status: "Active",
    timeline: "Jun - Sep 2025",
    path: "/phase-1/market-research",
    icon: <Search className="w-6 h-6" />,
    color: "bg-dna-emerald"
  },
  {
    phase: 2,
    title: "Prototyping",
    description: "Designing user experiences and testing prototypes",
    status: "Planned",
    timeline: "Oct - Dec 2025",
    path: "/phase-2/prototyping",
    icon: <Palette className="w-6 h-6" />,
    color: "bg-dna-forest"
  },
  {
    phase: 3,
    title: "Customer Discovery",
    description: "Measuring early adopter interest and validation",
    status: "Planned",
    timeline: "Jan - Feb 2026",
    path: "/phase-3/customer-discovery",
    icon: <Users className="w-6 h-6" />,
    color: "bg-dna-copper"
  },
  {
    phase: 4,
    title: "MVP Build",
    description: "Building the minimum viable product",
    status: "Planned",
    timeline: "Mar - Jul 2026",
    path: "/phase-4/mvp",
    icon: <Code className="w-6 h-6" />,
    color: "bg-dna-gold"
  },
  {
    phase: 5,
    title: "Beta Validation",
    description: "Testing with real users and validating product-market fit",
    status: "Planned",
    timeline: "Aug 2026",
    path: "/phase-5/beta-validation",
    icon: <TestTube className="w-6 h-6" />,
    color: "bg-dna-mint"
  },
  {
    phase: 6,
    title: "Go-to-Market",
    description: "Global launch and sustainable growth",
    status: "Planned",
    timeline: "Sep 2026+",
    path: "/phase-6/go-to-market",
    icon: <MateMasie className="w-6 h-6" />,
    color: "bg-dna-emerald"
  }
];

const PhaseNavigation = () => {
  const navigate = useNavigate();

  return (
    <PatternBackground pattern="mudcloth" intensity="subtle" className="py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Development Journey</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Follow our transparent, phase-by-phase approach to building DNA. Each phase has clear objectives, 
            timelines, and measurable outcomes to ensure we're building something that truly serves the African diaspora.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases.map((phase) => (
            <Card 
              key={phase.phase} 
              className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-l-4 border-l-dna-emerald"
              onClick={() => navigate(phase.path)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 ${phase.color} rounded-xl flex items-center justify-center text-white`}>
                    {phase.icon}
                  </div>
                  <Badge variant={phase.status === "Active" ? "default" : "secondary"}>
                    {phase.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-neutral-900">
                  Phase {phase.phase}: {phase.title}
                </CardTitle>
                <p className="text-sm text-neutral-500">{phase.timeline}</p>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-4">{phase.description}</p>
                <Button 
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(phase.path);
                  }}
                  className="w-full"
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PatternBackground>
  );
};

export default PhaseNavigation;
