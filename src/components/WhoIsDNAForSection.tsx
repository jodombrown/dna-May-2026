import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { TYPOGRAPHY } from '@/lib/typography.config';

const WhoIsDNAForSection = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need to live in Africa to participate?",
      answer: "No. DNA is built for the global African diaspora. Whether you're in Atlanta, London, Toronto, or Lagos, if you're committed to Africa's transformation, you belong here. We connect professionals across continents to collaborate on ventures that drive real change."
    },
    {
      question: "How does DNA differ from other professional networks?",
      answer: "DNA is purpose-built for diaspora-led impact. We're not just another LinkedIn. We center African identity, honor Ubuntu principles, and focus exclusively on connecting talent, capital, and expertise to accelerate Africa's development through entrepreneurship and innovation."
    },
    {
      question: "What if I'm just starting my Africa engagement journey?",
      answer: "Perfect. DNA welcomes everyone from seasoned investors to curious first-timers. Our community includes mentors ready to guide you, opportunities matched to your current experience level, and resources designed to help you find your path to meaningful contribution."
    },
    {
      question: "Is this only for tech entrepreneurs?",
      answer: "Not at all. While we embrace innovation, DNA serves professionals across all sectors: agriculture, education, healthcare, finance, creative industries, and more. If you're building solutions or contributing expertise that advances Africa, you're in the right place."
    },
    {
      question: "How do you ensure quality connections and opportunities?",
      answer: "We vet all members and opportunities through our community standards rooted in Ubuntu values. Our platform prioritizes meaningful engagement over vanity metrics, fostering authentic relationships between vetted professionals committed to collective progress and systemic change."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-neutral-50 to-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Who is DNA for? */}
        <div className="mb-8 lg:mb-12">
          <h2 className={`${TYPOGRAPHY.h2} text-dna-copper mb-3 lg:mb-4`}>
            Who is DNA for?
          </h2>
          <p className="text-base sm:text-lg text-neutral-700 mb-6 lg:mb-8">
            Anyone committed to Africa's transformation through innovation and entrepreneurship.
          </p>

          {/* FAQ Toggles */}
          <div className="space-y-2 sm:space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-neutral-50 transition-all duration-200 text-left"
                >
                  <span className="text-sm sm:text-base text-neutral-900 font-medium pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180 text-dna-copper' : ''
                    }`} 
                  />
                </button>
                {openIndex === index && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                    <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-white rounded-lg p-8 sm:p-12 border border-neutral-200 shadow-sm text-center">
          <h3 className={`${TYPOGRAPHY.h3} text-neutral-900 mb-4`}>
            The African Diaspora Movement Starts Here
          </h3>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Connect with visionary leaders, builders, and changemakers dedicated to accelerating Africa's development.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth?mode=signup')}
            className="bg-dna-emerald hover:bg-dna-forest text-white px-8 py-3"
          >
            Join the Waitlist
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WhoIsDNAForSection;
