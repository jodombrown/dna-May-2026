/**
 * DIA | Chat Interface Service
 *
 * The reactive intelligence interface where users can directly query DIA.
 * Handles:
 * - Intent classification (regex-based, graduating to ML)
 * - Entity extraction (skills, locations, industries, etc.)
 * - Query routing to appropriate handlers
 * - Conversation management (Supabase-backed)
 * - Response generation with structured results
 *
 * Handlers cover:
 * - Network queries (find people, network analysis, introductions)
 * - Discovery (events, spaces, opportunities)
 * - Insights (network trends, personal analytics, regional updates)
 * - Actions (content creation, profile optimization, strategy)
 * - General knowledge (Perplexity API integration)
 */

import { supabase } from '@/integrations/supabase/client';
import {
  DIAChatIntent,
  type DIAChatMessage,
  type DIAChatQuery,
  type DIAChatEntity,
  type DIAChatContext,
  type DIAChatResult,
  type DIAChatAction,
  type NetworkStats,
} from '@/types/diaEngine';
import { peopleMatchingService } from './peopleMatching';
import { eventMatchingService } from './eventMatching';
// STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
// spaceMatchingService and opportunityMatchingEngineService removed; the
// COLLABORATE/CONTRIBUTE find-* handlers below now return empty results.

// ============================================================
// INTENT CLASSIFICATION
// ============================================================

/**
 * Classify the intent of a user's chat query.
 */
function classifyIntent(text: string): DIAChatIntent {
  const lowerText = text.toLowerCase();

  // People-finding patterns
  if (/who (should|can|do) i (connect|meet|know|talk to)/i.test(text) ||
      /find (me )?(people|someone|connections)/i.test(text) ||
      /introduce me/i.test(text) ||
      /people (in|from|near|who)/i.test(text)) {
    if (/introduce/i.test(text)) return DIAChatIntent.INTRODUCTION_REQUEST;
    return DIAChatIntent.FIND_PEOPLE;
  }

  // Event discovery
  if (/what (events|gatherings|meetups)/i.test(text) ||
      /happening (this|next|in)/i.test(text) ||
      /events? (in|near|around|about|for|this)/i.test(text) ||
      /upcoming events/i.test(text)) {
    return DIAChatIntent.FIND_EVENTS;
  }

  // Space discovery
  if (/spaces? (for|about|related|in)/i.test(text) ||
      /projects? (for|about|looking|in)/i.test(text) ||
      /join (a )?space/i.test(text) ||
      /collaboration.*(project|space|team)/i.test(text)) {
    return DIAChatIntent.FIND_SPACES;
  }

  // Opportunity discovery
  if (/opportunit(y|ies) (for|matching|in|that)/i.test(text) ||
      /what (matches|fits) my (skills|profile)/i.test(text) ||
      /looking for (work|gigs|projects|help)/i.test(text) ||
      /find.*(opportunity|gig|job)/i.test(text)) {
    return DIAChatIntent.FIND_OPPORTUNITIES;
  }

  // Network analysis
  if (/how (strong|big|diverse) is my network/i.test(text) ||
      /my network (in|across|stats|size)/i.test(text) ||
      /network (analysis|insights|stats|overview|snapshot)/i.test(text) ||
      /analyze my (network|connections)/i.test(text)) {
    return DIAChatIntent.NETWORK_ANALYSIS;
  }

  // Personal analytics
  if (/how (engaged|active) am i/i.test(text) ||
      /my (activity|engagement|impact|progress)/i.test(text) ||
      /five c.*progress/i.test(text) ||
      /personal (analytics|stats)/i.test(text)) {
    return DIAChatIntent.PERSONAL_ANALYTICS;
  }

  // Network insights
  if (/what.*(trending|happening) in my network/i.test(text) ||
      /network (trends|updates|news)/i.test(text)) {
    return DIAChatIntent.NETWORK_INSIGHTS;
  }

  // Regional insights
  if (/what.*(happening|trending|going on) in .*(africa|lagos|nairobi|accra|london|new york)/i.test(text) ||
      /regional (insights?|update|trends)/i.test(text) ||
      /(east|west|north|south|central) africa.*(update|trend|insight)/i.test(text)) {
    return DIAChatIntent.REGIONAL_INSIGHTS;
  }

  // Profile optimization
  if (/improve my profile/i.test(text) ||
      /profile (tips|advice|help|optimization)/i.test(text) ||
      /how can i (get|receive) more (connections|views|engagement)/i.test(text) ||
      /optimize my (profile|presence)/i.test(text)) {
    return DIAChatIntent.OPTIMIZE_PROFILE;
  }

  // Strategy
  if (/how (can|should|do) i grow/i.test(text) ||
      /strategy for/i.test(text) ||
      /build my (network|presence|brand)/i.test(text) ||
      /grow my (network|reach|impact)/i.test(text)) {
    return DIAChatIntent.PLAN_STRATEGY;
  }

  // Content creation
  if (/help me (write|create|draft)/i.test(text) ||
      /write (a |an )?(post|story|event|description)/i.test(text)) {
    return DIAChatIntent.CREATE_CONTENT;
  }

  // Platform help
  if (/how (do|can) i (create|make|start|use|find)/i.test(text) ||
      /what is (a |an )?(space|story|five c|dia)/i.test(text) ||
      /help.*(using|navigate|getting started)/i.test(text)) {
    return DIAChatIntent.PLATFORM_HELP;
  }

  return DIAChatIntent.GENERAL_QUESTION;
}

