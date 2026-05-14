import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StayNotifiedPanel from '@/components/StayNotifiedPanel';
import { MessageCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBreathingAnimation } from '@/hooks/useBreathingAnimation';

const CTASection = () => {
  const [isStayNotifiedOpen, setIsStayNotifiedOpen] = useState(false);
  const navigate = useNavigate();
  const card1Ref = useBreathingAnimation();
  const card2Ref = useBreathingAnimation();
  const card3Ref = useBreathingAnimation();

  return (
    <>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          

          {/* Engagement Options */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card ref={card1Ref.elementRef} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/contact')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-dna-copper/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-dna-copper" />
                </div>
                <h3 className="text-2xl font-bold text-dna-copper mb-4">Share Feedback</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Help us build better by sharing your thoughts and ideas
                </p>
              </CardContent>
            </Card>

            <Card ref={card2Ref.elementRef} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/about')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-dna-emerald/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-8 h-8 text-dna-emerald" />
                </div>
                <h3 className="text-2xl font-bold text-dna-emerald mb-4">Track Our Progress</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Follow our development journey phase by phase
                </p>
              </CardContent>
            </Card>

            <Card ref={card3Ref.elementRef} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/about')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-dna-forest/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-8 h-8 text-dna-forest" />
                </div>
                <h3 className="text-2xl font-bold text-dna-forest mb-4">Learn About DNA</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Understand our mission, vision, and approach
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <StayNotifiedPanel 
        isOpen={isStayNotifiedOpen} 
        onClose={() => setIsStayNotifiedOpen(false)} 
      />
    </>
  );
};

export default CTASection;
