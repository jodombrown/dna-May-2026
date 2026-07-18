import { forwardRef } from 'react';
import { KenteBorder } from '../KenteBorder';
import { StatBox } from '../StatBox';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

interface DemoOpeningProps {
  id: string;
}

export const DemoOpening = forwardRef<HTMLElement, DemoOpeningProps>(
  ({ id }, ref) => {
    const { ref: animationRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

    return (
      <section 
        ref={ref}
        id={id}
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
      >
        {/* Subtle pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234A8D77' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div 
          ref={animationRef}
          className="max-w-[1200px] mx-auto px-4 md:px-6 text-center"
        >
          {/* Kente Border */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.7, delay: 0.1 } as const}
          >
            <KenteBorder width="120px" height="4px" className="mb-10" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="font-cormorant font-semibold mb-8 leading-tight text-foreground"
            style={{ fontSize: 'clamp(32px, 8vw, 72px)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.2 } as const}
          >
            What if <span className="text-dna-emerald">200 million people</span> moved as one?
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="font-outfit text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
            style={{ fontSize: 'clamp(18px, 3vw, 24px)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.3 } as const}
          >
            The African diaspora is the world's most untapped economic force.
            <br />
            Scattered across continents. Connected by heritage.
            <br />
            Ready to build together.
          </motion.p>

          {/* Statistics Row */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.4 } as const}
          >
            <StatBox value="200M+" label="Global Diaspora" />
            <StatBox value="$800B" label="Annual Remittances" />
            <StatBox value="54" label="African Nations" />
          </motion.div>

          {/* Brand Box */}
          <motion.div 
            className="inline-block"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.5 } as const}
          >
            <div className="text-2xl md:text-3xl font-cormorant font-semibold text-dna-emerald mb-2">
              DNA
            </div>
            <div className="text-sm md:text-base text-muted-foreground font-outfit">
              Diaspora Network of Africa
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p 
            className="text-muted-foreground font-outfit text-sm md:text-base mt-8 italic"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.6 } as const}
          >
            The Mobilization Infrastructure for the Global African Diaspora
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.8 } as const}
        >
          <span className="text-xs text-muted-foreground font-outfit">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-dna-emerald/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-dna-emerald rounded-full animate-bounce" />
          </div>
        </motion.div>
      </section>
    );
  }
);

DemoOpening.displayName = 'DemoOpening';
