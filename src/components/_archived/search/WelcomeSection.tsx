
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TYPOGRAPHY } from '@/lib/typography.config';

const WelcomeSection = () => {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="text-neutral-500">
          <p className={`${TYPOGRAPHY.h4} mb-2`}>Welcome to DiasporaLink Search</p>
          <p className={TYPOGRAPHY.body}>Sign in to get personalized recommendations and connect with professionals</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeSection;
