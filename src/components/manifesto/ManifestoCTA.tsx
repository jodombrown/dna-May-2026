import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

export function ManifestoCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <motion.div
      ref={ref}
      className="flex justify-center mt-12 md:mt-16"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.2, delay: 0.2 }}
    >
      <Link to="/auth?mode=signup">
        <button className="bg-[#4A8D77] text-white text-xl md:text-2xl font-bold px-8 py-4 rounded-lg hover:bg-[#2D5A4A] transition-colors animate-pulse">
          Join the Waitlist
        </button>
      </Link>
    </motion.div>
  );
}

export default ManifestoCTA;
