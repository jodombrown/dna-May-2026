
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Globe, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ConnectHero = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-dna-emerald via-dna-forest to-dna-copper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Connect
            </h1>
          </div>
          
          <p className="text-xl text-white/90 mb-6 max-w-3xl mx-auto">
            Build powerful professional relationships across the diaspora. 
            Discover opportunities, expand your network, and find your tribe through purpose-driven connections.
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
              <Globe className="w-4 h-4 mr-2" />
              50K+ Global Professionals
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
              <Target className="w-4 h-4 mr-2" />
              Smart Matching
            </Badge>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-4xl mx-auto mb-8">
            <h3 className="text-white font-semibold mb-3">🔬 Platform Preview - Connect Pillar</h3>
            <p className="text-white/80 text-sm mb-4">
              Experience our vision for diaspora networking. This prototype demonstrates the seamless 
              connection capabilities we're developing to unite African diaspora professionals globally.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-white/70">
              <div>• Smart professional matching</div>
              <div>• Global community access</div>
              <div>• Purpose-driven networking</div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/about')}
              className="bg-white text-dna-emerald hover:bg-neutral-100"
            >
              Learn About DNA
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate('/contact')}
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Join Our Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectHero;
