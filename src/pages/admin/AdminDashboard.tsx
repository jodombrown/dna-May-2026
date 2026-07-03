import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Briefcase, MessageSquare, Folder, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Fetch platform stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, posts, spaces, opportunities] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('posts').select('id', { count: 'exact' }),
        Promise.resolve({ count: 0 }), // collaboration_spaces retired (admin beyond-minimum, out of scope)
        supabase.from('opportunities').select('id', { count: 'exact' })
      ]);

      return {
        users: users.count || 0,
        posts: posts.count || 0,
        spaces: spaces.count || 0,
        opportunities: opportunities.count || 0
      };
    }
  });

  const statCards = [
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'bg-blue-500', to: '/app/admin/users' },
    { label: 'Total Posts', value: stats?.posts || 0, icon: MessageSquare, color: 'bg-emerald-500', to: '/app/admin/moderation' },
    { label: 'Active Spaces', value: stats?.spaces || 0, icon: Folder, color: 'bg-copper-500', to: '/admin/spaces' },
    { label: 'Opportunities', value: stats?.opportunities || 0, icon: Briefcase, color: 'bg-orange-500', to: '/admin/contributions' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-foreground">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="cursor-pointer hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            role="button"
            tabIndex={0}
            onClick={() => navigate(stat.to)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(stat.to);
              }
            }}
            aria-label={`${stat.label}: ${stat.value}. Open ${stat.label}.`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Use the navigation above to access different admin tools:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Engagement:</strong> View user engagement metrics and analytics</li>
              <li><strong>Signals:</strong> Monitor DIA signals and connection health</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

