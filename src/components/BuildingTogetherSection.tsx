import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Eye, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import PatternBackground from './ui/PatternBackground';
import MainPageFeedbackPanel from './MainPageFeedbackPanel';

const BuildingTogetherSection = () => {
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <PatternBackground pattern="mudcloth" intensity="subtle" className="py-12 lg:py-16 bg-gradient-to-br from-dna-pearl-light via-white to-dna-terra-light/5">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 lg:mb-12">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-dna-forest mb-3 lg:mb-4">
            Join Us in Shaping Africa's Future
          </h3>
          <p className="text-base sm:text-lg text-neutral-600 max-w-4xl mx-auto">
            <span className="font-semibold text-dna-forest">Why we're building in the open:</span> We believe openness builds trust. Watch us create the 
            platform, share feedback, and join our community as we grow together.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {/* Share Feedback Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-5 lg:p-6 text-center">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-dna-ochre/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:bg-dna-ochre/20 transition-colors">
                <MessageCircle className="w-7 h-7 lg:w-8 lg:h-8 text-dna-ochre" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-dna-forest mb-3 lg:mb-4">Share Feedback</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 lg:mb-6 leading-relaxed">
                Help us build better by sharing your thoughts and ideas
              </p>
              <Button 
                variant="default"
                onClick={() => setIsFeedbackOpen(true)}
              >
                Give Feedback
              </Button>
            </CardContent>
          </Card>

          {/* Track Progress Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-5 lg:p-6 text-center">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-dna-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:bg-dna-emerald/20 transition-colors">
                <Eye className="w-7 h-7 lg:w-8 lg:h-8 text-dna-emerald" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-dna-forest mb-3 lg:mb-4">Track Our Progress</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 lg:mb-6 leading-relaxed">
                Follow our development journey phase by phase
              </p>
              <Button 
                variant="default"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                View Phases
              </Button>
            </CardContent>
          </Card>

          {/* Learn About DNA Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-5 lg:p-6 text-center">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-dna-forest/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:bg-dna-forest/20 transition-colors">
                <BookOpen className="w-7 h-7 lg:w-8 lg:h-8 text-dna-forest" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-dna-forest mb-3 lg:mb-4">Learn About DNA</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 lg:mb-6 leading-relaxed">
                Understand our mission, vision, and approach
              </p>
              <Button 
                variant="default"
                onClick={() => navigate('/about')}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <MainPageFeedbackPanel 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </PatternBackground>
  );
};

export default BuildingTogetherSection;