import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Globe, Loader2, ArrowRight, Building2, Palette, Heart, GraduationCap } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

interface DiaInsightsProps {
  limit?: number;
  category?: string;
  showFeaturedOnly?: boolean;
  onInsightClick?: (query: string) => void;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  query_prompt: string;
  category: string;
  region: string | null;
  is_featured: boolean;
  click_count: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  fintech: <TrendingUp className="h-5 w-5" />,
  energy: <MateMasie className="h-5 w-5" />,
  tech: <MateMasie className="h-5 w-5" />,
  agriculture: <Globe className="h-5 w-5" />,
  'real-estate': <Building2 className="h-5 w-5" />,
  creative: <Palette className="h-5 w-5" />,
  healthcare: <Heart className="h-5 w-5" />,
  education: <GraduationCap className="h-5 w-5" />,
  default: <Lightbulb className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  fintech: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  energy: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  tech: 'bg-copper-500/10 text-copper-600 border-copper-500/20',
  agriculture: 'bg-green-500/10 text-green-600 border-green-500/20',
  'real-estate': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  creative: 'bg-copper-500/10 text-copper-600 border-copper-500/20',
  healthcare: 'bg-red-500/10 text-red-600 border-red-500/20',
  education: 'bg-copper-500/10 text-copper-600 border-copper-500/20',
  default: 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20',
};

const regionLabels: Record<string, string> = {
  'west-africa': 'West Africa',
  'east-africa': 'East Africa',
  'north-africa': 'North Africa',
  'southern-africa': 'Southern Africa',
  'central-africa': 'Central Africa',
};

export function DiaInsights({
  limit = 6,
  category,
  showFeaturedOnly = false,
  onInsightClick
}: DiaInsightsProps) {
  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['dia-insights-daily', limit, category, showFeaturedOnly],
    staleTime: 15 * 60_000,
    queryFn: async () => {
      // Ensure today's set exists (idempotent, fast path returns quickly).
      await supabase.functions.invoke('dia-daily-insights', { body: {} }).catch(() => null);

      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await (supabase
        .from('dia_insights' as any)
        .select('id, title, description, query_prompt, category, region, is_featured, click_count')
        .eq('is_active', true)
        .eq('start_date', today)
        .order('display_order', { ascending: true })
        .limit(limit) as any);

      if (error) throw error;

      let results = (data || []) as Insight[];
      if (category) results = results.filter(i => i.category === category);
      if (showFeaturedOnly) results = results.filter(i => i.is_featured);
      return results;
    },
  });

  const handleInsightClick = async (insight: Insight) => {
    // Track click (fire and forget) - type assertion for dia_insights
    (supabase
      .from('dia_insights' as any)
      .update({ click_count: insight.click_count + 1 })
      .eq('id', insight.id) as any)
      .then(() => {});

    if (onInsightClick) {
      onInsightClick(insight.query_prompt);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !insights || insights.length === 0) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No insights available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Trending Insights
        </h3>
        <span className="text-sm text-muted-foreground">
          Click to explore
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight) => (
          <Card
            key={insight.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:border-emerald-500/50 group ${
              insight.is_featured ? 'ring-1 ring-emerald-500/20' : ''
            }`}
            onClick={() => handleInsightClick(insight)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${categoryColors[insight.category] || categoryColors.default}`}>
                  {categoryIcons[insight.category] || categoryIcons.default}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium group-hover:text-emerald-600 transition-colors">
                      {insight.title}
                    </h4>
                    {insight.is_featured && (
                      <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {insight.category}
                    </Badge>
                    {insight.region && (
                      <Badge variant="outline" className="text-xs">
                        {regionLabels[insight.region] || insight.region}
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DiaInsights;