// ============================================================
// ENTITY EXTRACTION
// ============================================================

/** Known skill keywords for extraction */
const KNOWN_SKILLS = [
  'design', 'engineering', 'marketing', 'finance', 'supply chain', 'operations',
  'data science', 'product management', 'software', 'healthcare', 'education',
  'consulting', 'legal', 'accounting', 'research', 'writing', 'photography',
  'fintech', 'ai', 'blockchain', 'machine learning', 'project management',
];

/** Known location keywords */
const KNOWN_LOCATIONS = [
  'lagos', 'nairobi', 'accra', 'johannesburg', 'london', 'new york', 'paris',
  'toronto', 'houston', 'atlanta', 'washington', 'berlin', 'amsterdam',
  'east africa', 'west africa', 'north africa', 'southern africa', 'central africa',
  'nigeria', 'kenya', 'ghana', 'south africa', 'ethiopia', 'cameroon', 'senegal',
  'tanzania', 'uganda', 'rwanda', 'egypt', 'morocco',
];

/** Known industry keywords */
const KNOWN_INDUSTRIES = [
  'technology', 'finance', 'healthcare', 'education', 'agriculture',
  'energy', 'media', 'entertainment', 'real estate', 'manufacturing',
  'consulting', 'nonprofit', 'government', 'legal', 'retail',
];

/**
 * Extract structured entities from the query text.
 */
function extractEntities(text: string): DIAChatEntity[] {
  const entities: DIAChatEntity[] = [];
  const lower = text.toLowerCase();

  // Extract skills
  for (const skill of KNOWN_SKILLS) {
    if (lower.includes(skill)) {
      entities.push({ type: 'skill', value: skill, confidence: 0.8 });
    }
  }

  // Extract locations
  for (const location of KNOWN_LOCATIONS) {
    if (lower.includes(location)) {
      entities.push({ type: 'location', value: location, confidence: 0.9 });
    }
  }

  // Extract industries
  for (const industry of KNOWN_INDUSTRIES) {
    if (lower.includes(industry)) {
      entities.push({ type: 'industry', value: industry, confidence: 0.7 });
    }
  }

  // Extract timeframes
  const timePatterns: [RegExp, string][] = [
    [/this week/i, 'this_week'],
    [/this month/i, 'this_month'],
    [/next week/i, 'next_week'],
    [/next month/i, 'next_month'],
    [/today/i, 'today'],
    [/tomorrow/i, 'tomorrow'],
  ];
  for (const [pattern, value] of timePatterns) {
    if (pattern.test(text)) {
      entities.push({ type: 'timeframe', value, confidence: 0.9 });
    }
  }

  return entities;
}

