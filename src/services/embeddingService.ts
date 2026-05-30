import { supabase } from '@/integrations/supabase/client';
import type { EntityType } from './interactionLogger';

/**
 * M4: Embedding Service
 * Generates and manages user and entity embeddings for personalization
 */

const VECTOR_DIMENSION = 32;

interface UserVector {
  user_id: string;
  vector: number[];
  dimension: number;
  source: 'interactions' | 'profile' | 'hybrid';
}

interface EntityVector {
  entity_type: EntityType;
  entity_id: string;
  vector: number[];
  dimension: number;
  source: 'tags' | 'metadata' | 'text' | 'hybrid';
}

/**
 * Generate user embedding based on their interactions and profile
 */
export async function generateUserEmbedding(userId: string): Promise<number[]> {
  try {
    // Get user interactions
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('entity_type, entity_id, interaction_type, weight')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);

    // Get user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('intents, skills, interests')
      .eq('id', userId)
      .single();

    // Initialize vector
    const vector = new Array(VECTOR_DIMENSION).fill(0);

    if (!interactions || interactions.length === 0) {
      // Use profile-based embedding if no interactions
      if (profile) {
        return generateProfileBasedVector(profile);
      }
      return vector;
    }

    // Weight by interaction type
    const typeWeights: Record<string, number> = {
      view: 0.5,
      click: 1.0,
      cta: 2.0,
      join: 3.0,
      rsvp: 2.5,
      like: 1.5,
      comment: 2.0,
      share: 2.5,
    };

    // Aggregate interactions into vector
    const entityFrequency: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      const key = `${interaction.entity_type}:${interaction.entity_id}`;
      const weight = (interaction.weight || 1.0) * (typeWeights[interaction.interaction_type] || 1.0);
      entityFrequency[key] = (entityFrequency[key] || 0) + weight;
    });

    // Simple hash-based embedding
    Object.entries(entityFrequency).forEach(([key, freq]) => {
      const hash = simpleHash(key);
      const index = Math.abs(hash) % VECTOR_DIMENSION;
      vector[index] += freq;
    });

    // Normalize vector
    return normalizeVector(vector);
  } catch (error) {
    return new Array(VECTOR_DIMENSION).fill(0);
  }
}

/**
 * Generate entity embedding based on metadata and content
 */
export async function generateEntityEmbedding(
  entityType: EntityType,
  entityId: string
): Promise<number[]> {
  try {
    const vector = new Array(VECTOR_DIMENSION).fill(0);

    // Entity data structure for embedding generation
    interface EntityData {
      tags?: string[];
      focus_areas?: string[];
      intents?: string[];
      skills?: string[];
      interests?: string[];
      event_type?: string;
      post_type?: string;
      type?: string;
    }

    // Get entity data based on type
    let entityData: EntityData | null = null;

    switch (entityType) {
      case 'event':
        const { data: event } = await supabase
          .from('events')
          .select('title, description, event_type')
          .eq('id', entityId)
          .single();
        if (event) {
          entityData = { event_type: event.event_type };
        }
        break;

      case 'space':
        // collaboration_spaces table retired; space embeddings disabled.
        entityData = null;
        break;

      case 'need':
        const { data: need } = await supabase
          .from('contribution_needs')
          .select('title, description, type, focus_areas')
          .eq('id', entityId)
          .single();
        entityData = need;
        break;

      case 'story':
      case 'post':
        const { data: post } = await supabase
          .from('posts')
          .select('content, post_type')
          .eq('id', entityId)
          .single();
        if (post) {
          entityData = { post_type: post.post_type };
        }
        break;

      case 'profile':
        const { data: profile } = await supabase
          .from('profiles')
          .select('intents, skills, interests')
          .eq('id', entityId)
          .single();
        entityData = profile;
        break;
    }

    if (!entityData) {
      return vector;
    }

    // Extract features from entity
    const features: string[] = [];

    // Add tags
    if (entityData.tags && Array.isArray(entityData.tags)) {
      features.push(...entityData.tags);
    }

    // Add focus areas
    if (entityData.focus_areas && Array.isArray(entityData.focus_areas)) {
      features.push(...entityData.focus_areas);
    }

    // Add intents, skills, interests
    if (entityData.intents) features.push(...(entityData.intents || []));
    if (entityData.skills) features.push(...(entityData.skills || []));
    if (entityData.interests) features.push(...(entityData.interests || []));

    // Add type/role
    if (entityData.event_type) features.push(entityData.event_type);
    if (entityData.post_type) features.push(entityData.post_type);
    if (entityData.type) features.push(entityData.type);

    // Hash features into vector
    features.forEach(feature => {
      const hash = simpleHash(feature.toLowerCase());
      const index = Math.abs(hash) % VECTOR_DIMENSION;
      vector[index] += 1;
    });

    return normalizeVector(vector);
  } catch (error) {
    return new Array(VECTOR_DIMENSION).fill(0);
  }
}

/**
 * Save user vector to database
 */
export async function saveUserVector(userId: string, source: 'interactions' | 'profile' | 'hybrid' = 'hybrid'): Promise<void> {
  try {
    const vector = await generateUserEmbedding(userId);
    
    await supabase.from('user_vectors').upsert({
      user_id: userId,
      vector: JSON.stringify(vector),
      dimension: VECTOR_DIMENSION,
      source,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });
  } catch (error) {
    // Silently fail - vector storage is non-critical
  }
}

/**
 * Save entity vector to database
 */
export async function saveEntityVector(
  entityType: EntityType,
  entityId: string,
  source: 'tags' | 'metadata' | 'text' | 'hybrid' = 'hybrid'
): Promise<void> {
  try {
    const vector = await generateEntityEmbedding(entityType, entityId);
    
    await supabase.from('entity_vectors').upsert({
      entity_type: entityType,
      entity_id: entityId,
      vector: JSON.stringify(vector),
      dimension: VECTOR_DIMENSION,
      source,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'entity_type,entity_id',
    });
  } catch (error) {
    // Silently fail - vector storage is non-critical
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

// Helper functions

interface ProfileEmbeddingData {
  intents?: string[];
  skills?: string[];
  interests?: string[];
}

function generateProfileBasedVector(profile: ProfileEmbeddingData): number[] {
  const vector = new Array(VECTOR_DIMENSION).fill(0);
  const features: string[] = [];

  if (profile.intents) features.push(...(profile.intents || []));
  if (profile.skills) features.push(...(profile.skills || []));
  if (profile.interests) features.push(...(profile.interests || []));

  features.forEach(feature => {
    const hash = simpleHash(feature.toLowerCase());
    const index = Math.abs(hash) % VECTOR_DIMENSION;
    vector[index] += 1;
  });

  return normalizeVector(vector);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}
