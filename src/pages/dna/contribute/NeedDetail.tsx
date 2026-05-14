/**
 * NeedDetail — page-level shell for a single need.
 *
 * Phase 4 Group 1 scope: render the need basics + the Fulfillments section
 * for the requester. Full need-detail UX (description, proposals, edit,
 * close-out) lands in a later sprint.
 */
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NeedFulfillmentsSection } from '@/components/contribute/needs/NeedFulfillmentsSection';

interface NeedRow {
  id: string;
  title: string;
  context: string | null;
  user_id: string;
  status: string | null;
  created_at: string;
}

export default function NeedDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [need, setNeed] = useState<NeedRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('need_declarations')
        .select('id, title, context, user_id, status, created_at')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNeed(null);
      } else {
        setNeed(data as NeedRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4A8D77]" />
      </div>
    );
  }

  if (!need) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <h1 className="font-serif text-2xl text-foreground mb-2">Need not found</h1>
        <p className="text-muted-foreground mb-6">
          This need may have been closed or removed.
        </p>
        <Button onClick={() => navigate('/dna/contribute')} variant="outline">
          Back to Contribute
        </Button>
      </div>
    );
  }

  const isRequester = !!user && user.id === need.user_id;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <Link
        to="/dna/contribute"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[#2D6A4F] font-medium">
          Need
        </p>
        <h1 className="font-serif text-3xl text-foreground leading-tight">{need.title}</h1>
        {need.context && (
          <p className="text-foreground/85 leading-relaxed whitespace-pre-line">
            {need.context}
          </p>
        )}
      </header>

      <NeedFulfillmentsSection
        needId={need.id}
        needTitle={need.title}
        isRequester={isRequester}
      />

      {!isRequester && (
        <p className="text-sm text-muted-foreground border-t border-border pt-6">
          Want to help? Open this need in the Room to offer fulfillment.
        </p>
      )}
    </div>
  );
}
