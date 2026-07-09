import { useState } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePostSearch, SearchFilters } from '@/hooks/usePostSearch';
import { PostCard } from './PostCard';
import { Loader2 } from 'lucide-react';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDialog = ({ isOpen, onClose }: SearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const { data: results, isLoading } = usePostSearch(query, filters, 50);

  const handleClearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = !!(
    filters.postType ||
    filters.dateFrom ||
    filters.dateTo
  );

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose} className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Search Posts</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, authors, hashtags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {[filters.postType, filters.dateFrom, filters.dateTo].filter(Boolean).length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent rounded-lg">
              {/* Post Type Filter */}
              <div className="space-y-2">
                <Label>Post Type</Label>
                <Select
                  value={filters.postType || 'all'}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      postType: value === 'all' ? undefined : (value as any),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <Label>From Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Date To Filter */}
              <div className="space-y-2">
                <Label>To Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={filters.dateTo?.toISOString().split('T')[0] || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateTo: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {!query ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Search for posts</p>
              <p className="text-sm mt-2">
                Search by content, author names, usernames, or hashtags
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-4">Searching...</p>
            </div>
          ) : results && results.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    author_id: post.author_id,
                    content: post.content,
                    created_at: post.created_at,
                    updated_at: post.updated_at,
                    post_type: post.post_type,
                    visibility: post.privacy_level,
                    media_urls: post.media_url ? [post.media_url] : null,
                  }}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-2">
                Try different keywords or adjust your filters
              </p>
            </div>
          )}
        </div>
      </ResponsiveModal>
  );
};