// ============================================================
// QUERY PROCESSING
// ============================================================

/**
 * Process a user's chat query and return a DIA response.
 */
async function processQuery(
  text: string,
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const intent = classifyIntent(text);
  const entities = extractEntities(text);

  const handler = getHandler(intent);
  const response = await handler(text, entities, context);

  // Store message and response
  await storeMessages(context.conversationId, text, response);

  return response;
}

/**
 * Create a new DIA chat conversation.
 */
async function createConversation(userId: string): Promise<string> {
  const { data } = await (supabase as any)
    .from('dia_conversations')
    .insert({ user_id: userId })
    .select('id')
    .single();

  return (data as any)?.id as string || crypto.randomUUID();
}

/**
 * Get conversation history.
 */
async function getConversationHistory(
  conversationId: string,
  limit = 50,
): Promise<DIAChatMessage[]> {
  const { data } = await (supabase as any)
    .from('dia_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  return ((data || []) as Record<string, unknown>[]).map(mapDbMessage);
}

// ============================================================
// INTENT HANDLERS
// ============================================================

type IntentHandler = (
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
) => Promise<DIAChatMessage>;

function getHandler(intent: DIAChatIntent): IntentHandler {
  const handlers: Record<DIAChatIntent, IntentHandler> = {
    [DIAChatIntent.FIND_PEOPLE]: handleFindPeople,
    [DIAChatIntent.FIND_EVENTS]: handleFindEvents,
    [DIAChatIntent.FIND_SPACES]: handleFindSpaces,
    [DIAChatIntent.FIND_OPPORTUNITIES]: handleFindOpportunities,
    [DIAChatIntent.NETWORK_ANALYSIS]: handleNetworkAnalysis,
    [DIAChatIntent.NETWORK_INSIGHTS]: handleNetworkInsights,
    [DIAChatIntent.PERSONAL_ANALYTICS]: handlePersonalAnalytics,
    [DIAChatIntent.REGIONAL_INSIGHTS]: handleRegionalInsights,
    [DIAChatIntent.INTRODUCTION_REQUEST]: handleFindPeople,
    [DIAChatIntent.CREATE_CONTENT]: handleCreateContent,
    [DIAChatIntent.OPTIMIZE_PROFILE]: handleOptimizeProfile,
    [DIAChatIntent.PLAN_STRATEGY]: handlePlanStrategy,
    [DIAChatIntent.GENERAL_QUESTION]: handleGeneralQuestion,
    [DIAChatIntent.PLATFORM_HELP]: handlePlatformHelp,
  };
  return handlers[intent];
}

async function handleFindPeople(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const matches = await peopleMatchingService.computeMatches(context.userId, 5);

  // Fetch display names for matched users
  const matchedIds = matches.map(m => m.matchedUserId);
  const { data: profiles } = matchedIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, avatar_url, headline').in('id', matchedIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  const results: DIAChatResult[] = matches.map(m => {
    const profile = profileMap.get(m.matchedUserId);
    return {
      type: 'person' as const,
      id: m.matchedUserId,
      title: (profile?.full_name as string) || 'DNA Member',
      subtitle: m.matchReasons.map(r => r.text).join(' \u2022 '),
      imageUrl: (profile?.avatar_url as string) || null,
      matchScore: m.matchScore,
      matchReasons: m.matchReasons.map(r => r.text),
      actionLabel: 'Connect',
      actionPayload: { userId: m.matchedUserId },
    };
  });

  const responseText = results.length > 0
    ? 'Based on your network, skills, and interests, here are people you should connect with:'
    : 'I couldn\'t find strong matches right now. Try adding more skills and interests to your profile to improve recommendations.';

  return buildResponse(context, responseText, results.length > 0 ? 'results_list' : 'text', results, [
    { label: 'Explore Connect Hub', type: 'navigate', payload: { route: '/dna/connect' } },
    { label: 'Refine my search', type: 'follow_up', payload: {} },
  ]);
}

