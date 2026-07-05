/**
 * DNA Admin - Sponsor Logo Audit Log
 * Read-only history of every sponsor logo upload / update / delete.
 * Backed by public.sponsor_logo_audit_log via the admin-only
 * `list_sponsor_logo_audit_log` RPC (paginated + filterable server-side).
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ActionType = 'upload' | 'update' | 'delete';

interface AuditRow {
  id: string;
  admin_user_id: string;
  action: ActionType;
  storage_path: string | null;
  logo_url: string | null;
  sponsor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  total_count: number;
}

interface Filters {
  adminUserId: string;
  action: ActionType | 'all';
  from: string;
  to: string;
}

const PAGE_SIZE = 50;

const actionMeta: Record<ActionType, { label: string; icon: typeof Upload; className: string }> = {
  upload: { label: 'Upload', icon: Upload, className: 'bg-emerald-100 text-emerald-800' },
  update: { label: 'Update', icon: Pencil, className: 'bg-amber-100 text-amber-800' },
  delete: { label: 'Delete', icon: Trash2, className: 'bg-red-100 text-red-800' },
};

function toIsoOrNull(local: string, endOfDay = false): string | null {
  if (!local) return null;
  // Accept YYYY-MM-DD or full datetime-local. Convert bare date to start/end.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(local);
  const value = isDateOnly ? `${local}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}` : local;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: AuditRow[]): string {
  const header = [
    'created_at',
    'action',
    'admin_user_id',
    'sponsor_id',
    'storage_path',
    'logo_url',
    'metadata',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.created_at,
        r.action,
        r.admin_user_id,
        r.sponsor_id ?? '',
        r.storage_path ?? '',
        r.logo_url ?? '',
        r.metadata ? JSON.stringify(r.metadata) : '',
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n');
}

export default function SponsorLogoAuditLog() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [filters, setFilters] = useState<Filters>({
    adminUserId: '',
    action: 'all',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const rpcArgs = useMemo(
    () => ({
      _admin_user_id: filters.adminUserId.trim() || null,
      _action: filters.action === 'all' ? null : filters.action,
      _from: toIsoOrNull(filters.from, false),
      _to: toIsoOrNull(filters.to, true),
    }),
    [filters],
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sponsor-logo-audit-log', rpcArgs, page],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('list_sponsor_logo_audit_log', {
        ...rpcArgs,
        _limit: PAGE_SIZE,
        _offset: page * PAGE_SIZE,
      });
      if (error) throw error;
      const rows = (data ?? []) as AuditRow[];
      return {
        rows,
        total: rows.length > 0 ? Number(rows[0].total_count) : 0,
      };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = (next: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...next }));
    setPage(0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await (supabase as any).rpc('list_sponsor_logo_audit_log', {
        ...rpcArgs,
        _limit: 500,
        _offset: 0,
      });
      if (error) throw error;
      const csv = rowsToCsv((data ?? []) as AuditRow[]);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sponsor-logo-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

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

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label htmlFor="admin-filter" className="text-xs">Admin user id</Label>
            <Input
              id="admin-filter"
              placeholder="UUID (leave blank for all)"
              value={filters.adminUserId}
              onChange={(e) => applyFilters({ adminUserId: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Action</Label>
            <Select
              value={filters.action}
              onValueChange={(v) => applyFilters({ action: v as Filters['action'] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="from-filter" className="text-xs">From</Label>
            <Input
              id="from-filter"
              type="date"
              value={filters.from}
              onChange={(e) => applyFilters({ from: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="to-filter" className="text-xs">To</Label>
            <Input
              id="to-filter"
              type="date"
              value={filters.to}
              onChange={(e) => applyFilters({ to: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            {isLoading ? 'Loading…' : `${total} entr${total === 1 ? 'y' : 'ies'} match`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({ adminUserId: '', action: 'all', from: '', to: '' });
                setPage(0);
              }}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || total === 0}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading audit history...</div>
      ) : error ? (
        <Card className="p-6 text-sm text-destructive">
          Could not load audit log: {(error as Error).message}
          <Button variant="link" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No sponsor logo activity matches these filters.
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
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const meta = actionMeta[row.action];
                  const Icon = meta.icon;
                  return (
                    <tr key={row.id} className="align-top hover:bg-muted/30">
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
                          <img
                            src={row.logo_url}
                            alt=""
                            className="w-8 h-8 rounded object-contain bg-white border border-border/50 p-0.5"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit entry details</DialogTitle>
            <DialogDescription>
              Server-recorded details for this sponsor logo action.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Timestamp (exact)</Label>
                <p className="font-mono text-xs break-all">
                  {new Date(selected.created_at).toISOString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Local: {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Action</Label>
                <p>{actionMeta[selected.action].label}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Admin user id</Label>
                <p className="font-mono text-xs break-all">{selected.admin_user_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sponsor id</Label>
                <p className="font-mono text-xs break-all">{selected.sponsor_id ?? '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Object path</Label>
                <p className="font-mono text-xs break-all">{selected.storage_path ?? '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Filename</Label>
                <p className="font-mono text-xs break-all">
                  {selected.storage_path?.split('/').pop() ??
                    selected.logo_url?.split('/').pop() ??
                    '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Logo URL</Label>
                {selected.logo_url ? (
                  <a
                    href={selected.logo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs break-all"
                  >
                    {selected.logo_url}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Metadata</Label>
                <pre className="text-[11px] bg-muted rounded p-2 whitespace-pre-wrap break-all max-h-40 overflow-auto">
                  {selected.metadata && Object.keys(selected.metadata).length > 0
                    ? JSON.stringify(selected.metadata, null, 2)
                    : '-'}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
