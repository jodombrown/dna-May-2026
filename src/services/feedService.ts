/**
 * DNA | FEED - Core Feed Service
 *
 * Handles feed fetching, content hydration, pagination,
 * DIA insight retrieval, and engagement actions.
 */

import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;
import { feedRankingService } from './feedRankingService';
import { logHighError } from '@/lib/errorLogger';
import { getDIACardsForFeed } from '@/services/diaCardService';
import { CModule, UserTier } from '@/types/composer';
import type {
  EventType,
  SpaceType,
  SpaceVisibility,
  OpportunityDirection,
  OpportunityCategory,
  CompensationType,
  LocationRelevance,
  OpportunityDuration,
  MediaAttachment,
  TicketType,
  PhysicalLocation,
  SpaceTimeline,
  StoryCallToAction,
} from '@/types/composer';
import type {
  FeedRequest,
  FeedPage,
  FeedItem,
  FeedType,
  FeedSortMode,
  FeedFilters,
  FeedContentType,
  FeedAuthor,
  FeedEngagement,
  RankingSignals,
  DIAInsightFeedContent,
  PostFeedContent,
  StoryFeedContent,
  EventFeedContent,
  SpaceFeedContent,
  OpportunityFeedContent,
  SpaceRoleFeedData,
} from '@/types/feedTypes';
import { FEED_TYPE_TO_C_MODULE } from '@/lib/feedConfig';

// ============================================================
// RAW DB ROW TYPES
// ============================================================

interface FeedItemRow {
  id: string;
  content_type: string;
  content_id: string;
  primary_c: string;
  secondary_cs: string[];
  created_by: string;
  audience: string;
  audience_target_id: string | null;
  tags: string[];
  regional_hub: string | null;
  related_space_id: string | null;
  related_event_id: string | null;
  engagement_score: number;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  headline: string | null;
  is_verified: boolean;
}

// ============================================================
// FEED SERVICE
// ============================================================