async function handleFindEvents(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const matches = await eventMatchingService.matchUserToEvents(context.userId, 5);

  // Fetch event details
  const eventIds = matches.map(m => m.eventId);
  const { data: events } = eventIds.length > 0
    ? await supabase.from('events').select('id, title, start_date, location, cover_image_url').in('id', eventIds)
    : { data: [] };

  const eventMap = new Map((events || []).map(e => [e.id, e]));

  const results: DIAChatResult[] = matches.map(m => {
    const event = eventMap.get(m.eventId);
    return {
      type: 'event' as const,
      id: m.eventId,
      title: (event?.title as string) || 'Event',
      subtitle: m.matchReasons.map(r => r.text).join(' \u2022 '),
      imageUrl: (event?.cover_image_url as string) || null,
      matchScore: m.matchScore,
      matchReasons: m.matchReasons.map(r => r.text),
      actionLabel: 'RSVP',
      actionPayload: { eventId: m.eventId },
    };
  });

  const responseText = results.length > 0
    ? 'Here are upcoming events that match your interests and network:'
    : 'No upcoming events matched your profile right now. Check back soon or browse the Convene Hub.';

  return buildResponse(context, responseText, results.length > 0 ? 'results_list' : 'text', results, [
    { label: 'Browse all events', type: 'navigate', payload: { route: '/dna/convene' } },
  ]);
}

async function handleFindSpaces(
  _text: string,
  _entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
  return buildResponse(
    context,
    "Spaces are being reimagined right now. The COLLABORATE module will return shortly.",
    'text',
    [],
    [{ label: 'Visit /collaborate', type: 'navigate', payload: { route: '/dna/collaborate' } }],
  );
}

async function handleFindOpportunities(
  _text: string,
  _entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
  return buildResponse(
    context,
    "Opportunities are being reimagined right now. The CONTRIBUTE module will return shortly.",
    'text',
    [],
    [{ label: 'Visit /contribute', type: 'navigate', payload: { route: '/dna/contribute' } }],
  );
}

async function handleNetworkAnalysis(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const stats = await computeNetworkStats(context.userId);

  const lines = [
    'Here\'s your network snapshot:',
    '',
    `You have ${stats.connectionCount} connections, with ${stats.strongConnectionCount} strong relationships.`,
    stats.countryCount > 0 ? `Your network spans ${stats.countryCount} countries across ${stats.regionCount} regions.` : '',
    stats.topCluster.count > 0 ? `Your strongest cluster is in ${stats.topCluster.name} (${stats.topCluster.count} connections).` : '',
    '',
    stats.growthOpportunity || 'Your network is growing. Keep connecting!',
  ].filter(Boolean);

  return buildResponse(context, lines.join('\n'), 'insight', [], [
    { label: 'Find people to connect with', type: 'search', payload: { type: 'people' } },
    { label: 'View my network', type: 'navigate', payload: { route: '/dna/network' } },
  ]);
}

