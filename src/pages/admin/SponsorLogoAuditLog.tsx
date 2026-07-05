/**
 * DNA Admin - Sponsor Logo Audit Log
 * Read-only history of every sponsor logo upload / update / delete.
 * Backed by public.sponsor_logo_audit_log (admin-only RLS).
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldAlert, Upload, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditRow {
  id: string;
  admin_user_id: string;
  action: 'upload' | 'update' | 'delete';
  storage_path: string | null;
  logo_url: string | null;
  sponsor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const actionMeta: Record<AuditRow['action'], { label: string; icon: typeof Upload; className: string }> = {
  upload: { label: 'Upload', icon: Upload, className: 'bg-emerald-100 text-emerald-800' },
  update: { label: 'Update', icon: Pencil, className: 'bg-amber-100 text-amber-800' },
  delete: { label: 'Delete', icon: Trash2, className: 'bg-red-100 text-red-800' },
};

export default function SponsorLogoAuditLog() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const { data: rows = [], isLoading, error } = useQuery<AuditRow[]>({
    queryKey: ['sponsor-logo-audit-log'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sponsor_logo_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  if (adminLoading) {
    return <div className="text-center py-12 text-muted-foreground">Verifying access...</div>;
  }

  if (!isAdmin) {
    return (
      <Card className="p-12 text-center space-y-2">
        <ShieldAlert className="h-8 w-8 mx-auto text-destructive" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Admins only</h2>
        <p className="text-sm text-muted-foreground">
          The sponsor logo audit log is restricted to platform admins.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sponsor logo audit log</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every logo upload, update, and deletion, recorded server-side with the admin user id.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/sponsorships">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to sponsorships
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading audit history...</div>
      ) : error ? (
        <Card className="p-6 text-sm text-destructive">
          Could not load audit log: {(error as Error).message}
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No sponsor logo activity has been recorded yet.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Admin user</th>
                  <th className="px-4 py-2">Sponsor</th>
                  <th className="px-4 py-2">Logo</th>
                  <th className="px-4 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const meta = actionMeta[row.action];
                  const Icon = meta.icon;
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`gap-1 ${meta.className}`}>
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] break-all">{row.admin_user_id}</td>
                      <td className="px-4 py-3 font-mono text-[11px] break-all">{row.sponsor_id ?? '-'}</td>
                      <td className="px-4 py-3">
                        {row.logo_url ? (
                          <a
                            href={row.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <img
                              src={row.logo_url}
                              alt=""
                              className="w-8 h-8 rounded object-contain bg-white border border-border/50 p-0.5"
                            />
                            <span className="text-[11px] break-all">{row.storage_path ?? row.logo_url}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">{row.storage_path ?? '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all max-w-xs">
                          {row.metadata && Object.keys(row.metadata).length > 0
                            ? JSON.stringify(row.metadata, null, 2)
                            : '-'}
                        </pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
