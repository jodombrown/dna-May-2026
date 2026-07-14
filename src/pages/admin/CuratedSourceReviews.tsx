import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ExternalLink, Check, X } from "lucide-react";
import { Link } from "react-router-dom";

// A queue of open reviews: rows curated-source watchers opened when a
// source page changed. This is where a human stands between the machine's
// detection and any claim on date_confirmed / start_time.

interface ReviewRow {
  id: string;
  event_id: string;
  reason: string;
  detail: string | null;
  content_hash: string | null;
  status: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    slug: string | null;
    curated_source_url: string | null;
    expected_window_start: string | null;
    expected_window_end: string | null;
  } | null;
}

export default function CuratedSourceReviews() {
  const qc = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["curated-source-reviews", "open"],
    queryFn: async (): Promise<ReviewRow[]> => {
      const { data, error } = await supabase
        .from("curated_source_reviews")
        .select(
          "id, event_id, reason, detail, content_hash, status, created_at, event:events!curated_source_reviews_event_id_fkey(id, title, slug, curated_source_url, expected_window_start, expected_window_end)"
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReviewRow[];
    },
  });

  const resolveMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "resolved" | "dismissed" }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("curated_source_reviews")
        .update({
          status,
          resolved_at: new Date().toISOString(),
          resolved_by: userRes.user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.status === "resolved" ? "Resolved" : "Dismissed");
      qc.invalidateQueries({ queryKey: ["curated-source-reviews"] });
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Curated Source Reviews</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Source pages that changed since last check. Confirm the event on the source, then Resolve.
          Dismiss if the change is noise.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && (reviews?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No open reviews.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews?.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    {r.event?.title ?? "Unknown event"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Flagged {format(new Date(r.created_at), "PPp")} · reason: {r.reason}
                  </p>
                </div>
                <Badge variant="destructive">Open</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {r.event?.expected_window_start && (
                <p className="text-xs text-muted-foreground">
                  Historical window: {r.event.expected_window_start}
                  {r.event.expected_window_end ? ` - ${r.event.expected_window_end}` : ""}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {r.event?.curated_source_url && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={r.event.curated_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> Source page
                    </a>
                  </Button>
                )}
                {r.event && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/dna/convene/event/${r.event.slug ?? r.event.id}`}>
                      View event
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => resolveMut.mutate({ id: r.id, status: "resolved" })}
                  disabled={resolveMut.isPending}
                >
                  <Check className="h-3 w-3 mr-1" /> Resolve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resolveMut.mutate({ id: r.id, status: "dismissed" })}
                  disabled={resolveMut.isPending}
                >
                  <X className="h-3 w-3 mr-1" /> Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