async function handleNetworkInsights(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  // Get trending topics from user's network
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(50);

  const topicCounts = new Map<string, number>();
  for (const post of recentPosts || []) {
    const tags = ((post.content || '') as string).match(/#(\w{2,30})/g);
    if (tags) {
      for (const tag of tags) {
        topicCounts.set(tag.toLowerCase(), (topicCounts.get(tag.toLowerCase()) || 0) + 1);
      }
    }
  }

  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => `${tag} (${count} posts)`);

  const responseText = topTopics.length > 0
    ? `Here's what's trending in the network:\n\n${topTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : 'Not enough activity to detect trends yet. As more people create content, DIA will surface what\'s trending.';

  return buildResponse(context, responseText, 'insight', [], [
    { label: 'Browse trending feed', type: 'navigate', payload: { route: '/dna/feed?sort=trending' } },
  ]);
}

async function handlePersonalAnalytics(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', context.userId)
    .single();

  // Count activity across Five C's
  const [postCount, eventCount, spaceCount, oppCount] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', context.userId),
    supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('user_id', context.userId),
    Promise.resolve({ count: 0 }), // collaboration_memberships retired (DIA/ADIN out of scope)
    supabase.from('contribution_needs').select('*', { count: 'exact', head: true }).eq('created_by', context.userId),
  ]);

  const connectionCount = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${context.userId},recipient_id.eq.${context.userId}`);

  const lines = [
    'Here\'s your Five C\'s activity snapshot:',
    '',
    `**Connect**: ${connectionCount.count || 0} connections`,
    `**Convene**: ${eventCount.count || 0} events attended`,
    `**Collaborate**: ${spaceCount.count || 0} active spaces`,
    `**Contribute**: ${oppCount.count || 0} opportunities posted`,
    `**Convey**: ${postCount.count || 0} stories/posts shared`,
  ];

  // Identify active and inactive C's
  const activeCs: string[] = [];
  const inactiveCs: string[] = [];
  if ((connectionCount.count || 0) > 0) activeCs.push('Connect'); else inactiveCs.push('Connect');
  if ((eventCount.count || 0) > 0) activeCs.push('Convene'); else inactiveCs.push('Convene');
  if ((spaceCount.count || 0) > 0) activeCs.push('Collaborate'); else inactiveCs.push('Collaborate');
  if ((oppCount.count || 0) > 0) activeCs.push('Contribute'); else inactiveCs.push('Contribute');
  if ((postCount.count || 0) > 0) activeCs.push('Convey'); else inactiveCs.push('Convey');

  if (inactiveCs.length > 0) {
    lines.push('', `Try exploring ${inactiveCs[0]} to unlock more of DNA's power.`);
  } else {
    lines.push('', 'You\'re active across all Five C\'s. Great engagement!');
  }

  return buildResponse(context, lines.join('\n'), 'insight', [], [
    { label: 'View analytics', type: 'navigate', payload: { route: '/dna/analytics' } },
  ]);
}

async function handleRegionalInsights(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const locationEntity = entities.find(e => e.type === 'location');
  const region = locationEntity?.value || 'the network';

  const { data: profile } = await supabase
    .from('profiles')
    .select('location')
    .eq('id', context.userId)
    .single();

  const searchRegion = locationEntity?.value || (profile?.location as string) || '';

  // Count regional stats
  const [userCount, eventCount, oppCount] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).ilike('location', `%${searchRegion}%`),
    supabase.from('events').select('*', { count: 'exact', head: true }).ilike('location', `%${searchRegion}%`).gte('start_date', new Date().toISOString()),
    supabase.from('contribution_needs').select('*', { count: 'exact', head: true }).ilike('location', `%${searchRegion}%`).eq('status', 'open'),
  ]);

  const responseText = [
    `Here's what's happening in ${region}:`,
    '',
    `${userCount.count || 0} active members`,
    `${eventCount.count || 0} upcoming events`,
    `${oppCount.count || 0} open opportunities`,
  ].join('\n');

  return buildResponse(context, responseText, 'insight', [], [
    { label: `Browse ${region} events`, type: 'navigate', payload: { route: '/dna/convene', filter: region } },
    { label: `Find people in ${region}`, type: 'search', payload: { type: 'people', region } },
  ]);
}

