/**
 * FeatureList Component
 * Displays bullet point list of features included in a release
 */

import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeatureListProps } from '@/types/releases';

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  title = "What's Included",
  className,
}) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-lg border border-neutral-200 bg-neutral-50/50 p-6', className)}>
      <h3 className="font-serif text-lg font-semibold text-neutral-900 mb-4">
        {title}
      </h3>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-0.5">
              <Check className="w-5 h-5 text-dna-emerald" />
            </span>
            <span className="text-neutral-700 leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * FeatureListCompact - Simpler variant without container styling
 */
export const FeatureListCompact: React.FC<Omit<FeatureListProps, 'title'>> = ({
  features,
  className,
}) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-2 text-sm">
          <span className="flex-shrink-0 mt-1 text-dna-emerald">
            <Circle className="w-1.5 h-1.5 fill-current" />
          </span>
          <span className="text-neutral-600">{feature}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * FeatureListNumbered - Numbered list variant
 */
export const FeatureListNumbered: React.FC<FeatureListProps> = ({
  features,
  title = 'Key Features',
  className,
}) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="font-serif text-lg font-semibold text-neutral-900 mb-4">
          {title}
        </h3>
      )}
      <ol className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dna-emerald/10 text-dna-emerald text-sm font-semibold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="text-neutral-700 leading-relaxed pt-0.5">{feature}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default FeatureList;
