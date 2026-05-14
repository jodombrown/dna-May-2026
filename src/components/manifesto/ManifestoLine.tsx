import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface ManifestoLineProps {
  children: React.ReactNode;
  bold?: boolean;
  delay?: number;
  className?: string;
}

export function ManifestoLine({ children, bold = false, delay = 0, className = '' }: ManifestoLineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5% 0px' });

  const baseClasses = bold
    ? 'text-xl md:text-2xl font-bold text-[#2D5A4A] leading-relaxed'
    : 'text-lg md:text-xl font-serif text-[#1A1A1A] leading-relaxed';

  return (
    <motion.div
      ref={ref}
      className={`mb-4 md:mb-5 ${baseClasses} ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        duration: bold ? 0.3 : 0.2,
        delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

export default ManifestoLine;
