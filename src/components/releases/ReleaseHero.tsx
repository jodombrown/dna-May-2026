import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Handshake, Briefcase, Megaphone, Settings,
  MessageSquare, Globe, Bell, Network
} from 'lucide-react';
import type { ReleaseHeroType, ReleaseCategory } from '@/types/releases';

interface ReleaseHeroProps {
  heroType: ReleaseHeroType;
  category: ReleaseCategory;
  imageUrl?: string | null;
  videoUrl?: string | null;
  className?: string;
}

const categoryColors: Record<ReleaseCategory, string> = {
  CONNECT: 'from-dna-emerald to-dna-forest',
  CONVENE: 'from-dna-copper to-dna-sunset',
  COLLABORATE: 'from-dna-gold to-dna-copper',
  CONTRIBUTE: 'from-dna-forest to-dna-emerald',
  CONVEY: 'from-dna-sunset to-dna-ochre',
  PLATFORM: 'from-neutral-500 to-neutral-700',
};

const categoryIcons: Record<ReleaseCategory, React.ReactNode> = {
  CONNECT: <Users className="w-16 h-16 text-white/80" />,
  CONVENE: <Calendar className="w-16 h-16 text-white/80" />,
  COLLABORATE: <Handshake className="w-16 h-16 text-white/80" />,
  CONTRIBUTE: <Briefcase className="w-16 h-16 text-white/80" />,
  CONVEY: <Megaphone className="w-16 h-16 text-white/80" />,
  PLATFORM: <Settings className="w-16 h-16 text-white/80" />,
};

// Kente pattern SVG overlay
const KentePattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.08]"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <defs>
      <pattern id="kente-hero" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="10" height="10" fill="white" />
        <rect x="10" y="10" width="10" height="10" fill="white" />
      </pattern>
    </defs>
    <rect width="100" height="100" fill="url(#kente-hero)" />
  </svg>
);

// Animated Map Hero
const MapHero: React.FC = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-dna-emerald to-dna-forest flex items-center justify-center overflow-hidden">
    <KentePattern />
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <Globe className="w-20 h-20 text-white/70" />
      {/* Pulsing dots representing regions */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-dna-gold rounded-full"
          style={{
            top: `${20 + Math.sin(i * 1.2) * 30}%`,
            left: `${30 + Math.cos(i * 1.2) * 35}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </motion.div>
  </div>
);

// Animated Chat Hero
const ChatHero: React.FC = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-dna-forest to-dna-emerald flex items-center justify-center overflow-hidden">
    <KentePattern />
    <div className="flex flex-col gap-2 p-4">
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="bg-white/20 rounded-xl rounded-bl-none px-3 py-2 max-w-[140px]"
      >
        <span className="text-white text-xs">Hello! 👋</span>
      </motion.div>
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white/30 rounded-xl rounded-br-none px-3 py-2 max-w-[140px] self-end"
      >
        <span className="text-white text-xs">Welcome to DNA!</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
        className="flex gap-1 mt-1"
      >
        <span className="w-2 h-2 bg-white/50 rounded-full" />
        <span className="w-2 h-2 bg-white/50 rounded-full" />
        <span className="w-2 h-2 bg-white/50 rounded-full" />
      </motion.div>
    </div>
  </div>
);

// Animated Network Hero
const NetworkHero: React.FC = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-dna-emerald to-dna-forest flex items-center justify-center overflow-hidden">
    <KentePattern />
    <div className="relative">
      {/* Center node */}
      <motion.div
        className="w-12 h-12 bg-dna-gold rounded-full flex items-center justify-center z-10 relative"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs font-bold text-dna-charcoal">YOU</span>
      </motion.div>
      {/* Connection nodes */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60 * Math.PI) / 180;
        const x = Math.cos(angle) * 50;
        const y = Math.sin(angle) * 50;
        return (
          <React.Fragment key={i}>
            <motion.div
              className="absolute w-6 h-6 bg-white/40 rounded-full"
              style={{ left: x + 3, top: y + 3 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
            <motion.div
              className="absolute w-px bg-white/30"
              style={{
                left: 24,
                top: 24,
                width: 50,
                height: 1,
                transformOrigin: 'left center',
                transform: `rotate(${i * 60}deg)`,
              }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// Notification Hero
const NotificationHero: React.FC = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-dna-copper to-dna-sunset flex items-center justify-center overflow-hidden">
    <KentePattern />
    <div className="flex flex-col gap-2 p-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.3, duration: 0.4 }}
          className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-3 py-2"
        >
          <Bell className="w-4 h-4 text-white" />
          <span className="text-white text-xs">New notification</span>
        </motion.div>
      ))}
    </div>
  </div>
);

// Gradient Hero (default)
const GradientHero: React.FC<{ category: ReleaseCategory }> = ({ category }) => (
  <div className={cn(
    'relative w-full h-full bg-gradient-to-br flex items-center justify-center overflow-hidden',
    categoryColors[category]
  )}>
    <KentePattern />
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {categoryIcons[category]}
    </motion.div>
  </div>
);

export const ReleaseHero: React.FC<ReleaseHeroProps> = ({
  heroType,
  category,
  imageUrl,
  videoUrl,
  className,
}) => {
  const renderHero = () => {
    switch (heroType) {
      case 'image':
        if (imageUrl) {
          return (
            <img
              src={imageUrl}
              alt="Release hero"
              className="w-full h-full object-cover"
            />
          );
        }
        return <GradientHero category={category} />;

      case 'video':
        if (videoUrl) {
          return (
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          );
        }
        return <GradientHero category={category} />;

      case 'map':
        return <MapHero />;

      case 'chat':
        return <ChatHero />;

      case 'network':
        return <NetworkHero />;

      case 'notification':
        return <NotificationHero />;

      case 'animation':
      case 'gradient':
      default:
        return <GradientHero category={category} />;
    }
  };

  return (
    <div className={cn('h-[200px] rounded-t-xl overflow-hidden', className)}>
      {renderHero()}
    </div>
  );
};

export default ReleaseHero;
