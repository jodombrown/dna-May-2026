/**
 * Connect Tab Explainer Component
 * 
 * Shows an animated explainer message for each connect tab.
 * - Appears only on first click of the day per tab
 * - Slides down smoothly on entry
 * - Stays for 10 seconds
 * - Slides out to the right at a slightly faster pace
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Network, Globe, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export type ConnectTab = 'discover' | 'network' | 'map' | 'messages';

interface ConnectTabExplainerProps {
  activeTab: ConnectTab;
}

const TAB_EXPLAINERS: Record<ConnectTab, { title: string; description: string; icon: React.ElementType; bgClass: string }> = {
  discover: {
    title: 'Discover Members',
    description: 'Find and connect with diaspora professionals based on skills, interests, and location',
    icon: Users,
    bgClass: 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20',
  },
  network: {
    title: 'My Network',
    description: 'View and manage your connections, pending requests, and grow your diaspora network',
    icon: Network,
    bgClass: 'bg-gradient-to-r from-dna-emerald/10 to-dna-emerald/5 border-dna-emerald/20',
  },
  map: {
    title: 'Diaspora Map',
    description: 'See where the diaspora is gathering. Counts are aggregated and consent-gated — this map shows places, never people.',
    icon: Globe,
    bgClass: 'bg-gradient-to-r from-dna-gold/10 to-dna-gold/5 border-dna-gold/20',
  },
  messages: {
    title: 'Messages',
    description: 'Start conversations with your connections and engage in meaningful dialogue',
    icon: MessageSquare,
    bgClass: 'bg-gradient-to-r from-dna-copper/10 to-dna-gold/10 border-dna-copper/20',
  },
};

const getStorageKey = (tab: ConnectTab, userId: string) => `dna_connect_explainer_${tab}_${userId}`;

const hasShownThisSession = (tab: ConnectTab, userId: string, sessionTimestamp: number): boolean => {
  try {
    const stored = localStorage.getItem(getStorageKey(tab, userId));
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    const today = new Date().toDateString();
    
    // Reset if different day
    if (data.date !== today) return false;
    
    // Reset if new login session
    if (sessionTimestamp > data.sessionTimestamp) return false;
    
    return true;
  } catch {
    return false;
  }
};

const markAsShown = (tab: ConnectTab, userId: string, sessionTimestamp: number): void => {
  try {
    const today = new Date().toDateString();
    localStorage.setItem(getStorageKey(tab, userId), JSON.stringify({
      date: today,
      sessionTimestamp,
      shownAt: Date.now()
    }));
  } catch {}
};

export const ConnectTabExplainer: React.FC<ConnectTabExplainerProps> = ({ activeTab }) => {
  const { user, session } = useAuth();
  const [visibleTab, setVisibleTab] = useState<ConnectTab | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Get session timestamp for login detection
  const sessionTimestamp = session?.access_token 
    ? new Date(session.expires_at ? (session.expires_at * 1000 - 3600000) : Date.now()).getTime()
    : Date.now();

  useEffect(() => {
    if (!user) return;

    // Check if we should show the explainer for this tab
    if (!hasShownThisSession(activeTab, user.id, sessionTimestamp)) {
      markAsShown(activeTab, user.id, sessionTimestamp);
      setIsExiting(false);
      setVisibleTab(activeTab);
      
      // Start exit animation after 10 seconds
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 10000);
      
      // Hide completely after exit animation (300ms after starting exit)
      const hideTimer = setTimeout(() => {
        setVisibleTab(null);
      }, 10300);
      
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [activeTab, user, sessionTimestamp]);

  const explainer = visibleTab ? TAB_EXPLAINERS[visibleTab] : null;
  
  if (!explainer || !visibleTab) return null;

  const Icon = explainer.icon;

  return (
    <AnimatePresence mode="wait">
      {visibleTab && (
        <motion.div
          key={visibleTab}
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={isExiting 
            ? { opacity: 0, x: 100, height: 0, marginBottom: 0 }
            : { opacity: 1, y: 0, height: 'auto', marginBottom: 16 }
          }
          exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
          transition={isExiting 
            ? { duration: 0.25, ease: 'easeIn' }
            : { duration: 0.4, ease: 'easeOut' }
          }
          className="overflow-hidden"
        >
          <div className={`p-4 rounded-lg border ${explainer.bgClass}`}>
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-foreground/70 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{explainer.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {explainer.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
