/**
 * PublicProfileHeader Component
 *
 * Header navigation for public profile pages with Join/Sign In CTAs.
 * Shown to non-authenticated visitors.
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface PublicProfileHeaderProps {
  username?: string;
}

export const PublicProfileHeader = ({ username }: PublicProfileHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-4xl items-center justify-between mx-auto px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-dna-forest to-dna-emerald">
            <span className="text-white font-bold text-sm">DNA</span>
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">
            Diaspora Network of Africa
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button
              variant="default"
              size="sm"
              className="bg-dna-forest hover:bg-dna-emerald"
              onClick={() => navigate('/dna')}
            >
              Go to DNA
            </Button>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-dna-copper hover:bg-dna-gold"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Join the Waitlist
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/auth?redirect=/dna/${username}`)}
              >
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicProfileHeader;
