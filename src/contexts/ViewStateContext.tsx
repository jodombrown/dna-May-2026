import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

// Define all view states from Master Prompt
export type ViewState = 
  | 'DASHBOARD_HOME'
  | 'CONNECT_MODE'
  | 'CONVENE_MODE'
  | 'COLLABORATE_MODE'
  | 'CONTRIBUTE_MODE'
  | 'CONVEY_MODE'
  | 'MESSAGES_MODE'
  | 'FOCUS_DETAIL_MODE';

// Layout configuration for each view state
export type LayoutConfig = {
  type: 'three-column' | 'two-column' | 'full-canvas' | 'modal-overlay';
  leftWidth?: string;
  centerWidth?: string;
  rightWidth?: string;
  showLeftNav?: boolean;
  showRightColumn?: boolean;
};

interface ViewStateContextType {
  viewState: ViewState;
  layoutConfig: LayoutConfig;
}

const ViewStateContext = createContext<ViewStateContextType | undefined>(undefined);

export const useViewState = () => {
  const context = useContext(ViewStateContext);
  if (!context) {
    throw new Error('useViewState must be used within a ViewStateProvider');
  }
  return context;
};

interface ViewStateProviderProps {
  children: ReactNode;
}

// Route to ViewState mapping
// HOME ROUTE ARCHITECTURE:
// - /dna/feed is the canonical home (DASHBOARD_HOME)
// - /dna/me redirects to /dna/feed
// - Login always lands on /dna/feed
const routeToViewState = (pathname: string): ViewState => {
  // DASHBOARD_HOME (canonical home)
  if (pathname === '/dna/feed') {
    return 'DASHBOARD_HOME';
  }
  
  // FOCUS_DETAIL_MODE for specific detail pages - check first!
  // Event detail pages (e.g., /dna/convene/events/some-event-slug)
  if (pathname.match(/\/dna\/convene\/events\/[^/]+$/) && 
      !pathname.endsWith('/new') && 
      !pathname.endsWith('/events')) {
    return 'FOCUS_DETAIL_MODE';
  }
  
  // Space detail pages
  if (pathname.match(/\/dna\/collaborate\/spaces\/[^/]+$/) &&
      !pathname.endsWith('/new')) {
    return 'FOCUS_DETAIL_MODE';
  }
  
  // Story detail pages  
  if (pathname.match(/\/dna\/convey\/stories\/[^/]+$/)) {
    return 'FOCUS_DETAIL_MODE';
  }
  
  // Profile pages (e.g., /dna/username)
  if (pathname.match(/^\/dna\/[^/]+$/) && 
      !['feed', 'connect', 'convene', 'collaborate', 'contribute', 'convey', 'messages', 'settings', 'admin'].some(p => pathname === `/dna/${p}`)) {
    return 'FOCUS_DETAIL_MODE';
  }
  
  // CONNECT_MODE
  if (pathname.startsWith('/dna/connect') || 
      pathname.startsWith('/dna/network') || 
      pathname.startsWith('/dna/discover')) {
    return 'CONNECT_MODE';
  }
  
  // CONVENE_MODE (hub pages, not detail pages)
  if (pathname.startsWith('/dna/events') || 
      pathname.startsWith('/dna/convene')) {
    return 'CONVENE_MODE';
  }
  
  // MESSAGES_MODE
  if (pathname.startsWith('/dna/messages') || pathname.startsWith('/dna/connect/messages')) {
    return 'MESSAGES_MODE';
  }
  
  // COLLABORATE_MODE
  if (pathname.startsWith('/dna/collaborate') || 
      pathname.startsWith('/dna/projects')) {
    return 'COLLABORATE_MODE';
  }
  
  // CONTRIBUTE_MODE
  if (pathname.startsWith('/dna/contribute') || 
      pathname.startsWith('/dna/opportunities') ||
      pathname.startsWith('/dna/impact')) {
    return 'CONTRIBUTE_MODE';
  }
  
  // CONVEY_MODE
  if (pathname.startsWith('/dna/convey') || 
      pathname.startsWith('/dna/daily') || 
      pathname.startsWith('/dna/stories')) {
    return 'CONVEY_MODE';
  }
  
  // Default fallback
  return 'DASHBOARD_HOME';
};

// ViewState to Layout configuration mapping
const viewStateToLayout = (viewState: ViewState): LayoutConfig => {
  switch (viewState) {
    case 'DASHBOARD_HOME':
      return {
        type: 'three-column',
        leftWidth: '280px',
        centerWidth: '1fr',
        rightWidth: '340px',
        showLeftNav: true,
        showRightColumn: true,
      };
    
    case 'CONNECT_MODE':
      return {
        type: 'three-column',
        leftWidth: '280px',
        centerWidth: '1fr',
        rightWidth: '340px',
        showLeftNav: true,
        showRightColumn: true, // Adapted with network stats
      };
    
    case 'CONVENE_MODE':
      return {
        type: 'two-column',
        leftWidth: '60%',
        rightWidth: '40%',
        showLeftNav: false, // Collapsed
        showRightColumn: true,
      };
    
    case 'MESSAGES_MODE':
      return {
        type: 'two-column',
        leftWidth: '35%',
        rightWidth: '65%',
        showLeftNav: false,
        showRightColumn: true,
      };
    
    case 'COLLABORATE_MODE':
      return {
        type: 'full-canvas',
        leftWidth: '20%',
        centerWidth: '80%',
        showLeftNav: true,
        showRightColumn: false,
      };
    
    case 'CONTRIBUTE_MODE':
      return {
        type: 'two-column',
        leftWidth: '55%',
        rightWidth: '45%',
        showLeftNav: true,
        showRightColumn: true,
      };
    
    case 'CONVEY_MODE':
      return {
        type: 'three-column',
        leftWidth: '280px',
        centerWidth: '1fr',
        rightWidth: '340px',
        showLeftNav: true,
        showRightColumn: true,
      };
    
    case 'FOCUS_DETAIL_MODE':
      // DetailViewLayout: Full-page focused view with breadcrumbs and optional context rail
      // Used for: profiles, events, spaces, stories, needs, offers
      return {
        type: 'modal-overlay', // Type name kept for backward compatibility
        showLeftNav: false, // DetailViewLayout handles its own navigation
        showRightColumn: false,
      };
    
    default:
      return {
        type: 'three-column',
        leftWidth: '280px',
        centerWidth: '1fr',
        rightWidth: '340px',
        showLeftNav: true,
        showRightColumn: true,
      };
  }
};

export const ViewStateProvider: React.FC<ViewStateProviderProps> = ({ children }) => {
  const location = useLocation();
  
  const viewState = useMemo(() => routeToViewState(location.pathname), [location.pathname]);
  const layoutConfig = useMemo(() => viewStateToLayout(viewState), [viewState]);

  const value = useMemo(
    () => ({ viewState, layoutConfig }),
    [viewState, layoutConfig]
  );

  return (
    <ViewStateContext.Provider value={value}>
      {children}
    </ViewStateContext.Provider>
  );
};
