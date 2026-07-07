/**
 * DNA Platform — Database Type Augmentations
 *
 * Extends the generated Supabase types with:
 * 1. Provisional table shapes (tables written ahead of schema migration)
 * 2. Missing columns on existing tables (stale generated types)
 *
 * Usage:
 *   import { typedSupabase } from '@/lib/typedSupabase'
 *   const { data } = await typedSupabase.messagingMessages().select('*')
 *
 * When to retire this file:
 * - Provisional tables: once migrated to prod, regenerate types and remove the corresponding section
 * - Stale columns: after next `supabase gen types typescript` run, remove the manual augmentation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// ─── Provisional Table Shapes ──────────────────────────────────────────────────
// These tables do NOT yet exist in the DB. Services were written ahead of schema.
// Add migrations for these in Sprint 2.

export interface ComposerDraftRow {
  id: string;
  user_id: string;
  mode: 'post' | 'story' | 'event' | 'space' | 'opportunity';
  base_fields: Record<string, unknown> | null;
  mode_fields: Record<string, unknown> | null;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export interface ComposerDraftInsert extends Omit<ComposerDraftRow, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MessagingMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  reactions: Array<{ emoji: string; count: number }> | null;
  metadata: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessagingMessageInsert extends Omit<MessagingMessageRow, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContentAttributionRow {
  id: string;
  content_id: string;
  content_type: 'post' | 'story' | 'event' | 'space' | 'opportunity';
  source_module: 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';
  created_by: string;
  created_via: string;
  primary_c: string;
  secondary_cs: string[];
  composer_mode: string;
  dia_suggested_mode: boolean;
  dia_interactions: number;
  cross_references: Array<Record<string, unknown>>;
  created_at: string;
}

export interface NotificationRecordRow {
  id: string;
  recipient_id: string;
  type: string;
  category: string;
  c_module: string;
  priority: string;
  headline: string;
  body: string | null;
  image_url: string | null;
  icon_type: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar_url: string | null;
  target_type: string;
  target_id: string;
  target_title: string | null;
  primary_action: Record<string, unknown>;
  secondary_action: Record<string, unknown> | null;
  cross_c_context: Record<string, unknown> | null;
  channels: string[];
  delivered_via: string[];
  scheduled_for: string | null;
  batch_id: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  seen_at: string | null;
  opened_at: string | null;
  acted_on_at: string | null;
  dismissed_at: string | null;
  dia_score: number;
  dia_suppressed: boolean;
  dia_suppression_reason: string | null;
}

// ─── Profile Type Extension ────────────────────────────────────────────────────
// `seeking_mentorship` exists in DB but is missing from generated types (stale).
// `is_mentor` and `is_investor` do NOT exist in DB — do not add them here.
// matchingService.ts must be refactored to remove those field references.

export interface ProfileAugmented {
  seeking_mentorship: boolean | null;
}

// Merged type for use in services that need the augmented profile shape.
export type ProfileRow =
  Database['public']['Tables']['profiles']['Row'] & ProfileAugmented;

// ─── Typed Supabase Wrapper ────────────────────────────────────────────────────
// Replaces `supabase as any` and `const db = supabase as any` patterns.
// Returns typed query builders for provisional tables.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQueryBuilder = ReturnType<SupabaseClient<any>['from']>;

export function createTypedSupabase(client: SupabaseClient<Database>) {
  return {
    /** Provisional: messaging_messages */
    messagingMessages: () =>
      client.from('messaging_messages' as never) as unknown as AnyQueryBuilder,

    /** Provisional: notification_records */
    notificationRecords: () =>
      client.from('notification_records' as never) as unknown as AnyQueryBuilder,
  };
}

export type TypedSupabase = ReturnType<typeof createTypedSupabase>;
