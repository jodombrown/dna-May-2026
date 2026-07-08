/**
 * PublicProfileCTA Component
 *
 * Call-to-action banner for non-authenticated visitors on public profiles.
 * Encourages joining DNA with personalized messaging.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe2 } from 'lucide-react';

interface PublicProfileCTAProps {
  firstName: string;
  username: string;
}

export const PublicProfileCTA = ({ firstName, username }: PublicProfileCTAProps) => {
  return (
    <Card className="bg-gradient-to-r from-dna-forest to-dna-emerald text-white overflow-hidden">
      <CardContent className="py-8 text-center relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <Globe2 className="absolute -right-8 -bottom-8 w-48 h-48" />
        </div>

        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            Join the Diaspora Network
          </h2>
          <p className="text-white/90 mb-6 max-w-md mx-auto">
            Connect with {firstName} and thousands of African diaspora professionals
            building Africa's future together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-dna-copper hover:bg-dna-gold text-white"
              asChild
            >
              <Link to="/auth?mode=signup">
                Join Now
              </Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-dna-forest hover:bg-white/90"
              asChild
            >
              <Link to="/about">
                Learn More About DNA
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicProfileCTA;
