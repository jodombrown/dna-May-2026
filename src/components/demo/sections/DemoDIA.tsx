import { forwardRef } from 'react';
import { KenteBorder } from '../KenteBorder';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { Search, Bell, BarChart3, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { MateMasie } from '@/components/icons/adinkra';

interface DemoDIAProps {
  id: string;
}

const DIA_FEATURES = [
  { icon: Search, label: 'Smart Discovery', description: 'Find the right people, events, and opportunities' },
  { icon: Bell, label: 'Proactive Nudges', description: 'Never let important tasks fall through' },
  { icon: BarChart3, label: 'Network Intelligence', description: 'Understand your diaspora connections' },
  { icon: Target, label: 'Opportunity Matching', description: 'Surface relevant contributions and content' },
];

const CHAT_MESSAGES = [
  {
    from: 'dia',
    message: "Based on your mentorship interests and the event you attended last week, I found 3 educators in Accra who are building similar programs. Would you like me to introduce you?",
  },
  {
    from: 'user',
    message: "Yes! Can you also check if any of them attended the Tech Summit?",
  },
  {
    from: 'dia',
    message: "Two of them did! Kwame Asante actually asked a question during the same panel you were inspired by. He is also looking for diaspora collaborators. A perfect match.",
  },
];

export const DemoDIA = forwardRef<HTMLElement, DemoDIAProps>(
  ({ id }, ref) => {
    const { ref: animationRef, isVisible } = useScrollAnimation();

    return (
      <section 
        ref={ref}
        id={id}
        className="min-h-screen py-16 md:py-12 bg-background"
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

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Explanation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 } as const}
              >
                <h2 
                  className="font-cormorant font-semibold text-foreground mb-2"
                  style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
                >
                  Meet <span className="text-dna-emerald">DIA</span>
                </h2>
                <p className="font-outfit text-muted-foreground text-lg mb-6">
                  Diaspora Intelligence Agent
                </p>

                <p className="font-outfit text-foreground/80 leading-relaxed mb-6">
                  DIA is DNA's intelligence layer, woven through every C, anticipating needs, 
                  surfacing opportunities, and keeping the diaspora coordinated.
                </p>

                <p className="font-outfit text-dna-emerald font-medium mb-8">
                  Not an assistant that waits for commands. An agent that operates with intention.
                </p>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DIA_FEATURES.map((feature, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0 }}
                      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.3 + index * 0.1 } as const}
                    >
                      <div className="w-10 h-10 rounded-lg bg-dna-emerald/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-dna-emerald" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-medium text-foreground text-sm">
                          {feature.label}
                        </h4>
                        <p className="font-outfit text-muted-foreground text-xs">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right - Chat Mockup */}
              <motion.div 
                className="bg-dna-pearl border border-border rounded-xl p-4 md:p-6 shadow-sm"
                initial={{ opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.2 } as const}
              >
                {/* DIA Avatar Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-dna-emerald to-dna-forest">
                    <MateMasie className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-outfit font-medium text-foreground">DIA</h4>
                    <p className="font-outfit text-muted-foreground text-xs">Diaspora Intelligence Agent</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4">
                  {CHAT_MESSAGES.map((msg, index) => (
                    <motion.div 
                      key={index}
                      className={cn(
                        "max-w-[85%]",
                        msg.from === 'user' ? "ml-auto" : ""
                      )}
                      initial={{ opacity: 0 }}
                      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.5 + index * 0.15 } as const}
                    >
                      <div 
                        className={cn(
                          "p-3 rounded-lg font-outfit text-sm leading-relaxed",
                          msg.from === 'dia' 
                            ? "bg-dna-emerald/10 rounded-bl-sm text-foreground" 
                            : "bg-muted rounded-br-sm text-foreground"
                        )}
                      >
                        {msg.message}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

DemoDIA.displayName = 'DemoDIA';
