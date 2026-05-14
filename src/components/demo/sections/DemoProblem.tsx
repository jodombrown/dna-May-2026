import { forwardRef } from 'react';
import { KenteBorder } from '../KenteBorder';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { Link2, Calendar, ClipboardList, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface DemoProblemProps {
  id: string;
}

const PROBLEM_CARDS = [
  {
    icon: Link2,
    title: 'Networking in Isolation',
    description: "LinkedIn doesn't understand diaspora context. Connections lack cultural depth. Great conversations happen, then everyone goes back to their silos.",
  },
  {
    icon: Calendar,
    title: 'Events Without Continuity',
    description: "Powerful gatherings end with no follow-up. Relationships formed at conferences dissolve. Community momentum dissipates.",
  },
  {
    icon: ClipboardList,
    title: 'Projects Without Accountability',
    description: "Asana doesn't have community pressure. Initiatives fizzle. Good intentions never become impact.",
  },
  {
    icon: DollarSign,
    title: "Resources Can't Find Needs",
    description: "Skills, time, and capital go unmatched. Diaspora wealth flows to middlemen instead of community projects.",
  },
];

export const DemoProblem = forwardRef<HTMLElement, DemoProblemProps>(
  ({ id }, ref) => {
    const { ref: animationRef, isVisible } = useScrollAnimation();

    return (
      <section 
        ref={ref}
        id={id}
        className="min-h-screen py-16 md:py-12 flex items-center bg-dna-pearl"
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div ref={animationRef}>
            {/* Kente Border */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.2 } as const}
            >
              <KenteBorder width="80px" height="3px" centered={false} className="mb-8" />
            </motion.div>

            {/* Headline */}
            <motion.h2 
              className="font-cormorant font-semibold text-foreground mb-6"
              style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 } as const}
            >
              Scattered Potential. <span className="text-dna-terra">Fragmented Power.</span>
            </motion.h2>

            {/* Supporting Text */}
            <motion.p 
              className="font-outfit text-muted-foreground max-w-2xl mb-12 leading-relaxed text-base md:text-lg"
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.2 } as const}
            >
              Today, diaspora potential is trapped in disconnected silos. Ideas die in DMs. 
              Connections fade after events. Projects stall without accountability. 
              Contributions cannot find their targets.
            </motion.p>

            {/* Problem Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PROBLEM_CARDS.map((card, index) => (
                <motion.div 
                  key={index}
                  className="bg-background border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0 }}
                  animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.3 + index * 0.15 } as const}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-dna-terra/10 flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-6 h-6 text-dna-terra" />
                    </div>
                    <div>
                      <h3 className="font-cormorant font-semibold text-foreground text-lg md:text-xl mb-2">
                        {card.title}
                      </h3>
                      <p className="font-outfit text-muted-foreground text-sm md:text-base leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quote */}
            <motion.blockquote 
              className="mt-12 border-l-4 border-dna-emerald pl-6"
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.7 } as const}
            >
              <p className="font-outfit italic text-foreground text-base md:text-lg">
                "The diaspora has more PhDs, more capital, more expertise than ever before. 
                What we lack is coordination."
              </p>
            </motion.blockquote>
          </div>
        </div>
      </section>
    );
  }
);

DemoProblem.displayName = 'DemoProblem';
