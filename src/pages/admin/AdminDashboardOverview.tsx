import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * DNA | Admin Dashboard Overview
 *
 * v0.0: Platform-wide admin analytics are not yet available. No live
 * analytics RPC is provisioned — the metrics source is owned by a dedicated
 * admin analytics cycle (Arc 5). Rather than render zero-state cards or
 * fabricated numbers, this page shows a deferred-state notice until the
 * analytics layer is built.
 */
const AdminDashboardOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-neutral-500 mt-1">
          Monitor your platform's key metrics and performance
        </p>
      </div>

      {/* Deferred-state notice */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <BarChart3 className="h-6 w-6 text-neutral-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-neutral-900">
              Admin analytics are not yet available
            </h3>
            <p className="max-w-sm text-xs text-neutral-500">
              Platform metrics will appear here once the analytics layer is in place.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardOverview;