export const feedService = {
  async getFeed(request: FeedRequest): Promise<FeedPage> {
    try {
      // 1. Build base query
      let query = db
        .from('feed_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(request.pageSize * 3);

      // 2. Apply feed type filter
      if (request.feedType !== 'universal') {
        const cModule = FEED_TYPE_TO_C_MODULE[request.feedType];
        if (cModule) {
          query = query.eq('primary_c', cModule);
        }
      }

      // 3. Apply filters
      if (request.filters.cModules?.length) {
        query = query.in('primary_c', request.filters.cModules);
      }
      if (request.filters.regionFilter) {
        query = query.eq('regional_hub', request.filters.regionFilter);
      }
      if (request.filters.contentType) {
        query = query.eq('content_type', request.filters.contentType);
      }

      // 4. Apply cursor pagination
      if (request.cursor) {
        query = query.lt('created_at', request.cursor);
      }

      const { data: rawItems, error } = await query;
      if (error) {
        logHighError(error, 'feed', 'getFeed query failed', { request });
        throw error;
      }

      const feedRows = (rawItems || []) as unknown as FeedItemRow[];

      // 5. Hydrate content (fetch full content from source tables)
      const hydratedItems = await this.hydrateContent(feedRows);

      // 6. Rank items
      const rankedItems = feedRankingService.rankItems(
        hydratedItems,
        request.sortMode,
        null, // userRegion placeholder
        [], // userSkills placeholder
        [] // userInterests placeholder
      );

      // 7. Enforce C-module diversity (for Universal feed)
      const diverseItems =
        request.feedType === 'universal'
          ? feedRankingService.enforceDiversity(rankedItems, request.pageSize)
          : rankedItems.slice(0, request.pageSize);

      // 8. Localize event times
      const localizedItems = this.localizeEventTimes(diverseItems, request.userTimezone);

      // 9. Fetch DIA insights
      const insights = await this.fetchDIAInsights(request.userId, request.userTier);

      // 10. Interleave DIA insights
      const finalItems = feedRankingService.interleaveDIAInsights(
        localizedItems,
        insights,
        request.userTier as unknown as UserTier
      );

      // 11. Compute cursor
      const lastItem = localizedItems[localizedItems.length - 1];
      const nextCursor = lastItem ? new Date(lastItem.createdAt).toISOString() : null;

      return {
        items: finalItems,
        cursor: nextCursor,
        hasMore: feedRows.length > request.pageSize,
        totalEstimate: null,
        appliedFilters: request.filters,
        appliedSort: request.sortMode,
        diaInsights: insights,
      };
    } catch (err) {
      logHighError(err, 'feed', 'getFeed threw', { feedType: request.feedType });
      throw err;
    }
  },

  // ============================================================
  // CONTENT HYDRATION
  // ============================================================

  async hydrateContent(feedRows: FeedItemRow[]): Promise<FeedItem[]> {
    // Group items by content type for batch fetching
    const groups = new Map<string, string[]>();
    for (const row of feedRows) {
      const ids = groups.get(row.content_type) || [];
      ids.push(row.content_id);
      groups.set(row.content_type, ids);
    }

    // Batch fetch from each source table
    const contentMap = new Map<string, Record<string, unknown>>();

    const fetchPromises = Array.from(groups.entries()).map(async ([contentType, ids]) => {
      const tableName = this.getTableName(contentType);
      const { data } = await db.from(tableName).select('*').in('id', ids);

      if (data) {
        for (const row of data) {
          const record = row as Record<string, unknown>;
          contentMap.set(`${contentType}:${record.id}`, record);
        }
      }
    });

    await Promise.all(fetchPromises);

    // Fetch author profiles in batch
    const authorIds = [...new Set(feedRows.map((r) => r.created_by))];
    const authorMap = new Map<string, ProfileRow>();

    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .in('id', authorIds);

      if (profiles) {
        for (const p of profiles) {
          const profile = p as unknown as ProfileRow;
          authorMap.set(profile.id, profile);
        }
      }
    }

    // Map to FeedItem interface
    return feedRows
      .map((row) => {
        const content = contentMap.get(`${row.content_type}:${row.content_id}`);
        if (!content) return null;

        const author = authorMap.get(row.created_by);

        return this.mapToFeedItem(row, content, author || null);
      })
      .filter((item): item is FeedItem => item !== null);
  },

  getTableName(contentType: string): string {
    const map: Record<string, string> = {
      post: 'posts',
      story: 'posts', // Stories are stored in posts table
      event: 'events',
      space: 'spaces',
      opportunity: 'opportunities',
    };
    return map[contentType] || contentType;
  },

  mapToFeedItem(
    feedRow: FeedItemRow,
    content: Record<string, unknown>,
    author: ProfileRow | null
  ): FeedItem {
    const feedAuthor: FeedAuthor = {
      id: feedRow.created_by,
      displayName: author?.full_name || 'Unknown User',
      avatarUrl: author?.avatar_url || null,
      headline: author?.headline || null,
      isVerified: author?.is_verified || false,
      tier: UserTier.FREE,
      connectionDegree: 3, // Default — enriched by ranking engine
      mutualConnectionCount: 0,
    };

    return {
      id: feedRow.id,
      type: feedRow.content_type as FeedContentType,
      contentId: feedRow.content_id,
      primaryC: feedRow.primary_c as CModule,
      secondaryCs: (feedRow.secondary_cs || []) as CModule[],
      createdBy: feedAuthor,
      createdAt: new Date(feedRow.created_at),
      updatedAt: new Date(feedRow.updated_at),
      relevanceScore: 0,
      rankingSignals: {
        connectionStrength: 0,
        cModuleDiversity: 0,
        skillMatch: 0,
        regionalRelevance: 0,
        engagementVelocity: 0,
        freshness: 0,
        creatorRelationship: 0,
        contentQuality: 0,
      },
      content: this.transformContent(feedRow.content_type, content),
      engagement: {
        likeCount: 0,
        commentCount: 0,
        reshareCount: 0,
        bookmarkCount: 0,
        viewCount: 0,
        isLikedByMe: false,
        isBookmarkedByMe: false,
        isResharedByMe: false,
      },
      crossReferences: [],
      isPro: feedRow.is_pro,
      isPromoted: false,
    };
  },

  transformContent(contentType: string, raw: Record<string, unknown>): FeedItem['content'] {
    switch (contentType) {
      case 'post': {
        // Build media array from image_url and gallery_urls since DB has no "media" column
        const postMedia: MediaAttachment[] = [];
        const imageUrl = raw.image_url as string | null;
        const galleryUrls = raw.gallery_urls as string[] | null;

        if (imageUrl) {
          postMedia.push({ id: 'primary', url: imageUrl, type: 'image', altText: undefined, fileName: '', fileSize: 0, mimeType: 'image/*', uploadProgress: 100, uploadStatus: 'complete' });
        }
        if (galleryUrls && Array.isArray(galleryUrls)) {
          galleryUrls.forEach((url, idx) => {
            // Avoid duplicating if image_url is already in gallery
            if (url && url !== imageUrl) {
              postMedia.push({ id: `gallery-${idx}`, url, type: 'image', altText: undefined, fileName: '', fileSize: 0, mimeType: 'image/*', uploadProgress: 100, uploadStatus: 'complete' });
            }
          });
        }

        return {
          type: 'post',
          body: (raw.content as string) || '',
          bodyPreview: ((raw.content as string) || '').slice(0, 280),
          fullBodyLength: ((raw.content as string) || '').length,
          media: postMedia,
          poll: null,
          linkPreview: raw.link_url
            ? {
                url: raw.link_url as string,
                title: (raw.link_title as string) || '',
                description: (raw.link_description as string) || '',
                image: (raw.link_metadata as Record<string, unknown>)?.thumbnail_url as string | undefined,
                domain: '',
              }
            : null,
          context: (raw.context as PostFeedContent['context']) || null,
          hashtags: (raw.tags as string[]) || [],
          mentionedUsers: [],
        } as PostFeedContent;
      }

      case 'story':
        return {
          type: 'story',
          title: (raw.title as string) || '',
          subtitle: (raw.subtitle as string) || null,
          coverImageUrl: (raw.image_url as string) || '',
          bodyPreview: ((raw.content as string) || '').slice(0, 160),
          readingTimeMinutes: (raw.reading_time_minutes as number) || 1,
          seriesName: null,
          seriesPosition: null,
          callToAction: (raw.call_to_action as StoryCallToAction) || null,
          topics: (raw.tags as string[]) || [],
        } as StoryFeedContent;

      case 'event':
        return {
          type: 'event',
          title: (raw.title as string) || '',
          description: ((raw.description as string) || '').slice(0, 200),
          coverImageUrl: (raw.cover_image_url as string) || null,
          eventType: (raw.format as EventType) || 'virtual',
          startDateTime: new Date((raw.start_time as string) || Date.now()),
          endDateTime: new Date((raw.end_time as string) || Date.now()),
          timezone: (raw.timezone as string) || 'UTC',
          viewerLocalTime: '',
          physicalLocation: raw.location_name
            ? {
                address: (raw.location_name as string) || '',
                city: (raw.location_city as string) || '',
                country: (raw.location_country as string) || '',
                coordinates:
                  raw.location_lat && raw.location_lng
                    ? { lat: raw.location_lat as number, lng: raw.location_lng as number }
                    : undefined,
              }
            : null,
          virtualLink: null,
          ticketType: 'free' as TicketType,
          ticketPrice: null,
          capacity: (raw.max_attendees as number) || null,
          spotsRemaining: null,
          coHosts: ((raw.co_hosts as FeedAuthor[]) || []),
          attendees: { totalCount: 0, connectionAttendees: [], connectionCount: 0 },
          regionalHub: (raw.regional_hub as string) || null,
          relatedSpace: null,
          isRSVPd: false,
          rsvpStatus: null,
        } as EventFeedContent;

      case 'space':
        return {
          type: 'space',
          name: (raw.name as string) || '',
          description: ((raw.description as string) || '').slice(0, 200),
          coverImageUrl: (raw.image_url as string) || null,
          spaceType: (raw.space_type as SpaceType) || 'project',
          visibility: ((raw.visibility as string) === 'public' ? 'open' : 'request') as SpaceVisibility,
          memberCount: 0,
          maxMembers: (raw.max_members as number) || null,
          rolesNeeded: ((raw.roles_needed as SpaceRoleFeedData[]) || []).map((r) => ({
            title: typeof r === 'string' ? r : r.title || '',
            filled: typeof r === 'string' ? false : r.filled || false,
            matchesMySkills: false,
          })),
          timeline: (raw.timeline as SpaceTimeline) || null,
          progressPercentage: null,
          recentActivity: null,
          memberPreview: [],
          connectionMemberCount: 0,
          relatedEvent: null,
          regionalFocus: (raw.regional_focus as string) || null,
          isMember: false,
          membershipStatus: null,
        } as SpaceFeedContent;

      case 'opportunity':
        return {
          type: 'opportunity',
          title: (raw.title as string) || '',
          description: ((raw.description as string) || '').slice(0, 250),
          direction: (raw.direction as OpportunityDirection) || 'need',
          category: (raw.category as OpportunityCategory) || 'skills_expertise',
          compensationType: (raw.compensation_type as CompensationType) || 'volunteer',
          compensationDisplay: this.formatCompensation(raw),
          locationRelevance: (raw.location_relevance as LocationRelevance) || 'global',
          locationDisplay: this.formatLocation(raw),
          duration: (raw.duration as OpportunityDuration) || null,
          durationDisplay: raw.duration ? this.formatDuration(raw.duration as string) : null,
          deadline: raw.deadline ? new Date(raw.deadline as string) : null,
          daysUntilDeadline: raw.deadline
            ? Math.ceil(
                (new Date(raw.deadline as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
            : null,
          interestCount: (raw.interest_count as number) || 0,
          matchScore: null,
          matchReasons: [],
          relatedSpace: null,
          hasExpressedInterest: false,
        } as OpportunityFeedContent;

      default:
        // Fallback: treat as post
        return {
          type: 'post',
          body: (raw.content as string) || '',
          bodyPreview: ((raw.content as string) || '').slice(0, 280),
          fullBodyLength: ((raw.content as string) || '').length,
          media: [],
          poll: null,
          linkPreview: null,
          context: null,
          hashtags: [],
          mentionedUsers: [],
        } as PostFeedContent;
    }
  },

  formatCompensation(raw: Record<string, unknown>): string {
    const type = raw.compensation_type as string;
    const details = raw.compensation_details as Record<string, unknown> | null;
    if (type === 'paid' && details?.minAmount) {
      return `Paid ($${details.minAmount}-$${details.maxAmount}/${(details.currency as string) || 'USD'})`;
    }
    const labels: Record<string, string> = {
      paid: 'Paid',
      volunteer: 'Volunteer',
      exchange: 'Exchange',
      equity: 'Equity',
      hybrid: 'Hybrid',
    };
    return labels[type] || type || 'Volunteer';
  },

  formatLocation(raw: Record<string, unknown>): string {
    const relevance = raw.location_relevance as string;
    if (relevance === 'global') return 'Global';
    if (relevance === 'diaspora') return 'Remote (Diaspora)';
    if (raw.specific_country) return `${raw.specific_country}`;
    if (raw.specific_region) return `${raw.specific_region}`;
    return 'Africa-based';
  },

  formatDuration(duration: string): string {
    const labels: Record<string, string> = {
      one_time: 'One-time',
      short_term: 'Short-term (< 3 months)',
      long_term: 'Long-term (3+ months)',
      ongoing: 'Ongoing',
    };
    return labels[duration] || duration;
  },

  localizeEventTimes(items: FeedItem[], userTimezone: string): FeedItem[] {
    return items.map((item) => {
      if (item.type === 'event') {
        const eventContent = item.content as EventFeedContent;
        try {
          eventContent.viewerLocalTime = eventContent.startDateTime.toLocaleString('en-US', {
            timeZone: userTimezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        } catch {
          eventContent.viewerLocalTime = eventContent.startDateTime.toLocaleString();
        }
      }
      return item;
    });
  },

  // ============================================================
  // DIA INSIGHTS
  // ============================================================

  async fetchDIAInsights(
    userId: string,
    userTier: string
  ): Promise<DIAInsightFeedContent[]> {
    try {
      // Fetch from existing DB-based insights
      const maxInsights = userTier === 'free' ? 3 : 10;
      const { data } = await db
        .from('dia_feed_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('shown', false)
        .eq('dismissed', false)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(maxInsights);

      const dbInsights: DIAInsightFeedContent[] = ((data as Record<string, unknown>[] | null) || []).map((row) => ({
        type: 'dia_insight' as const,
        insightType: row.insight_type as DIAInsightFeedContent['insightType'],
        headline: row.headline as string,
        body: row.body as string,
        dataPoints: (row.data_points as DIAInsightFeedContent['dataPoints']) || [],
        actionCTA: row.action_cta as DIAInsightFeedContent['actionCTA'],
        secondaryCTA: (row.secondary_cta as DIAInsightFeedContent['secondaryCTA']) || null,
        relatedContentIds: ((row.related_content_ids as string[]) || []),
        expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
      }));

      // Supplement with per-C card system if we have room
      const remaining = maxInsights - dbInsights.length;
      if (remaining > 0 && userId) {
        try {
          const cards = await getDIACardsForFeed(userId);
          const cardInsights: DIAInsightFeedContent[] = cards.slice(0, remaining).map(card => ({
            type: 'dia_insight' as const,
            insightType: 'network_insight' as DIAInsightFeedContent['insightType'],
            headline: card.headline,
            body: card.body,
            dataPoints: [],
            actionCTA: {
              label: card.actions.find(a => a.isPrimary)?.label || 'View',
              type: 'navigate' as const,
              payload: {
                targetType: card.category === 'cross_c' ? 'connect' : card.category,
                targetId: (card.actions.find(a => a.isPrimary)?.payload?.url as string) || '/dna/feed',
              },
            },
            secondaryCTA: null,
            relatedContentIds: [],
            expiresAt: card.expiresAt ? new Date(card.expiresAt) : null,
          }));
          return [...dbInsights, ...cardInsights];
        } catch {
          // Card system failure is non-critical — return DB insights only
        }
      }

      return dbInsights;
    } catch (err) {
      logHighError(err, 'feed', 'fetchDIAInsights failed', { userId });
      return [];
    }
  },

  // ============================================================
  // ENGAGEMENT ACTIONS
  // ============================================================

  async toggleEngagement(
    feedItemId: string,
    action: string,
    userId: string
  ): Promise<{ active: boolean }> {
    try {
      const { data: existing } = await db
        .from('feed_engagement')
        .select('id')
        .eq('feed_item_id', feedItemId)
        .eq('user_id', userId)
        .eq('action', action)
        .single();

      if (existing) {
        const record = existing as Record<string, string>;
        await db.from('feed_engagement').delete().eq('id', record.id);
        return { active: false };
      } else {
        await db.from('feed_engagement').insert({
          feed_item_id: feedItemId,
          user_id: userId,
          action,
        });
        return { active: true };
      }
    } catch (err) {
      logHighError(err, 'feed', 'toggleEngagement failed', { feedItemId, action });
      throw err;
    }
  },

  async trackView(feedItemId: string, userId: string): Promise<void> {
    try {
      await db.from('feed_engagement').upsert(
        {
          feed_item_id: feedItemId,
          user_id: userId,
          action: 'view',
        },
        { onConflict: 'feed_item_id,user_id,action' }
      );
    } catch {
      // Silent fail for view tracking
    }
  },

  // ============================================================
  // USER PREFERENCES
  // ============================================================

  async getUserFeedPreferences(userId: string) {
    const { data } = await db
      .from('user_feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data as Record<string, unknown> | null;
  },

  async updateUserFeedPreferences(
    userId: string,
    updates: Record<string, unknown>
  ) {
    const { error } = await db
      .from('user_feed_preferences')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      logHighError(error, 'feed', 'updateUserFeedPreferences failed', { userId });
      throw error;
    }
  },
};
