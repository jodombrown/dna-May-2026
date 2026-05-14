import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface ManifestoSectionProps {
  number: string;
  children: React.ReactNode;
  isLast?: boolean;
}

export function ManifestoSection({ number, children, isLast = false }: ManifestoSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section
      ref={ref}
      className={`min-h-screen flex flex-col justify-center px-6 md:px-8 py-16 md:py-12 ${isLast ? 'pb-32' : ''}`}
    >
      <div className="max-w-3xl mx-auto w-full">
        <motion.p
          className="text-base font-sans text-[#B87333] mb-8 md:mb-12 tracking-widest"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          — {number} —
        </motion.p>
        {children}
      </div>
    </section>
  );
}

export default ManifestoSection;
