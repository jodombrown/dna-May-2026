import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';

// Lazy load admin components
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboardLayout = lazy(() => import('@/components/admin/AdminDashboardLayout'));
const AdminDashboardOverview = lazy(() => import('@/pages/admin/AdminDashboardOverview'));

// Existing admin pages - import from existing location
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const ContentModeration = lazy(() => import('@/pages/admin/ContentModeration'));
const EngagementDashboard = lazy(() => import('@/pages/admin/EngagementDashboard'));
const AlphaFeedbackDashboard = lazy(() => import('@/pages/admin/AlphaFeedbackDashboard'));
const SponsorshipManagement = lazy(() => import('@/pages/admin/SponsorshipManagement'));

// Placeholder pages for routes that will be implemented later
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg border border-neutral-200">
    <div className="text-center space-y-2">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      <p className="text-neutral-500">This page is coming soon.</p>
    </div>
  </div>
);

// Loading fallback
const AdminPageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      <p className="text-sm text-neutral-500">Loading...</p>
    </div>
  </div>
);

// Wrap component with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<AdminPageLoader />}>
    <Component />
  </Suspense>
);

// Wrap component with AdminRouteGuard
const withGuard = (
  element: React.ReactNode,
  requiredRole?: ('super_admin' | 'platform_admin' | 'content_admin' | 'analytics_admin' | 'support_admin' | 'event_admin')[]
) => (
  <AdminRouteGuard requiredRole={requiredRole}>
    {element}
  </AdminRouteGuard>
);

// Admin routes configuration
export const adminRoutes: RouteObject[] = [
  // Public admin login
  {
    path: '/admin-login',
    element: withSuspense(AdminLogin)
  },
  // Protected admin routes
  {
    path: '/admin',
    element: withGuard(withSuspense(AdminDashboardLayout)),
    children: [
      // Dashboard
      {
        index: true,
        element: <PlaceholderPage title="Admin Home" />
      },
      {
        path: 'dashboard',
        element: withSuspense(AdminDashboardOverview)
      },
      // Users
      {
        path: 'users',
        element: withSuspense(UserManagement)
      },
      {
        path: 'users/pending',
        element: <PlaceholderPage title="Pending Users" />
      },
      {
        path: 'users/suspended',
        element: <PlaceholderPage title="Suspended Users" />
      },
      {
        path: 'users/segments',
        element: <PlaceholderPage title="User Segments" />
      },
      // Events
      {
        path: 'events',
        element: <PlaceholderPage title="Events Management" />
      },
      {
        path: 'events/pending',
        element: <PlaceholderPage title="Pending Events" />
      },
      {
        path: 'events/analytics',
        element: <PlaceholderPage title="Event Analytics" />
      },
      // Projects
      {
        path: 'projects',
        element: <PlaceholderPage title="Projects Management" />
      },
      // Feedback
      {
        path: 'feedback',
        element: <PlaceholderPage title="Feedback Center" />
      },
      // Alpha Feedback Dashboard
      {
        path: 'alpha-feedback',
        element: withSuspense(AlphaFeedbackDashboard)
      },
      // Sponsorship Management
      {
        path: 'sponsorships',
        element: withSuspense(SponsorshipManagement)
      },
      // Moderation
      {
        path: 'moderation',
        element: withSuspense(ContentModeration)
      },
      // Analytics
      {
        path: 'analytics',
        element: withSuspense(EngagementDashboard)
      },
      {
        path: 'analytics/users',
        element: <PlaceholderPage title="User Analytics" />
      },
      {
        path: 'analytics/engagement',
        element: withSuspense(EngagementDashboard)
      },
      {
        path: 'analytics/growth',
        element: <PlaceholderPage title="Growth Analytics" />
      },
      // Settings (requires super_admin or platform_admin)
      {
        path: 'settings',
        element: withGuard(
          <PlaceholderPage title="Platform Settings" />,
          ['super_admin', 'platform_admin']
        )
      },
      {
        path: 'settings/features',
        element: withGuard(
          <PlaceholderPage title="Feature Flags" />,
          ['super_admin', 'platform_admin']
        )
      },
      {
        path: 'settings/announcements',
        element: withGuard(
          <PlaceholderPage title="Announcements" />,
          ['super_admin', 'platform_admin']
        )
      },
      // Audit Log (requires super_admin or platform_admin)
      {
        path: 'audit-log',
        element: withGuard(
          <PlaceholderPage title="Audit Log" />,
          ['super_admin', 'platform_admin']
        )
      },
      // Admin Management (requires super_admin)
      {
        path: 'admins',
        element: withGuard(
          <PlaceholderPage title="Admin Management" />,
          ['super_admin']
        )
      }
    ]
  }
];

export default adminRoutes;