async function handleOptimizeProfile(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', context.userId)
    .single();

  if (!profile) {
    return buildResponse(context, 'I couldn\'t find your profile. Make sure you\'re logged in.', 'text', [], []);
  }

  const tips: string[] = [];
  if (!profile.avatar_url) tips.push('Add a profile photo. Profiles with photos get 5x more connection requests');
  if (!profile.headline) tips.push('Add a professional headline. It\'s the first thing people see');
  if (!(profile.skills as string[])?.length) tips.push('Add your skills. This powers opportunity matching and recommendations');
  if (!profile.bio) tips.push('Write a bio. Share your story with the diaspora');
  if (!(profile.interests as string[])?.length) tips.push('Add interests. DIA uses these to personalize your feed');
  if (!profile.location) tips.push('Add your location. Unlock local event and connection recommendations');

  const responseText = tips.length > 0
    ? `Here are ways to strengthen your profile:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : 'Your profile looks complete! Keep it up-to-date as your skills and interests evolve.';

  return buildResponse(context, responseText, 'insight', [], [
    { label: 'Edit profile', type: 'navigate', payload: { route: '/dna/settings/profile' } },
  ]);
}

async function handlePlanStrategy(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const skillEntity = entities.find(e => e.type === 'skill');
  const locationEntity = entities.find(e => e.type === 'location');

  const strategies: string[] = [
    '**Grow your network strategically:**',
    '- Connect with people who share your skills or interests',
    '- Attend events to meet people in person',
    '- Join collaboration spaces to build working relationships',
    '',
    '**Increase your visibility:**',
    '- Share stories about your expertise and experiences',
    '- Engage with others\' content through thoughtful comments',
    '- Use hashtags to reach beyond your immediate network',
    '',
    '**Create opportunities:**',
    '- Post an Offer with your top skills to attract matches',
    '- Host an event in your area of expertise',
    '- Start a collaboration space for a project you care about',
  ];

  if (skillEntity) {
    strategies.push('', `**For ${skillEntity.value} specifically:**`, `- Search for ${skillEntity.value} opportunities in the Contribute Hub`, `- Connect with other ${skillEntity.value} professionals`);
  }

  return buildResponse(context, strategies.join('\n'), 'insight', [], [
    { label: 'Find connections', type: 'search', payload: { type: 'people' } },
    { label: 'Browse opportunities', type: 'navigate', payload: { route: '/dna/contribute' } },
    { label: 'Create content', type: 'create', payload: { mode: 'post' } },
  ]);
}

async function handleCreateContent(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const responseText = [
    'I can help guide you in creating content. What would you like to create?',
    '',
    '- **Post**: Share a thought or update with your network',
    '- **Story**: Write a long-form narrative about your experiences',
    '- **Event**: Host a gathering for the diaspora',
    '- **Space**: Start a collaboration project',
    '- **Opportunity**: Post a need or offer your skills',
  ].join('\n');

  return buildResponse(context, responseText, 'text', [], [
    { label: 'Share a Post', type: 'create', payload: { mode: 'post' } },
    { label: 'Tell a Story', type: 'create', payload: { mode: 'story' } },
    { label: 'Host an Event', type: 'create', payload: { mode: 'event' } },
    { label: 'Post an Opportunity', type: 'create', payload: { mode: 'opportunity' } },
  ]);
}

async function handlePlatformHelp(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  const responseText = [
    'DNA is the operating system for the global African diaspora. It\'s organized around the Five C\'s:',
    '',
    '**Connect**: Build your professional network across the diaspora',
    '**Convene**: Host and attend events, from local meetups to virtual conferences',
    '**Collaborate**: Create project spaces and work together with others',
    '**Contribute**: Post needs or offer your skills to help the diaspora',
    '**Convey**: Share your stories, insights, and knowledge',
    '',
    'I\'m DIA, your intelligence agent. Ask me anything about finding people, events, opportunities, or how to use the platform.',
  ].join('\n');

  return buildResponse(context, responseText, 'text', [], [
    { label: 'Find people', type: 'follow_up', payload: { query: 'Who should I connect with?' } },
    { label: 'Browse events', type: 'navigate', payload: { route: '/dna/convene' } },
    { label: 'Optimize my profile', type: 'follow_up', payload: { query: 'How can I improve my profile?' } },
  ]);
}

async function handleGeneralQuestion(
  text: string,
  entities: DIAChatEntity[],
  context: DIAChatContext,
): Promise<DIAChatMessage> {
  // For general questions, provide a helpful fallback
  // In production, this would route to Perplexity API
  const responseText = [
    'That\'s a great question! While I\'m best at helping with:',
    '',
    '- Finding people, events, spaces, and opportunities',
    '- Analyzing your network',
    '- Optimizing your profile',
    '- Platform guidance',
    '',
    'Try rephrasing your question to focus on one of these areas, or explore the platform directly.',
  ].join('\n');

  return buildResponse(context, responseText, 'text', [], [
    { label: 'Find people', type: 'follow_up', payload: { query: 'Who should I connect with?' } },
    { label: 'Browse the feed', type: 'navigate', payload: { route: '/dna/feed' } },
  ]);
}

// ============================================================
// HELPERS
// ============================================================

function buildResponse(
  context: DIAChatContext,
  content: string,
  contentType: DIAChatMessage['contentType'],
  results: DIAChatResult[],
  actions: DIAChatAction[],
): DIAChatMessage {
  return {
    id: crypto.randomUUID(),
    conversationId: context.conversationId,
    role: 'dia',
    content,
    contentType,
    attachedResults: results,
    suggestedActions: actions,
    createdAt: new Date(),
  };
}

async function storeMessages(
  conversationId: string,
  userText: string,
  diaResponse: DIAChatMessage,
): Promise<void> {
  // Store user message
  await (supabase as any).from('dia_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userText,
    content_type: 'text',
  });

  // Store DIA response
  await (supabase as any).from('dia_messages').insert({
    conversation_id: conversationId,
    role: 'dia',
    content: diaResponse.content,
    content_type: diaResponse.contentType,
    attached_results: diaResponse.attachedResults,
    suggested_actions: diaResponse.suggestedActions,
  });
}

async function computeNetworkStats(userId: string): Promise<NetworkStats> {
  const { count: connectionCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  // Count strong connections — approximate from connections with status accepted
  const { count: strongCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  // Count unique regions/countries from connected users
  const { data: connections } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .limit(200);

  const connectedIds = (connections || []).map(c =>
    c.requester_id === userId ? c.recipient_id : c.requester_id,
  );

  let countryCount = 0;
  let regionCount = 0;
  let topCluster = { name: 'your network', count: 0 };

  if (connectedIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('location')
      .in('id', connectedIds.slice(0, 100));

    const locations = (profiles || []).map(p => (p.location as string) || '').filter(Boolean);
    const uniqueLocations = new Set(locations.map(l => l.split(',')[0].trim()));
    countryCount = uniqueLocations.size;
    regionCount = Math.max(1, Math.ceil(countryCount / 3));

    // Find top cluster
    const locationCounts = new Map<string, number>();
    for (const loc of locations) {
      const city = loc.split(',')[0].trim();
      locationCounts.set(city, (locationCounts.get(city) || 0) + 1);
    }
    const topEntry = Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topEntry) {
      topCluster = { name: topEntry[0], count: topEntry[1] };
    }
  }

  return {
    connectionCount: connectionCount || 0,
    strongConnectionCount: strongCount || 0,
    countryCount,
    regionCount,
    topCluster,
    skillMatchCount: 0,
    growthOpportunity: (connectionCount || 0) < 20
      ? 'Grow your network to 20+ connections for better recommendations.'
      : null,
    weakArea: null,
  };
}

function mapDbMessage(row: Record<string, unknown>): DIAChatMessage {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    role: row.role as 'user' | 'dia',
    content: row.content as string,
    contentType: (row.content_type as DIAChatMessage['contentType']) || 'text',
    attachedResults: (row.attached_results as DIAChatResult[]) || [],
    suggestedActions: (row.suggested_actions as DIAChatAction[]) || [],
    createdAt: new Date(row.created_at as string),
  };
}

export const diaChatService = {
  processQuery,
  classifyIntent,
  extractEntities,
  createConversation,
  getConversationHistory,
};
