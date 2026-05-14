import React from 'react';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';

interface ThreeColumnLayoutProps {
  leftWidth?: string;
  centerWidth?: string;
  rightWidth?: string;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

/**
 * ThreeColumnLayout - Adaptive 3-column grid layout
 * 
 * Desktop: Displays all three columns side-by-side
 * Tablet: Stacks columns vertically
 * Mobile: Single column stack
 * 
 * Default widths: 15% - 70% - 15%
 */
const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftWidth = '15%',
  centerWidth = '70%',
  rightWidth = '15%',
  left,
  center,
  right,
  className,
}) => {
  const { isMobile, isTablet } = useMobile();

  // On mobile/tablet, stack columns vertically with minimal top spacing
  if (isMobile || isTablet) {
    return (
      <div className={cn("flex flex-col w-full gap-3 px-4 pt-2 pb-4", className)}>
        {left && (
          <div className="w-full transition-all duration-300 ease-in-out">
            {left}
          </div>
        )}
        {center && (
          <div className="w-full transition-all duration-300 ease-in-out">
            {center}
          </div>
        )}
        {right && (
          <div className="w-full transition-all duration-300 ease-in-out">
            {right}
          </div>
        )}
      </div>
    );
  }

  // Desktop: 3-column layout. Pixel widths = fixed rails; percentage widths = legacy ratio.
  // Center fills remaining space (flex: 1) when rails are pixel-based, matching the mockup.
  const isPixel = (v?: string) => !!v && /px$/.test(v.trim());
  const railsArePixel = isPixel(leftWidth) || isPixel(rightWidth);
  const centerStyle: React.CSSProperties = railsArePixel || centerWidth === '1fr'
    ? { flex: 1, minWidth: 0, height: '100%' }
    : { width: centerWidth, maxWidth: centerWidth, minWidth: centerWidth, height: '100%' };

  return (
    <div
      className={cn("flex w-full gap-5 px-4 mx-auto", className)}
      style={{
        maxWidth: '1400px',
        paddingTop: '1.5rem',
        height: 'calc(100dvh - var(--total-header-height, 7.5rem) - 1.5rem)',
        overflow: 'hidden',
      }}
    >
      {left && (
        <aside 
          className="transition-all duration-300 ease-in-out overflow-y-auto scrollbar-thin"
          style={{ 
            width: leftWidth,
            maxWidth: leftWidth,
            minWidth: leftWidth,
            height: '100%',
          }}
        >
          {left}
        </aside>
      )}
      
      {center && (
        <main 
          id="main-content"
          tabIndex={-1}
          className="transition-all duration-300 ease-in-out overflow-y-auto scrollbar-thin focus:outline-none"
          data-scroll-container="main"
          style={centerStyle}
        >
          {center}
        </main>
      )}
      
      {right && (
        <aside 
          className="transition-all duration-300 ease-in-out overflow-y-auto scrollbar-thin"
          style={{ 
            width: rightWidth,
            maxWidth: rightWidth,
            minWidth: rightWidth,
            height: '100%',
          }}
        >
          {right}
        </aside>
      )}
    </div>
  );
};

export default ThreeColumnLayout;
