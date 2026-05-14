import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// Admin RPC functions use 'as any' to bypass TypeScript since they're not in auto-generated types

type AdminRoleLevel =
  | 'super_admin'
  | 'platform_admin'
  | 'content_admin'
  | 'analytics_admin'
  | 'support_admin'
  | 'event_admin';

interface AdminStatus {
  userId: string;
  email: string;
  isAdmin: boolean;
  roleLevel: AdminRoleLevel | null;
  isSuperAdmin: boolean;
}

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredRole?: AdminRoleLevel[];
}

// Role hierarchy - higher index means more permissions
const ROLE_HIERARCHY: AdminRoleLevel[] = [
  'event_admin',
  'support_admin',
  'analytics_admin',
  'content_admin',
  'platform_admin',
  'super_admin'
];

const hasRequiredRole = (
  userRole: AdminRoleLevel | null,
  isSuperAdmin: boolean,
  requiredRoles?: AdminRoleLevel[]
): boolean => {
  // Super admins always have access
  if (isSuperAdmin) return true;

  // If no specific role required, any admin can access
  if (!requiredRoles || requiredRoles.length === 0) return true;

  // Check if user has any of the required roles
  if (!userRole) return false;

  // Check direct role match
  if (requiredRoles.includes(userRole)) return true;

  // Check if user's role is higher in hierarchy than any required role
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const minRequiredIndex = Math.min(
    ...requiredRoles.map(r => ROLE_HIERARCHY.indexOf(r))
  );

  return userRoleIndex >= minRequiredIndex;
};

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  children,
  requiredRole
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setAdminStatus(null);
          setIsLoading(false);
          return;
        }

        // Get admin status
        const { data, error: rpcError } = await (supabase as any).rpc('get_current_admin_status');

        if (rpcError) {
          setError('Failed to verify admin access');
          setIsLoading(false);
          return;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const result = data[0];
          setAdminStatus({
            userId: result.user_id,
            email: result.email,
            isAdmin: result.is_admin,
            roleLevel: result.role_level as AdminRoleLevel | null,
            isSuperAdmin: result.is_super_admin
          });
        } else {
          setAdminStatus(null);
        }
      } catch (err) {
        setError('An error occurred while verifying access');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAdminStatus(null);
      } else {
        checkAdminAccess();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update session activity periodically
  useEffect(() => {
    if (!adminStatus?.isAdmin) return;

    const updateActivity = async () => {
      try {
        await (supabase as any).rpc('update_admin_session_activity');
      } catch (err) {
        // Silently fail - session activity update is not critical
      }
    };

    // Update immediately
    updateActivity();

    // Update every 5 minutes
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [adminStatus?.isAdmin]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
          <p className="text-neutral-500">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Access Error</h2>
          <p className="text-neutral-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated or not admin
  if (!adminStatus?.isAdmin) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (!hasRequiredRole(adminStatus.roleLevel, adminStatus.isSuperAdmin, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Insufficient Permissions</h2>
          <p className="text-neutral-500">
            You don't have the required permissions to access this section.
            {requiredRole && requiredRole.length > 0 && (
              <span className="block mt-2 text-sm">
                Required: {requiredRole.map(r => r.replace('_', ' ')).join(' or ')}
              </span>
            )}
          </p>
          <p className="text-sm text-neutral-400">
            Your role: {adminStatus.roleLevel?.replace('_', ' ') || 'Unknown'}
          </p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
};

export default AdminRouteGuard;
