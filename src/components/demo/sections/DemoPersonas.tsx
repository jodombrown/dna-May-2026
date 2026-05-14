import { forwardRef } from 'react';
import { KenteBorder } from '../KenteBorder';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

interface DemoPersonasProps {
  id: string;
}

const C_STYLES: Record<string, { bg: string; text: string }> = {
  CONNECT: { bg: 'bg-dna-emerald/10', text: 'text-dna-emerald' },
  CONVENE: { bg: 'bg-dna-terra/10', text: 'text-dna-terra' },
  COLLABORATE: { bg: 'bg-dna-ocean/10', text: 'text-dna-ocean' },
  CONTRIBUTE: { bg: 'bg-dna-purple/10', text: 'text-dna-purple' },
  CONVEY: { bg: 'bg-dna-ochre/10', text: 'text-dna-ochre' },
};

const PERSONAS = [
  {
    name: 'The Professional',
    description: 'Diaspora professionals seeking meaningful connections and ways to contribute expertise to African development.',
    needs: ['Find peers with shared heritage', 'Contribute skills to meaningful projects', 'Build professional reputation'],
    primaryCs: ['CONNECT', 'CONTRIBUTE', 'CONVEY'],
  },
  {
    name: 'The Entrepreneur',
    description: 'Founders looking for partners, investors, and talent within the diaspora to build Africa-focused ventures.',
    needs: ['Find co-founders and advisors', 'Access diaspora capital', 'Recruit talented team members'],
    primaryCs: ['CONNECT', 'COLLABORATE', 'CONTRIBUTE'],
  },
  {
    name: 'The Community Builder',
    description: 'Event organizers and connectors who bring the diaspora together for impact and belonging.',
    needs: ['Host meaningful gatherings', 'Build lasting community', 'Document community stories'],
    primaryCs: ['CONVENE', 'COLLABORATE', 'CONVEY'],
  },
  {
    name: 'The Investor',
    description: 'Diaspora members looking to deploy capital into African markets with trusted partners.',
    needs: ['Find vetted opportunities', 'Connect with co-investors', 'Due diligence support'],
    primaryCs: ['CONTRIBUTE', 'CONNECT', 'COLLABORATE'],
  },
  {
    name: 'The Returner',
    description: 'Those planning permanent or periodic return to the continent, seeking connections and opportunities.',
    needs: ['Build network before return', 'Find opportunities on ground', 'Connect with fellow returners'],
    primaryCs: ['CONNECT', 'CONVENE', 'CONTRIBUTE'],
  },
  {
    name: 'The Student',
    description: 'Young diaspora building professional identity and seeking mentorship from established professionals.',
    needs: ['Find mentors', 'Join learning communities', 'Build portfolio of contributions'],
    primaryCs: ['CONNECT', 'COLLABORATE', 'CONVEY'],
  },
];

export const DemoPersonas = forwardRef<HTMLElement, DemoPersonasProps>(
  ({ id }, ref) => {
    const { ref: animationRef, isVisible } = useScrollAnimation();

    return (
      <section 
        ref={ref}
        id={id}
        className="min-h-screen py-16 md:py-12 bg-dna-pearl"
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div ref={animationRef}>
            {/* Kente Border */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2 } as const}
            >
              <KenteBorder width="80px" height="3px" className="mb-8" />
            </motion.div>

            {/* Headline */}
            <motion.h2 
              className="font-cormorant font-semibold text-center text-foreground mb-4"
              style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 } as const}
            >
              The <span className="text-dna-emerald">DNA Community</span>
            </motion.h2>

            {/* Supporting Text */}
            <motion.p 
              className="font-outfit text-muted-foreground text-center max-w-2xl mx-auto mb-12 leading-relaxed text-base md:text-lg"
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.2 } as const}
            >
              DNA serves the full spectrum of diaspora engagement, from early-career professionals 
              to seasoned investors, from event organizers to returnees.
            </motion.p>

            {/* Personas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PERSONAS.map((persona, index) => (
                <motion.div 
                  key={persona.name}
                  className="bg-background border border-border rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0 }}
                  animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.3 + index * 0.1 } as const}
                >
                  {/* Persona Name */}
                  <h3 className="font-cormorant font-semibold text-lg text-dna-emerald mb-3">
                    {persona.name}
                  </h3>

                  {/* Description */}
                  <p className="font-outfit text-foreground/80 text-sm leading-relaxed mb-4">
                    {persona.description}
                  </p>

                  {/* Key Needs */}
                  <div className="mb-4">
                    <h4 className="font-outfit text-muted-foreground text-xs uppercase tracking-wider mb-2">
                      Key Needs
                    </h4>
                    <ul className="space-y-1">
                      {persona.needs.map((need, needIndex) => (
                        <li key={needIndex} className="font-outfit text-foreground/70 text-sm flex items-start gap-2">
                          <span className="text-dna-emerald">•</span>
                          {need}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Primary C's */}
                  <div>
                    <h4 className="font-outfit text-muted-foreground text-xs uppercase tracking-wider mb-2">
                      Primary C's
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {persona.primaryCs.map((c) => {
                        const styles = C_STYLES[c];
                        return (
                          <span 
                            key={c}
                            className={`px-2 py-1 rounded-full text-xs font-outfit font-medium ${styles.bg} ${styles.text}`}
                          >
                            {c}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

DemoPersonas.displayName = 'DemoPersonas';
