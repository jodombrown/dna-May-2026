import { forwardRef } from 'react';
import { KenteBorder } from '../KenteBorder';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Layers, Gift, PenTool } from 'lucide-react';

interface DemoMovementProps {
  id: string;
}

const C_ICONS = [
  { icon: Users, color: 'text-dna-emerald' },
  { icon: Calendar, color: 'text-dna-terra' },
  { icon: Layers, color: 'text-dna-ocean' },
  { icon: Gift, color: 'text-dna-purple' },
  { icon: PenTool, color: 'text-dna-ochre' },
];

export const DemoMovement = forwardRef<HTMLElement, DemoMovementProps>(
  ({ id }, ref) => {
    const { ref: animationRef, isVisible } = useScrollAnimation();
    const navigate = useNavigate();

    return (
      <section 
        ref={ref}
        id={id}
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dna-emerald"
      >
        <div 
          ref={animationRef}
          className="max-w-[1200px] mx-auto px-4 md:px-6 text-center"
        >
          {/* Kente Border */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2 } as const}
          >
            <KenteBorder width="120px" height="4px" className="mb-10" />
          </motion.div>

          {/* Headline */}
          <motion.h2 
            className="font-cormorant font-semibold text-white mb-6"
            style={{ fontSize: 'clamp(28px, 6vw, 56px)' }}
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 } as const}
          >
            From Scattered To <span className="text-dna-ochre">Coordinated</span>
          </motion.h2>

          {/* Description */}
          <motion.p 
            className="font-outfit text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed text-base md:text-lg"
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.2 } as const}
          >
            DNA is more than a platform. It is infrastructure for a movement: 
            the operating system that transforms diaspora potential into Africa's economic transformation.
          </motion.p>

          {/* Mission & Vision */}
          <motion.div 
            className="flex flex-col md:flex-row justify-center gap-6 md:gap-12 mb-10"
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.3 } as const}
          >
            <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 backdrop-blur-sm">
              <p className="font-outfit text-white/70 text-xs uppercase tracking-wider mb-1">Mission</p>
              <p className="font-cormorant font-medium text-white text-lg">Mobilize the Global African Diaspora</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 backdrop-blur-sm">
              <p className="font-outfit text-white/70 text-xs uppercase tracking-wider mb-1">Vision</p>
              <p className="font-cormorant font-medium text-white text-lg">Africa's Economic Transformation</p>
            </div>
          </motion.div>

          {/* Ubuntu Quote Box */}
          <motion.div 
            className="max-w-md mx-auto p-6 rounded-xl border mb-10 bg-white/10 border-white/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.4 } as const}
          >
            <blockquote className="font-cormorant text-xl md:text-2xl italic text-white mb-2">
              "I am because we are."
            </blockquote>
            <p className="font-outfit text-white/70 text-sm">
              Ubuntu Philosophy: The Foundation of DNA
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.5 } as const}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-white hover:bg-dna-pearl text-dna-emerald font-outfit font-medium px-8 py-6 text-lg rounded-xl mb-10"
            >
              Get Started
            </Button>
          </motion.div>

          {/* C Icons Row */}
          <motion.div 
            className="flex justify-center gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.6 } as const}
          >
            {C_ICONS.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.div 
                  key={index} 
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2, delay: 0.7 + index * 0.1 } as const}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Footer */}
          <motion.p 
            className="font-outfit text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 1.2 } as const}
          >
            DNA: Diaspora Network of Africa, {new Date().getFullYear()}
          </motion.p>
        </div>
      </section>
    );
  }
);

DemoMovement.displayName = 'DemoMovement';
