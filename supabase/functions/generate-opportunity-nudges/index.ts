import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireInternal } from "../_shared/auth.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Nudge types for opportunities
type OpportunityNudgeType =
  | 'opportunity_match'      // Opportunity matches user's skills
  | 'opportunity_trending'   // Popular opportunity in network
  | 'contribution_impact'    // User's contribution had impact

interface OpportunityNudge {
  user_id: string
  nudge_type: OpportunityNudgeType
  nudge_category: string
  priority: 'low' | 'normal' | 'high'
  message: string
  payload: {
    opportunity_id?: string
    opportunity_title?: string
    space_id?: string
    space_name?: string
    match_score?: number
    match_reasons?: string[]
    action_url?: string
  }
  expires_at: string
}

// African regions for location matching
const AFRICAN_REGIONS: Record<string, string[]> = {
  'West Africa': ['nigeria', 'ghana', 'senegal', 'ivory coast', 'mali', 'burkina faso', 'niger', 'guinea', 'benin', 'togo', 'sierra leone', 'liberia', 'gambia'],
  'East Africa': ['kenya', 'ethiopia', 'tanzania', 'uganda', 'rwanda', 'burundi', 'south sudan', 'somalia', 'eritrea', 'djibouti'],
  'Southern Africa': ['south africa', 'zimbabwe', 'zambia', 'botswana', 'namibia', 'mozambique', 'malawi', 'lesotho', 'eswatini', 'angola'],
  'North Africa': ['egypt', 'morocco', 'algeria', 'tunisia', 'libya', 'sudan'],
  'Central Africa': ['cameroon', 'democratic republic of congo', 'drc', 'congo', 'gabon', 'equatorial guinea', 'central african republic', 'chad'],
}

// Contribution type labels
const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
  funding: 'funding',
  skills: 'skills sharing',
  time: 'volunteering',
  access: 'network access',
  resources: 'resource sharing',
}

// Nudge message templates
const MESSAGE_TEMPLATES = {
  opportunity_match: [
    'Your skills in {skills} match "{opportunity}" - consider contributing!',
    '"{opportunity}" needs your expertise in {focus_area}',
    'Based on your experience, "{opportunity}" could use your help',
    'New opportunity matches your profile: "{opportunity}"',
  ],
  opportunity_trending: [
    '"{opportunity}" is getting attention from your network',
    'Popular in your community: "{opportunity}"',
    '{count} professionals are looking at "{opportunity}"',
  ],
  contribution_impact: [
    'Your contribution to "{project}" helped achieve {outcome}!',
    'Great news! "{project}" reached its goal with your help',
    'Your {contribution_type} made a difference at "{project}"',
  ],
}

function getRandomTemplate(type: OpportunityNudgeType): string {
  const templates = MESSAGE_TEMPLATES[type]
  return templates[Math.floor(Math.random() * templates.length)]
}

function getAfricanRegion(location: string): string | null {
  const loc = location.toLowerCase()
  for (const [region, countries] of Object.entries(AFRICAN_REGIONS)) {
    if (countries.some(c => loc.includes(c))) {
      return region
    }
    if (loc.includes(region.toLowerCase())) {
      return region
    }
  }
  return null
}

function calculateArrayMatch(arr1: string[], arr2: string[]): number {
  if (!arr1?.length || !arr2?.length) return 0
  const set1 = new Set(arr1.map(s => s.toLowerCase().trim()))
  const set2 = new Set(arr2.map(s => s.toLowerCase().trim()))
  let matches = 0
  for (const item of set1) {
    for (const item2 of set2) {
      if (item === item2 || item.includes(item2) || item2.includes(item)) {
        matches++
        break
      }
    }
  }
  return (matches / Math.max(set1.size, set2.size)) * 100
}

function getCommonItems(arr1: string[], arr2: string[]): string[] {
  if (!arr1?.length || !arr2?.length) return []
  const set2 = new Set(arr2.map(s => s.toLowerCase().trim()))
  return arr1.filter(item => {
    const lower = item.toLowerCase().trim()
    return set2.has(lower) || Array.from(set2).some(s => s.includes(lower) || lower.includes(s))
  })
}

async function getMatchingOpportunitiesForUser(
  supabase: any,
  userId: string,
  userProfile: any
): Promise<Array<{ opportunity: any; score: number; reasons: string[] }>> {
  // Get open opportunities not created by user
  const { data: opportunities, error } = await supabase
    .from('contribution_needs')
    .select(`
      *,
      space:spaces(id, name, slug, focus_areas, region)
    `)
    .in('status', ['open', 'in_progress'])
    .neq('created_by', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error || !opportunities) {
    console.error('Error fetching opportunities:', error)
    return []
  }

  // Get user's contribution history
  const { data: offers } = await supabase
    .from('contribution_offers')
    .select('need_id, contribution_needs(type)')
    .eq('created_by', userId)
    .in('status', ['accepted', 'completed', 'validated'])

  const contributionTypes = new Set<string>()
  offers?.forEach((offer: any) => {
    if (offer.contribution_needs?.type) {
      contributionTypes.add(offer.contribution_needs.type)
    }
  })

  // Score each opportunity
  const scoredOpportunities = opportunities.map((opp: any) => {
    let score = 0
    const reasons: string[] = []

    // Skills matching (30%)
    if (opp.type === 'skills') {
      const userSkills = userProfile.skills || []
      const oppFocusAreas = [...(opp.focus_areas || []), ...(opp.space?.focus_areas || [])]
      const skillsScore = calculateArrayMatch(userSkills, oppFocusAreas)
      score += skillsScore * 0.30
      if (skillsScore > 30) {
        const common = getCommonItems(userSkills, oppFocusAreas)
        if (common.length > 0) reasons.push(`skills: ${common.slice(0, 2).join(', ')}`)
      }
    } else {
      score += 30 * 0.30 // Base score for non-skills
    }

    // Interests/Focus areas (25%)
    const userInterests = [
      ...(userProfile.interests || []),
      ...(userProfile.focus_areas || []),
      ...(userProfile.impact_areas || [])
    ]
    const oppFocusAreas = [...(opp.focus_areas || []), ...(opp.space?.focus_areas || [])]
    const interestScore = calculateArrayMatch(userInterests, oppFocusAreas)
    score += interestScore * 0.25
    if (interestScore > 30) {
      const common = getCommonItems(userInterests, oppFocusAreas)
      if (common.length > 0) reasons.push(`focus: ${common[0]}`)
    }

    // Location (20%)
    const userLocation = userProfile.current_country || userProfile.location || ''
    const oppRegion = opp.region || opp.space?.region || ''
    let locationScore = 30

    if (userLocation && oppRegion) {
      const userLoc = userLocation.toLowerCase()
      const oppLoc = oppRegion.toLowerCase()

      if (userLoc === oppLoc || userLoc.includes(oppLoc) || oppLoc.includes(userLoc)) {
        locationScore = 100
        reasons.push(`in ${oppRegion}`)
      } else {
        const userRegion = getAfricanRegion(userLoc)
        const oppAfricanRegion = getAfricanRegion(oppLoc)
        if (userRegion && oppAfricanRegion && userRegion === oppAfricanRegion) {
          locationScore = 80
          reasons.push('same region')
        } else if (oppLoc === 'global' || oppLoc === 'remote' || oppLoc === 'diaspora') {
          locationScore = 70
        }
      }
    }
    score += locationScore * 0.20

    // Contribution history (25%)
    if (contributionTypes.has(opp.type)) {
      score += 80 * 0.25
      reasons.push(`done ${CONTRIBUTION_TYPE_LABELS[opp.type]} before`)
    } else if (contributionTypes.size > 0) {
      score += 40 * 0.25
    } else {
      score += 20 * 0.25
    }

    // Bonus for high priority
    if (opp.priority === 'high' && score > 30) {
      score += 10
      reasons.push('high priority')
    }

    return {
      opportunity: opp,
      score: Math.min(100, Math.round(score)),
      reasons: reasons.slice(0, 3)
    }
  })

  // Filter and sort by score
  return scoredOpportunities
    .filter(item => item.score >= 50) // Only high-quality matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Top 3 matches
}

async function generateOpportunityNudges(supabase: any, userId: string): Promise<OpportunityNudge[]> {
  const nudges: OpportunityNudge[] = []

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id, skills, interests, focus_areas, impact_areas,
      current_country, current_city, location, available_for, industries
    `)
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.log(`No profile found for user ${userId}`)
    return nudges
  }

  // Check user preferences for contribute nudges
  const { data: prefs } = await supabase
    .from('dia_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  const enabledCategories = prefs?.nudge_categories || ['connection', 'content', 'engagement', 'contribute']
  if (!enabledCategories.includes('contribute') && !enabledCategories.includes('engagement')) {
    return nudges
  }

  // Get matching opportunities
  const matchedOpportunities = await getMatchingOpportunitiesForUser(supabase, userId, profile)

  // Create nudges for top matches
  for (const match of matchedOpportunities) {
    const { opportunity, score, reasons } = match

    // Build message
    let message = getRandomTemplate('opportunity_match')
    const focusArea = reasons.find(r => r.startsWith('focus:'))?.replace('focus: ', '') ||
                      opportunity.focus_areas?.[0] || 'your interests'
    const skills = reasons.find(r => r.startsWith('skills:'))?.replace('skills: ', '') ||
                   profile.skills?.[0] || 'your expertise'

    message = message
      .replace('{opportunity}', opportunity.title)
      .replace('{skills}', skills)
      .replace('{focus_area}', focusArea)

    nudges.push({
      user_id: userId,
      nudge_type: 'opportunity_match',
      nudge_category: 'contribute',
      priority: score >= 70 ? 'high' : 'normal',
      message,
      payload: {
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        space_id: opportunity.space?.id,
        space_name: opportunity.space?.name,
        match_score: score,
        match_reasons: reasons,
        action_url: `/dna/contribute/needs/${opportunity.id}`
      },
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  // Check for trending opportunities in user's network
  const { data: memberships } = await supabase
    .from('space_members')
    .select('space_id')
    .eq('user_id', userId)
    .limit(10)

  if (memberships && memberships.length > 0) {
    const spaceIds = memberships.map((m: any) => m.space_id)

    // Get high-priority needs from user's spaces
    const { data: trendingNeeds } = await supabase
      .from('contribution_needs')
      .select(`
        *,
        space:spaces(id, name, slug)
      `)
      .in('space_id', spaceIds)
      .eq('status', 'open')
      .eq('priority', 'high')
      .neq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (trendingNeeds && trendingNeeds.length > 0) {
      const need = trendingNeeds[0]
      const message = getRandomTemplate('opportunity_trending')
        .replace('{opportunity}', need.title)
        .replace('{count}', String(Math.floor(Math.random() * 10) + 5))

      nudges.push({
        user_id: userId,
        nudge_type: 'opportunity_trending',
        nudge_category: 'contribute',
        priority: 'normal',
        message,
        payload: {
          opportunity_id: need.id,
          opportunity_title: need.title,
          space_id: need.space?.id,
          space_name: need.space?.name,
          action_url: `/dna/contribute/needs/${need.id}`
        },
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  // Check for validated contributions (contribution_impact nudge)
  const { data: recentBadges } = await supabase
    .from('contribution_badges')
    .select(`
      *,
      contribution_needs(title, type),
      spaces(name)
    `)
    .eq('user_id', userId)
    .gte('validated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('validated_at', { ascending: false })
    .limit(1)

  if (recentBadges && recentBadges.length > 0) {
    const badge = recentBadges[0]
    const contributionType = CONTRIBUTION_TYPE_LABELS[badge.contribution_needs?.type] || 'contribution'
    const projectName = badge.spaces?.name || 'the project'

    const message = getRandomTemplate('contribution_impact')
      .replace('{project}', projectName)
      .replace('{contribution_type}', contributionType)
      .replace('{outcome}', 'their goal')

    nudges.push({
      user_id: userId,
      nudge_type: 'contribution_impact',
      nudge_category: 'contribute',
      priority: 'normal',
      message,
      payload: {
        space_id: badge.space_id,
        space_name: badge.spaces?.name,
        action_url: `/dna/contribute/my-contributions`
      },
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  return nudges
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const __auth = requireInternal(req);
  if (!__auth.ok) return __auth.response;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting opportunity nudge generation...')

    // Get active users who might be interested in contributing
    // Users who have: complete profile, recent activity, or previous contributions
    const { data: eligibleUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .gte('profile_completion_percentage', 40)
      .limit(100)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${eligibleUsers?.length || 0} eligible users...`)

    let nudgesCreated = 0

    for (const user of eligibleUsers || []) {
      try {
        // Check if user already has recent opportunity nudges
        const { data: recentNudges } = await supabase
          .from('dia_nudges')
          .select('id')
          .eq('user_id', user.id)
          .in('nudge_type', ['opportunity_match', 'opportunity_trending', 'contribution_impact'])
          .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())

        // Skip if already has recent opportunity nudges
        if (recentNudges && recentNudges.length >= 2) {
          continue
        }

        // Generate opportunity nudges
        const nudges = await generateOpportunityNudges(supabase, user.id)

        // Insert nudges (limit to 2 per user per run)
        for (const nudge of nudges.slice(0, 2)) {
          const { error: insertError } = await supabase
            .from('dia_nudges')
            .insert({
              user_id: nudge.user_id,
              nudge_type: nudge.nudge_type,
              message: nudge.message,
              status: 'sent',
              payload: nudge.payload,
              priority: nudge.priority
            })

          if (insertError) {
            console.error(`Error creating nudge for user ${user.id}:`, insertError)
          } else {
            nudgesCreated++
          }
        }

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError)
      }
    }

    console.log(`Opportunity nudge generation complete. Created ${nudgesCreated} nudges.`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: eligibleUsers?.length || 0,
        nudges_created: nudgesCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-opportunity-nudges:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
