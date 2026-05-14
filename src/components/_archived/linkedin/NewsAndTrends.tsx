import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, MessageCircle } from 'lucide-react';

const NewsAndTrends = () => {
  const trendingTopics = [
    {
      title: 'African Tech Innovation',
      description: 'Growing startup ecosystem across the continent',
      engagement: '1,234 readers',
    },
    {
      title: 'Diaspora Investment',
      description: 'New opportunities for cross-border collaboration',
      engagement: '856 readers',
    },
    {
      title: 'Remote Work Culture',
      description: 'How African professionals are adapting',
      engagement: '642 readers',
    },
    {
      title: 'Sustainable Development',
      description: 'Green initiatives gaining momentum',
      engagement: '524 readers',
    },
  ];

  return (
    <Card className="bg-white border border-neutral-200 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          DNA News
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <div key={index} className="py-2 border-b border-neutral-100 last:border-b-0">
              <h4 className="text-sm font-medium text-neutral-900 mb-1">{topic.title}</h4>
              <p className="text-xs text-neutral-600 mb-1">{topic.description}</p>
              <div className="flex items-center text-xs text-neutral-500">
                <MessageCircle className="w-3 h-3 mr-1" />
                {topic.engagement}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsAndTrends;