import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Calendar, Briefcase, Users, ExternalLink, Bookmark, X } from 'lucide-react';

interface SavedItemCardProps {
  item: any;
  viewMode: 'grid' | 'list';
  onRemove: (itemId: string) => void;
  onView: (item: any) => void;
}

const SavedItemCard: React.FC<SavedItemCardProps> = ({
  item,
  viewMode,
  onRemove,
  onView
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'opportunity': return <Briefcase className="w-4 h-4" />;
      case 'community': return <Users className="w-4 h-4" />;
      default: return <Bookmark className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'post': return 'bg-blue-500';
      case 'event': return 'bg-dna-copper';
      case 'opportunity': return 'bg-green-500';
      case 'community': return 'bg-copper-500';
      default: return 'bg-neutral-500';
    }
  };

  const getItemTitle = (item: any) => {
    if (item.content?.title) return item.content.title;
    if (item.content?.content) return item.content.content.substring(0, 60) + '...';
    return 'Saved Item';
  };

  const getItemDescription = (item: any) => {
    if (item.content?.description) return item.content.description;
    if (item.content?.content) return item.content.content.substring(0, 120) + '...';
    return 'No description available';
  };

  const getItemAuthor = (item: any) => {
    if (item.content?.author) return item.content.author;
    if (item.content?.company) return item.content.company;
    return null;
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${getTypeColor(item.target_type)} text-white`}>
              {getTypeIcon(item.target_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {getItemTitle(item)}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                    {getItemDescription(item)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(item)}
                    className="shrink-0"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <Badge variant="outline" className="text-xs">
                  {item.target_type}
                </Badge>
                
                {getItemAuthor(item) && (
                  <div className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={getItemAuthor(item)?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getItemAuthor(item)?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{getItemAuthor(item)?.full_name || getItemAuthor(item)}</span>
                  </div>
                )}
                
                <span>Saved {formatDistanceToNow(new Date(item.created_at))} ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover-scale animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${getTypeColor(item.target_type)} text-white`}>
            {getTypeIcon(item.target_type)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div>
          <h3 className="font-semibold text-neutral-900 line-clamp-2 mb-2">
            {getItemTitle(item)}
          </h3>
          <p className="text-sm text-neutral-600 line-clamp-3">
            {getItemDescription(item)}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {getItemAuthor(item) && (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={getItemAuthor(item)?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getItemAuthor(item)?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-neutral-600">
                {getItemAuthor(item)?.full_name || getItemAuthor(item)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {item.target_type}
              </Badge>
              <span className="text-xs text-neutral-500">
                {formatDistanceToNow(new Date(item.created_at))} ago
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(item)}
              className="bg-dna-emerald/5 hover:bg-dna-emerald hover:text-white"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedItemCard;