import { supabase } from '@/integrations/supabase/client';
import { Professional } from '@/types/search';
import type { Tables } from '@/integrations/supabase/types';
import { getPrimaryOriginCodes, originCodeToName } from '@/lib/memberHeritage';

// Profile type from database, hydrated with the alpha-3 primary origin code
// sourced from member_heritage (profiles no longer carries this column).
type ProfileRow = Tables<'profiles'> & { primary_origin_country: string | null };

export interface MatchingCriteria {
  skills?: string[];
  location?: string;
  profession?: string;
  countryOfOrigin?: string;
  impactAreas?: string[];
  isLookingForMentor?: boolean;
  isLookingForInvestor?: boolean;
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  availableFor?: string[];
  industries?: string[];
  interests?: string[];
  languages?: string[];
  regionalExpertise?: string[];
  focusAreas?: string[];
  diasporaStatus?: string;
}

export interface MatchScore {
  professionalId: string;
  score: number;
  reasons: string[];
  details: {
    skillsMatch: number;
    locationMatch: number;
    professionMatch: number;
    impactMatch: number;
    experienceMatch: number;
    culturalMatch: number;
    interestsMatch: number;
    collaborationMatch: number;
    languageMatch: number;
    diasporaMatch: number;
    regionalMatch: number;
    causesMatch: number;
    mentorshipMatch: number;
    industryMatch: number;
  };
}

// African regions for grouping
const AFRICAN_REGIONS: Record<string, string[]> = {
  'West Africa': ['nigeria', 'ghana', 'senegal', 'ivory coast', 'cote d\'ivoire', 'mali', 'burkina faso', 'niger', 'guinea', 'benin', 'togo', 'sierra leone', 'liberia', 'gambia', 'guinea-bissau', 'cape verde', 'mauritania'],
  'East Africa': ['kenya', 'ethiopia', 'tanzania', 'uganda', 'rwanda', 'burundi', 'south sudan', 'somalia', 'eritrea', 'djibouti'],
  'Southern Africa': ['south africa', 'zimbabwe', 'zambia', 'botswana', 'namibia', 'mozambique', 'malawi', 'lesotho', 'eswatini', 'swaziland', 'angola'],
  'North Africa': ['egypt', 'morocco', 'algeria', 'tunisia', 'libya', 'sudan'],
  'Central Africa': ['cameroon', 'democratic republic of congo', 'drc', 'congo', 'gabon', 'equatorial guinea', 'central african republic', 'chad']
};


class MatchingService {
  /**
   * Advanced AI-powered matching algorithm
   * Uses 14+ different matching criteria for comprehensive compatibility
   */
  async findMatches(currentUserId: string, criteria: MatchingCriteria): Promise<MatchScore[]> {
    try {
      // Get current user's full profile for comparison
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (!currentUser) return [];

      // Get all potential matches with extended fields
      const { data: professionals } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .eq('is_public', true)
        .limit(200);

      if (!professionals) return [];

      // Hydrate alpha-3 primary origin codes from member_heritage for both
      // sides so calculateCulturalMatch compares code-vs-code at runtime.
      const ids = [currentUserId, ...professionals.map((p) => p.id)];
      const originMap = await getPrimaryOriginCodes(ids);
      const hydratedUser: ProfileRow = {
        ...currentUser,
        primary_origin_country: originMap.get(currentUserId) ?? null,
      };
      const hydratedPros: ProfileRow[] = professionals.map((p) => ({
        ...p,
        primary_origin_country: originMap.get(p.id) ?? null,
      }));

      // Calculate match scores for each professional
      const matches = hydratedPros
        .map((prof) => this.calculateMatchScore(hydratedUser, prof, criteria))
        .filter(match => match.score > 20) // Filter out very low matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 50); // Return top 50 matches

      return matches;
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate comprehensive match score using 14+ criteria
   */
  private calculateMatchScore(currentUser: ProfileRow, professional: ProfileRow, criteria: MatchingCriteria): MatchScore {
    let totalScore = 0;
    const reasons: string[] = [];
    const details = {
      skillsMatch: 0,
      locationMatch: 0,
      professionMatch: 0,
      impactMatch: 0,
      experienceMatch: 0,
      culturalMatch: 0,
      interestsMatch: 0,
      collaborationMatch: 0,
      languageMatch: 0,
      diasporaMatch: 0,
      regionalMatch: 0,
      causesMatch: 0,
      mentorshipMatch: 0,
      industryMatch: 0
    };

    // =========================================================================
    // CORE MATCHING CRITERIA (60% of base score)
    // =========================================================================

    // 1. Skills matching (12%)
    const skillsScore = this.calculateArrayMatch(
      currentUser.skills || [],
      professional.skills || []
    );
    details.skillsMatch = skillsScore;
    totalScore += skillsScore * 0.12;
    if (skillsScore > 50) {
      const commonCount = this.countCommonItems(currentUser.skills || [], professional.skills || []);
      reasons.push(`${commonCount} shared skills`);
    }

    // 2. Location/Region proximity (8%)
    const locationScore = this.calculateLocationMatch(
      currentUser.current_country || currentUser.location,
      professional.current_country || professional.location
    );
    details.locationMatch = locationScore;
    totalScore += locationScore * 0.08;
    if (locationScore >= 100) {
      reasons.push('Same location');
    } else if (locationScore >= 70) {
      reasons.push('Same region');
    }

    // 3. Professional relevance (10%)
    const professionScore = this.calculateProfessionMatch(
      currentUser.profession,
      professional.profession
    );
    details.professionMatch = professionScore;
    totalScore += professionScore * 0.10;
    if (professionScore > 70) {
      reasons.push('Related profession');
    }

    // 4. Cultural/Heritage background (10%)
    // 4. Cultural/Heritage background (10%) — both sides are alpha-3 codes
    //    hydrated from member_heritage in findMatches.
    const culturalScore = this.calculateCulturalMatch(
      currentUser.primary_origin_country,
      professional.primary_origin_country
    );

    details.culturalMatch = culturalScore;
    totalScore += culturalScore * 0.10;
    if (culturalScore >= 100) {
      reasons.push('Same heritage country');
    } else if (culturalScore >= 80) {
      reasons.push('Same African region');
    }

    // 5. Interests alignment (10%)
    const interestsScore = this.calculateArrayMatch(
      currentUser.interests || currentUser.interest_tags || [],
      professional.interests || professional.interest_tags || []
    );
    details.interestsMatch = interestsScore;
    totalScore += interestsScore * 0.10;
    if (interestsScore > 40) {
      reasons.push('Shared interests');
    }

    // 6. Collaboration compatibility (10%)
    const { score: collabScore, reason: collabReason } = this.calculateCollaborationMatchWithReason(
      currentUser.available_for || [],
      professional.available_for || []
    );
    details.collaborationMatch = collabScore;
    totalScore += collabScore * 0.10;
    if (collabReason) {
      reasons.push(collabReason);
    }

    // =========================================================================
    // DIASPORA-SPECIFIC MATCHING (25% of base score)
    // =========================================================================

    // 7. Language compatibility (8%) - especially African languages
    const languageScore = this.calculateLanguageMatch(
      currentUser.languages || [],
      professional.languages || []
    );
    details.languageMatch = languageScore;
    totalScore += languageScore * 0.08;
    if (languageScore > 60) {
      const commonLangs = this.getCommonItems(currentUser.languages || [], professional.languages || []);
      if (commonLangs.length > 0) {
        reasons.push(`Speaks ${commonLangs[0]}`);
      }
    }

    // (Diaspora-status complementary matching removed — column retired BD033)


    // 9. Regional expertise overlap (5%)
    const regionalScore = this.calculateArrayMatch(
      currentUser.regional_expertise || [],
      professional.regional_expertise || []
    );
    details.regionalMatch = regionalScore;
    totalScore += regionalScore * 0.05;
    if (regionalScore > 50) {
      reasons.push('Regional expertise overlap');
    }

    // 10. African causes alignment (5%)
    const causesScore = this.calculateArrayMatch(
      currentUser.african_causes || [],
      professional.african_causes || []
    );
    details.causesMatch = causesScore;
    totalScore += causesScore * 0.05;
    if (causesScore > 40) {
      reasons.push('Shared African causes');
    }

    // =========================================================================
    // PROFESSIONAL DEPTH MATCHING (15% of base score)
    // =========================================================================

    // 11. Mentorship areas compatibility (5%)
    const mentorshipScore = this.calculateMentorshipMatch(
      currentUser,
      professional
    );
    details.mentorshipMatch = mentorshipScore;
    totalScore += mentorshipScore * 0.05;
    if (mentorshipScore > 70) {
      reasons.push('Mentorship match');
    }

    // 12. Industry/Sector alignment (5%)
    const industryScore = this.calculateArrayMatch(
      currentUser.industries || currentUser.professional_sectors || [],
      professional.industries || professional.professional_sectors || []
    );
    details.industryMatch = industryScore;
    totalScore += industryScore * 0.05;
    if (industryScore > 50) {
      reasons.push('Same industry');
    }

    // 13. Impact areas alignment (3%)
    const impactScore = this.calculateArrayMatch(
      currentUser.impact_areas || currentUser.focus_areas || [],
      professional.impact_areas || professional.focus_areas || []
    );
    details.impactMatch = impactScore;
    totalScore += impactScore * 0.03;
    if (impactScore > 40) {
      reasons.push('Shared impact focus');
    }

    // 14. Experience level compatibility (2%)
    const experienceScore = this.calculateExperienceMatch(
      currentUser.years_experience,
      professional.years_experience
    );
    details.experienceMatch = experienceScore;
    totalScore += experienceScore * 0.02;

    // =========================================================================
    // BONUS POINTS (Can exceed 100% base, capped at final score)
    // =========================================================================

    // Mentor/Investor seeking bonus (+15 each)
    // TODO: requires DB migration — is_mentor and is_investor columns do not exist on profiles
    // if (criteria.isLookingForMentor && professional.is_mentor) {
    //   totalScore += 15;
    //   reasons.push('Available mentor');
    // }
    // if (criteria.isLookingForInvestor && professional.is_investor) {
    //   totalScore += 15;
    //   reasons.push('Active investor');
    // }

    // High-value complementary matching bonuses
    const userAvailableFor = currentUser.available_for || [];
    const profAvailableFor = professional.available_for || [];

    // Career opportunity match (+12)
    if ((userAvailableFor.includes('hiring') && profAvailableFor.includes('job_seeking')) ||
        (userAvailableFor.includes('job_seeking') && profAvailableFor.includes('hiring'))) {
      totalScore += 12;
      if (!reasons.includes('Career opportunity match')) {
        reasons.push('Career opportunity match');
      }
    }

    // Investment opportunity match (+12)
    if ((userAvailableFor.includes('investing') && profAvailableFor.includes('seeking_investment')) ||
        (userAvailableFor.includes('seeking_investment') && profAvailableFor.includes('investing'))) {
      totalScore += 12;
      if (!reasons.includes('Investment opportunity match')) {
        reasons.push('Investment opportunity match');
      }
    }

    // Mentorship pairing bonus (+10)
    if ((userAvailableFor.includes('mentoring') && profAvailableFor.includes('being_mentored')) ||
        (userAvailableFor.includes('being_mentored') && profAvailableFor.includes('mentoring'))) {
      totalScore += 10;
      if (!reasons.includes('Mentorship pairing')) {
        reasons.push('Mentorship pairing');
      }
    }

    // Ethnic heritage connection bonus (+8)
    const heritageScore = this.calculateArrayMatch(
      currentUser.ethnic_heritage || [],
      professional.ethnic_heritage || []
    );
    if (heritageScore > 50) {
      totalScore += 8;
      reasons.push('Shared ethnic heritage');
    }

    // Diaspora networks connection bonus (+5)
    const networkScore = this.calculateArrayMatch(
      currentUser.diaspora_networks || [],
      professional.diaspora_networks || []
    );
    if (networkScore > 50) {
      totalScore += 5;
      reasons.push('Same diaspora network');
    }

    // Engagement intentions alignment bonus (+5)
    const intentScore = this.calculateArrayMatch(
      currentUser.engagement_intentions || [],
      professional.engagement_intentions || []
    );
    if (intentScore > 40) {
      totalScore += 5;
    }

    // Prioritize and deduplicate reasons
    const prioritizedReasons = this.prioritizeReasons(reasons);

    return {
      professionalId: professional.id,
      score: Math.min(100, Math.round(totalScore)),
      reasons: prioritizedReasons.slice(0, 4),
      details
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Generic array matching with fuzzy string comparison
   */
  private calculateArrayMatch(arr1: string[], arr2: string[]): number {
    if (!arr1?.length || !arr2?.length) return 0;

    const set1 = new Set(arr1.map(s => s.toLowerCase().trim()));
    const set2 = new Set(arr2.map(s => s.toLowerCase().trim()));

    let matches = 0;
    for (const item of set1) {
      for (const item2 of set2) {
        if (item === item2 || item.includes(item2) || item2.includes(item)) {
          matches++;
          break;
        }
      }
    }

    return (matches / Math.max(set1.size, set2.size)) * 100;
  }

  /**
   * Count common items between two arrays
   */
  private countCommonItems(arr1: string[], arr2: string[]): number {
    if (!arr1?.length || !arr2?.length) return 0;
    const set1 = new Set(arr1.map(s => s.toLowerCase().trim()));
    const set2 = new Set(arr2.map(s => s.toLowerCase().trim()));
    let count = 0;
    for (const item of set1) {
      if (set2.has(item)) count++;
    }
    return count;
  }

  /**
   * Get common items between two arrays
   */
  private getCommonItems(arr1: string[], arr2: string[]): string[] {
    if (!arr1?.length || !arr2?.length) return [];
    const set2 = new Set(arr2.map(s => s.toLowerCase().trim()));
    return arr1.filter(item => set2.has(item.toLowerCase().trim()));
  }

  /**
   * Location matching with region awareness
   */
  private calculateLocationMatch(userLocation: string, profLocation: string): number {
    if (!userLocation || !profLocation) return 20;

    const userLoc = userLocation.toLowerCase().trim();
    const profLoc = profLocation.toLowerCase().trim();

    // Exact match
    if (userLoc === profLoc) return 100;

    // Same country parts
    const userParts = userLoc.split(',').map(p => p.trim());
    const profParts = profLoc.split(',').map(p => p.trim());
    if (userParts.some(part => profParts.includes(part))) return 80;

    // Same African region
    const userRegion = this.getAfricanRegion(userLoc);
    const profRegion = this.getAfricanRegion(profLoc);
    if (userRegion && profRegion && userRegion === profRegion) return 70;

    // Both in Africa
    if (userRegion && profRegion) return 50;

    return 30;
  }

  /**
   * Get African region from country name
   */
  private getAfricanRegion(location: string): string | null {
    const loc = location.toLowerCase();
    for (const [region, countries] of Object.entries(AFRICAN_REGIONS)) {
      if (countries.some(c => loc.includes(c))) {
        return region;
      }
    }
    return null;
  }

  /**
   * Profession matching with field groupings
   */
  private calculateProfessionMatch(userProf: string, profProf: string): number {
    if (!userProf || !profProf) return 30;

    const u = userProf.toLowerCase();
    const p = profProf.toLowerCase();

    if (u === p) return 100;

    const fieldGroups = [
      ['engineer', 'developer', 'programmer', 'software', 'tech', 'data', 'ai', 'ml', 'devops', 'architect'],
      ['manager', 'director', 'lead', 'head', 'vp', 'chief', 'ceo', 'cto', 'cfo'],
      ['consultant', 'advisor', 'analyst', 'strategist'],
      ['marketing', 'growth', 'brand', 'communications', 'pr'],
      ['sales', 'business development', 'partnerships', 'account'],
      ['finance', 'investment', 'banking', 'financial', 'accounting', 'investor'],
      ['design', 'ux', 'ui', 'product design', 'creative'],
      ['founder', 'entrepreneur', 'co-founder', 'startup'],
      ['research', 'scientist', 'academic', 'professor'],
      ['lawyer', 'legal', 'attorney', 'counsel'],
      ['doctor', 'medical', 'healthcare', 'physician', 'nurse']
    ];

    for (const group of fieldGroups) {
      const userInGroup = group.some(f => u.includes(f));
      const profInGroup = group.some(f => p.includes(f));
      if (userInGroup && profInGroup) return 75;
    }

    return 40;
  }

  /**
   * Cultural match based on country of origin with region awareness
   */
  private calculateCulturalMatch(userCountry: string | null, profCountry: string | null): number {
    if (!userCountry || !profCountry) return 30;

    const u = userCountry.toLowerCase();
    const p = profCountry.toLowerCase();

    if (u === p) return 100;

    // Resolve alpha-3 codes to country names at the boundary so the
    // name-keyed getAfricanRegion lookup keeps working post re-point.
    const uName = (originCodeToName(userCountry) || '').toLowerCase();
    const pName = (originCodeToName(profCountry) || '').toLowerCase();

    const userRegion = uName ? this.getAfricanRegion(uName) : null;
    const profRegion = pName ? this.getAfricanRegion(pName) : null;

    if (userRegion && profRegion) {
      if (userRegion === profRegion) return 85;
      return 70; // Both African, different regions
    }

    return 40;
  }


  /**
   * Language matching with African language priority
   */
  private calculateLanguageMatch(userLangs: string[], profLangs: string[]): number {
    if (!userLangs?.length || !profLangs?.length) return 20;

    const africanLanguages = new Set([
      'swahili', 'arabic', 'hausa', 'yoruba', 'igbo', 'amharic', 'oromo', 'zulu',
      'xhosa', 'afrikaans', 'somali', 'twi', 'wolof', 'fulani', 'shona', 'lingala',
      'kikuyu', 'luo', 'tigrinya', 'berber', 'pidgin', 'krio'
    ]);

    const userSet = new Set(userLangs.map(l => l.toLowerCase().trim()));
    const profSet = new Set(profLangs.map(l => l.toLowerCase().trim()));

    let score = 0;
    let africanMatch = false;

    for (const lang of userSet) {
      if (profSet.has(lang)) {
        score += 25;
        if (africanLanguages.has(lang)) {
          africanMatch = true;
          score += 15; // Bonus for African language match
        }
      }
    }

    return Math.min(100, score);
  }




  /**
   * Mentorship match - considers both offering and seeking
   */
  private calculateMentorshipMatch(user: ProfileRow, prof: ProfileRow): number {
    let score = 0;

    // Mentorship pairing via seeking_mentorship (exists in DB)
    // TODO: is_mentor column does not exist — using available_for mentoring intent instead
    const userMentoring = (user.available_for || []).includes('mentoring');
    const profMentoring = (prof.available_for || []).includes('mentoring');
    if ((userMentoring && prof.seeking_mentorship) ||
        (user.seeking_mentorship && profMentoring)) {
      score += 50;
    }

    // Mentorship areas overlap
    const areasScore = this.calculateArrayMatch(
      user.mentorship_areas || [],
      prof.mentorship_areas || []
    );
    score += areasScore * 0.5;

    return Math.min(100, score);
  }

  /**
   * Collaboration match with reason
   */
  private calculateCollaborationMatchWithReason(
    userAvailableFor: string[],
    profAvailableFor: string[]
  ): { score: number; reason: string | null } {
    if (!userAvailableFor?.length || !profAvailableFor?.length) {
      return { score: 30, reason: null };
    }

    let score = 0;
    let reason: string | null = null;

    // Direct matches
    const directMatches = userAvailableFor.filter(item =>
      profAvailableFor.includes(item)
    );
    score += (directMatches.length / Math.max(userAvailableFor.length, profAvailableFor.length)) * 40;

    // Complementary pairs with reasons
    const pairs: [string, string, string][] = [
      ['hiring', 'job_seeking', 'Career opportunity match'],
      ['investing', 'seeking_investment', 'Investment opportunity match'],
      ['mentoring', 'being_mentored', 'Mentorship pairing'],
    ];

    for (const [need1, need2, pairReason] of pairs) {
      if ((userAvailableFor.includes(need1) && profAvailableFor.includes(need2)) ||
          (userAvailableFor.includes(need2) && profAvailableFor.includes(need1))) {
        score += 30;
        reason = pairReason;
        break;
      }
    }

    return { score: Math.min(100, score), reason };
  }

  /**
   * Experience level compatibility
   */
  private calculateExperienceMatch(userExp: number, profExp: number): number {
    if (!userExp || !profExp) return 50;

    const diff = Math.abs(userExp - profExp);

    if (diff <= 2) return 100;
    if (diff <= 5) return 80;
    if (diff <= 10) return 60;
    return 40;
  }

  /**
   * Prioritize and deduplicate match reasons
   */
  private prioritizeReasons(reasons: string[]): string[] {
    // Priority order for reasons
    const priority = [
      'Career opportunity match',
      'Investment opportunity match',
      'Mentorship pairing',
      'Available mentor',
      'Active investor',
      'Same heritage country',
      'Same location',
      'Shared ethnic heritage',
      'Same diaspora network',
      'Diaspora-continental bridge',
      'Returnee connecting with local',
      'Cross-generational diaspora',
    ];

    const seen = new Set<string>();
    const sorted: string[] = [];

    // Add priority items first
    for (const p of priority) {
      if (reasons.includes(p) && !seen.has(p)) {
        sorted.push(p);
        seen.add(p);
      }
    }

    // Add remaining items
    for (const r of reasons) {
      if (!seen.has(r)) {
        sorted.push(r);
        seen.add(r);
      }
    }

    return sorted;
  }

  // =========================================================================
  // PUBLIC API METHODS
  // =========================================================================

  /**
   * Get smart recommendations based on user profile
   */
  async getSmartRecommendations(userId: string): Promise<Professional[]> {
    try {
      const criteria: MatchingCriteria = {
        isLookingForMentor: true,
        isLookingForInvestor: true
      };

      const matches = await this.findMatches(userId, criteria);

      // Get full profile data for top matches
      const topMatchIds = matches.slice(0, 15).map(m => m.professionalId);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', topMatchIds);

      if (!profiles) return [];

      // Map to Professional type with required fields
      return profiles.map((p): Professional => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        headline: p.headline,
        profession: p.profession,
        company: p.company,
        location: p.current_country || p.location,
        // primary_origin_country sourced from member_heritage; not selected here
        expertise: p.skills,
        bio: p.bio,
        years_experience: p.years_experience,
        education: p.education,
        languages: p.languages,
        availability_for: p.available_for,
        linkedin_url: p.linkedin_url,
        website_url: p.website_url,
        avatar_url: p.avatar_url,
        skills: p.skills,
        impact_areas: p.impact_areas,
        // TODO: is_mentor/is_investor columns do not exist in profiles — defaulting to false
        is_mentor: false,
        is_investor: false,
        looking_for_opportunities: p.looking_for_opportunities || false,
        created_at: p.created_at,
        updated_at: p.updated_at || p.created_at
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Find complementary matches - people who have what you need
   */
  async findComplementaryMatches(userId: string): Promise<MatchScore[]> {
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) return [];

      // Build criteria based on what user is looking for
      const criteria: MatchingCriteria = {
        isLookingForMentor: user.seeking_mentorship || false,
        isLookingForInvestor: (user.available_for || []).includes('seeking_investment'),
      };

      return this.findMatches(userId, criteria);
    } catch (error) {
      return [];
    }
  }

  /**
   * Find matches by specific criteria (for discover filters)
   */
  async findMatchesByCriteria(
    userId: string,
    filters: {
      focusAreas?: string[];
      regionalExpertise?: string[];
      industries?: string[];
      countryOfOrigin?: string;
      location?: string;
    }
  ): Promise<MatchScore[]> {
    const criteria: MatchingCriteria = {
      focusAreas: filters.focusAreas,
      regionalExpertise: filters.regionalExpertise,
      industries: filters.industries,
      countryOfOrigin: filters.countryOfOrigin,
      location: filters.location,
    };

    return this.findMatches(userId, criteria);
  }
}

export const matchingService = new MatchingService();
