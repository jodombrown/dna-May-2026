
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedCommunitiesSectionProps {
  impactAreas?: string[];
  onJoin?: (communityId: string) => void;
}

const SuggestedCommunitiesSection: React.FC<SuggestedCommunitiesSectionProps> = ({
  impactAreas = [],
  onJoin,
}) => {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        // Basic matching: find communities in user's impact areas, fallback to popular
        let query = supabase.from("communities").select("*").order("member_count", { ascending: false });
        if (impactAreas && impactAreas.length > 0) {
          query = query.ilike("category", `%${impactAreas[0]}%`);
        }
        const { data, error } = await query.limit(5);
        setCommunities(data || []);
      } catch (e) {
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, [impactAreas]);

  if (loading) return <div className="text-sm text-neutral-400 py-4">Loading communities…</div>;

  if (!communities.length)
    return (
      <div className="text-sm text-neutral-500 py-4">
        No personalized communities yet. Fill out your profile for DNA recommendations.
      </div>
    );

  return (
    <div>
      <div className="grid gap-3">
        {communities.map((c) => (
          <Card key={c.id} className="flex flex-row gap-4 items-center p-4">
            <img
              src={c.image_url || "/placeholder.svg"}
              className="w-12 h-12 rounded-md bg-neutral-100 object-cover border"
              alt={c.name}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-dna-forest truncate">{c.name}</div>
              <div className="text-xs text-neutral-600 line-clamp-2">{c.description}</div>
            </div>
            <Button size="sm" className="bg-dna-emerald text-white" onClick={() => onJoin?.(c.id)}>
              Join
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SuggestedCommunitiesSection;
