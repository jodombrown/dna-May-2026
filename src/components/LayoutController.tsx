import React from 'react';
import { useViewState } from '@/contexts/ViewStateContext';
import ThreeColumnLayout from '@/layouts/ThreeColumnLayout';
import TwoColumnLayout from '@/layouts/TwoColumnLayout';
import FullCanvasLayout from '@/layouts/FullCanvasLayout';
import DetailViewLayout from '@/layouts/DetailViewLayout';
// MobileBottomNav removed: PulseDock (mounted in BaseLayout) is the sole mobile bottom nav.
import SkipLink from '@/components/shared/SkipLink';

interface LayoutControllerProps {
  // Column content for ThreeColumnLayout
  leftColumn?: React.ReactNode;
  centerColumn?: React.ReactNode;
  rightColumn?: React.ReactNode;
  
  // Column content for TwoColumnLayout
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  
  // Full canvas content
  canvasContent?: React.ReactNode;
  canvasSidebar?: React.ReactNode;
  
  // Fallback for simple cases
  children?: React.ReactNode;
}

/**
 * LayoutController - The intelligent layout selector
 * 
 * This component automatically selects and renders the appropriate layout
 * based on the current view state (determined by the route).
 * 
 * View State Mappings:
 * - DASHBOARD_HOME → ThreeColumnLayout (15%-70%-15%)
 * - CONNECT_MODE → ThreeColumnLayout (15%-70%-15%)
 * - CONVENE_MODE → TwoColumnLayout (60%-40%)
 * - MESSAGES_MODE → TwoColumnLayout (35%-65%)
 * - COLLABORATE_MODE → FullCanvasLayout (20%-80%)
 * - CONTRIBUTE_MODE → TwoColumnLayout (55%-45%)
 * - CONVEY_MODE → ThreeColumnLayout (15%-70%-15%)
 * - FOCUS_DETAIL_MODE → Modal overlay (handled separately)
 * 
 * Usage Example:
 * ```tsx
 * <LayoutController
 *   leftColumn={<DashboardNav />}
 *   centerColumn={<Feed />}
 *   rightColumn={<Widgets />}
 * />
 * ```
 */
const LayoutController: React.FC<LayoutControllerProps> = ({
  leftColumn,
  centerColumn,
  rightColumn,
  leftContent,
  rightContent,
  canvasContent,
  canvasSidebar,
  children,
}) => {
  const { viewState, layoutConfig } = useViewState();

  // Helper to wrap layout with SkipLink + MobileBottomNav
  const withMobileNav = (layout: React.ReactNode) => (
    <>
      <SkipLink />
      {layout}
      <MobileBottomNav />
    </>
  );

  // Render appropriate layout based on view state
  switch (viewState) {
    case 'DASHBOARD_HOME':
      return withMobileNav(
        <ThreeColumnLayout
          leftWidth={layoutConfig.leftWidth}
          centerWidth={layoutConfig.centerWidth}
          rightWidth={layoutConfig.rightWidth}
          left={leftColumn}
          center={centerColumn || children}
          right={rightColumn}
        />
      );

    case 'CONNECT_MODE':
      return withMobileNav(
        <ThreeColumnLayout
          leftWidth={layoutConfig.leftWidth}
          centerWidth={layoutConfig.centerWidth}
          rightWidth={layoutConfig.rightWidth}
          left={leftColumn}
          center={centerColumn || children}
          right={rightColumn}
        />
      );

    case 'CONVENE_MODE':
      return withMobileNav(
        <TwoColumnLayout
          leftWidth={layoutConfig.leftWidth}
          rightWidth={layoutConfig.rightWidth}
          left={leftContent || centerColumn || children}
          right={rightContent || rightColumn}
        />
      );

    case 'MESSAGES_MODE':
      return withMobileNav(
        <TwoColumnLayout
          leftWidth={layoutConfig.leftWidth}
          rightWidth={layoutConfig.rightWidth}
          left={leftContent || leftColumn}
          right={rightContent || rightColumn || children}
        />
      );

    case 'COLLABORATE_MODE':
      return withMobileNav(
        <FullCanvasLayout
          sidebar={canvasSidebar || leftColumn}
          sidebarWidth={layoutConfig.leftWidth}
          content={canvasContent || centerColumn || children}
          collapsible={true}
        />
      );

    case 'CONTRIBUTE_MODE':
      return withMobileNav(
        <TwoColumnLayout
          leftWidth={layoutConfig.leftWidth}
          rightWidth={layoutConfig.rightWidth}
          left={leftContent || centerColumn || children}
          right={rightContent || rightColumn}
        />
      );

    case 'CONVEY_MODE':
      return withMobileNav(
        <ThreeColumnLayout
          leftWidth={layoutConfig.leftWidth}
          centerWidth={layoutConfig.centerWidth}
          rightWidth={layoutConfig.rightWidth}
          left={leftColumn}
          center={centerColumn || children}
          right={rightColumn}
        />
      );

    case 'FOCUS_DETAIL_MODE':
      // DetailViewLayout for focused entity views (profiles, events, spaces, stories, needs)
      // Provides consistent breadcrumbs, back navigation, and optional context rail
      return withMobileNav(
        <DetailViewLayout>
          {children || centerColumn}
        </DetailViewLayout>
      );

    default:
      // Fallback to three-column layout
      return withMobileNav(
        <ThreeColumnLayout
          left={leftColumn}
          center={centerColumn || children}
          right={rightColumn}
        />
      );
  }
};

export default LayoutController;
