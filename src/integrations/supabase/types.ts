export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      adin_contributor_requests: {
        Row: {
          admin_notes: string | null
          country_focus: string
          created_at: string
          description: string
          evidence_links: string[] | null
          id: string
          impact_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          country_focus: string
          created_at?: string
          description: string
          evidence_links?: string[] | null
          id?: string
          impact_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          country_focus?: string
          created_at?: string
          description?: string
          evidence_links?: string[] | null
          id?: string
          impact_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      adin_nudges: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          message: string
          nudge_type: string
          payload: Json | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          message: string
          nudge_type: string
          payload?: Json | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          message?: string
          nudge_type?: string
          payload?: Json | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      adin_preferences: {
        Row: {
          created_at: string | null
          email_comments: boolean | null
          email_connections: boolean | null
          email_enabled: boolean | null
          email_events: boolean | null
          email_mentions: boolean | null
          email_messages: boolean | null
          email_reactions: boolean | null
          email_stories: boolean | null
          id: string
          in_app_enabled: boolean | null
          notification_frequency: string | null
          nudge_categories: Json | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string | null
          unsubscribe_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_comments?: boolean | null
          email_connections?: boolean | null
          email_enabled?: boolean | null
          email_events?: boolean | null
          email_mentions?: boolean | null
          email_messages?: boolean | null
          email_reactions?: boolean | null
          email_stories?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_frequency?: string | null
          nudge_categories?: Json | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_comments?: boolean | null
          email_connections?: boolean | null
          email_enabled?: boolean | null
          email_events?: boolean | null
          email_mentions?: boolean | null
          email_messages?: boolean | null
          email_reactions?: boolean | null
          email_stories?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_frequency?: string | null
          nudge_categories?: Json | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      adin_recommendations: {
        Row: {
          created_at: string
          expires_at: string | null
          for_connection_id: string | null
          id: string
          payload: Json | null
          rec_type: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          for_connection_id?: string | null
          id?: string
          payload?: Json | null
          rec_type: string
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          for_connection_id?: string | null
          id?: string
          payload?: Json | null
          rec_type?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      adin_signals: {
        Row: {
          created_at: string | null
          created_by: string | null
          cta: string | null
          description: string | null
          id: string
          link: string | null
          region_focus: string[] | null
          sector_focus: string[] | null
          seen: boolean | null
          signal_data: Json | null
          signal_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          description?: string | null
          id?: string
          link?: string | null
          region_focus?: string[] | null
          sector_focus?: string[] | null
          seen?: boolean | null
          signal_data?: Json | null
          signal_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          description?: string | null
          id?: string
          link?: string | null
          region_focus?: string[] | null
          sector_focus?: string[] | null
          seen?: boolean | null
          signal_data?: Json | null
          signal_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adin_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adin_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      affirmations: {
        Row: {
          affirmed_at: string
          attested_at: string | null
          created_at: string
          id: string
          profile_id: string
          role_at_affirm: Database["public"]["Enums"]["dna_identity_role"]
          statement: string | null
          witness_id: string | null
        }
        Insert: {
          affirmed_at?: string
          attested_at?: string | null
          created_at?: string
          id?: string
          profile_id: string
          role_at_affirm: Database["public"]["Enums"]["dna_identity_role"]
          statement?: string | null
          witness_id?: string | null
        }
        Update: {
          affirmed_at?: string
          attested_at?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          role_at_affirm?: Database["public"]["Enums"]["dna_identity_role"]
          statement?: string | null
          witness_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affirmations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affirmations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affirmations_witness_id_fkey"
            columns: ["witness_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affirmations_witness_id_fkey"
            columns: ["witness_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alpha_feedback: {
        Row: {
          area: string | null
          category: string
          content: string
          created_at: string
          device_type: string | null
          id: string
          page_url: string | null
          user_id: string
          viewport: string | null
        }
        Insert: {
          area?: string | null
          category: string
          content: string
          created_at?: string
          device_type?: string | null
          id?: string
          page_url?: string | null
          user_id: string
          viewport?: string | null
        }
        Update: {
          area?: string | null
          category?: string
          content?: string
          created_at?: string
          device_type?: string | null
          id?: string
          page_url?: string | null
          user_id?: string
          viewport?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_metadata: Json | null
          event_name: string
          id: string
          route: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_metadata?: Json | null
          event_name: string
          id?: string
          route?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_metadata?: Json | null
          event_name?: string
          id?: string
          route?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string
          cover_letter: string
          id: string
          opportunity_id: string
          resume_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          cover_letter: string
          id?: string
          opportunity_id: string
          resume_url?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string
          id?: string
          opportunity_id?: string
          resume_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_definitions: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json | null
          description: string
          icon: string
          id: string
          name: string
          slug: string
          tier: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria?: Json | null
          description: string
          icon: string
          id?: string
          name: string
          slug: string
          tier?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json | null
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          tier?: string | null
        }
        Relationships: []
      }
      beta_waitlist: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_invite_sent_at: string | null
          last_invite_sent_by: string | null
          linkedin_url: string | null
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          last_invite_sent_at?: string | null
          last_invite_sent_by?: string | null
          linkedin_url?: string | null
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_invite_sent_at?: string | null
          last_invite_sent_by?: string | null
          linkedin_url?: string | null
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_transactions: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string
          status: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      causes: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean | null
          member_count: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string | null
          moderator_notes: string | null
          name: string
          purpose_goals: string | null
          rejection_reason: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          member_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          moderator_notes?: string | null
          name: string
          purpose_goals?: string | null
          rejection_reason?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          member_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          moderator_notes?: string | null
          name?: string
          purpose_goals?: string | null
          rejection_reason?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_event_attendees: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          image_url: string | null
          is_virtual: boolean | null
          location: string | null
          max_attendees: number | null
          registration_required: boolean | null
          registration_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_required?: boolean | null
          registration_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_required?: boolean | null
          registration_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          community_id: string
          id: string
          joined_at: string
          requested_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          community_id: string
          id?: string
          joined_at?: string
          requested_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          community_id?: string
          id?: string
          joined_at?: string
          requested_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string
          event_date: string | null
          event_location: string | null
          id: string
          is_pinned: boolean | null
          media_url: string | null
          post_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          id?: string
          is_pinned?: boolean | null
          media_url?: string | null
          post_type?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          id?: string
          is_pinned?: boolean | null
          media_url?: string | null
          post_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          message: string | null
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          recipient_id: string
          requester_id: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          flagged_by: string | null
          id: string
          moderator_notes: string | null
          reason: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          flagged_by?: string | null
          id?: string
          moderator_notes?: string | null
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          flagged_by?: string | null
          id?: string
          moderator_notes?: string | null
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation: {
        Row: {
          action: string
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          moderator_id: string | null
          reason: string | null
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          action: string
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          action?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_moderation_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      continents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contribution_acknowledgments: {
        Row: {
          created_at: string
          from_profile_id: string
          fulfillment_id: string
          id: string
          is_public: boolean
          message: string
          rating: number | null
          to_profile_id: string
        }
        Insert: {
          created_at?: string
          from_profile_id: string
          fulfillment_id: string
          id?: string
          is_public?: boolean
          message: string
          rating?: number | null
          to_profile_id: string
        }
        Update: {
          created_at?: string
          from_profile_id?: string
          fulfillment_id?: string
          id?: string
          is_public?: boolean
          message?: string
          rating?: number | null
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_acknowledgments_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_acknowledgments_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_acknowledgments_fulfillment_id_fkey"
            columns: ["fulfillment_id"]
            isOneToOne: false
            referencedRelation: "need_fulfillments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_acknowledgments_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_acknowledgments_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_cards: {
        Row: {
          amount_needed: number | null
          amount_raised: number | null
          contribution_type: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          impact_area: string | null
          location: string | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount_needed?: number | null
          amount_raised?: number | null
          contribution_type: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          impact_area?: string | null
          location?: string | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount_needed?: number | null
          amount_raised?: number | null
          contribution_type?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          impact_area?: string | null
          location?: string | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contribution_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_fulfillments: {
        Row: {
          completed_at: string | null
          completion_notes: string | null
          contributor_id: string
          created_at: string
          id: string
          opportunity_id: string
          poster_id: string
          revision_notes: string | null
          status: string
          submission_attachments: Json | null
          submission_notes: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_notes?: string | null
          contributor_id: string
          created_at?: string
          id?: string
          opportunity_id: string
          poster_id: string
          revision_notes?: string | null
          status?: string
          submission_attachments?: Json | null
          submission_notes?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_notes?: string | null
          contributor_id?: string
          created_at?: string
          id?: string
          opportunity_id?: string
          poster_id?: string
          revision_notes?: string | null
          status?: string
          submission_attachments?: Json | null
          submission_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_fulfillments_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_fulfillments_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_fulfillments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_fulfillments_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_fulfillments_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_manifests: {
        Row: {
          created_at: string
          headline: string | null
          id: string
          is_published: boolean
          last_reviewed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          headline?: string | null
          id?: string
          is_published?: boolean
          last_reviewed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          headline?: string | null
          id?: string
          is_published?: boolean
          last_reviewed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contribution_needs: {
        Row: {
          created_at: string
          created_by: string
          currency: string | null
          description: string
          duration: string | null
          focus_areas: string[] | null
          id: string
          needed_by: string | null
          priority: Database["public"]["Enums"]["contribution_need_priority"]
          region: string | null
          space_id: string
          status: Database["public"]["Enums"]["contribution_need_status"]
          target_amount: number | null
          time_commitment: string | null
          title: string
          type: Database["public"]["Enums"]["contribution_need_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string | null
          description: string
          duration?: string | null
          focus_areas?: string[] | null
          id?: string
          needed_by?: string | null
          priority?: Database["public"]["Enums"]["contribution_need_priority"]
          region?: string | null
          space_id: string
          status?: Database["public"]["Enums"]["contribution_need_status"]
          target_amount?: number | null
          time_commitment?: string | null
          title: string
          type: Database["public"]["Enums"]["contribution_need_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string
          duration?: string | null
          focus_areas?: string[] | null
          id?: string
          needed_by?: string | null
          priority?: Database["public"]["Enums"]["contribution_need_priority"]
          region?: string | null
          space_id?: string
          status?: Database["public"]["Enums"]["contribution_need_status"]
          target_amount?: number | null
          time_commitment?: string | null
          title?: string
          type?: Database["public"]["Enums"]["contribution_need_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_needs_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_offers: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string
          need_id: string
          offered_amount: number | null
          offered_currency: string | null
          space_id: string
          status: Database["public"]["Enums"]["contribution_offer_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message: string
          need_id: string
          offered_amount?: number | null
          offered_currency?: string | null
          space_id: string
          status?: Database["public"]["Enums"]["contribution_offer_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          need_id?: string
          offered_amount?: number | null
          offered_currency?: string | null
          space_id?: string
          status?: Database["public"]["Enums"]["contribution_offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_offers_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "contribution_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_offers_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_archived: boolean
          is_muted: boolean
          is_pinned: boolean
          joined_at: string
          last_read_at: string
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_archived?: boolean
          is_muted?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_archived?: boolean
          is_muted?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_new"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          bucket_for_a: string
          bucket_for_b: string
          created_at: string
          deleted_by_a: boolean | null
          deleted_by_b: boolean | null
          disappearing_seconds: number | null
          id: string
          is_archived_by_a: boolean | null
          is_archived_by_b: boolean | null
          is_muted_by_a: boolean | null
          is_muted_by_b: boolean | null
          is_pinned_by_a: boolean | null
          is_pinned_by_b: boolean | null
          last_message_at: string | null
          last_summarised_message_id: string | null
          summary_payload: Json | null
          user_a: string
          user_b: string
        }
        Insert: {
          bucket_for_a?: string
          bucket_for_b?: string
          created_at?: string
          deleted_by_a?: boolean | null
          deleted_by_b?: boolean | null
          disappearing_seconds?: number | null
          id?: string
          is_archived_by_a?: boolean | null
          is_archived_by_b?: boolean | null
          is_muted_by_a?: boolean | null
          is_muted_by_b?: boolean | null
          is_pinned_by_a?: boolean | null
          is_pinned_by_b?: boolean | null
          last_message_at?: string | null
          last_summarised_message_id?: string | null
          summary_payload?: Json | null
          user_a: string
          user_b: string
        }
        Update: {
          bucket_for_a?: string
          bucket_for_b?: string
          created_at?: string
          deleted_by_a?: boolean | null
          deleted_by_b?: boolean | null
          disappearing_seconds?: number | null
          id?: string
          is_archived_by_a?: boolean | null
          is_archived_by_b?: boolean | null
          is_muted_by_a?: boolean | null
          is_muted_by_b?: boolean | null
          is_pinned_by_a?: boolean | null
          is_pinned_by_b?: boolean | null
          last_message_at?: string | null
          last_summarised_message_id?: string | null
          summary_payload?: Json | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      conversations_new: {
        Row: {
          avatar_url: string | null
          conversation_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_message_at: string
          metadata: Json | null
          origin_id: string | null
          origin_type: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          conversation_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string
          metadata?: Json | null
          origin_id?: string | null
          origin_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          conversation_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string
          metadata?: Json | null
          origin_id?: string | null
          origin_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_new_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_new_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          capital: string | null
          capital_coordinates: Json | null
          country_code_iso2: string | null
          country_code_iso3: string | null
          country_slug: string | null
          created_at: string
          currency_code: string | null
          description: string | null
          description_full: string | null
          description_short: string | null
          diaspora_population_estimate: number | null
          diaspora_top_destinations: string[] | null
          flag_url: string | null
          gdp_growth_rate: number | null
          gdp_usd: number | null
          hero_image_url: string | null
          id: string
          interest_tags: string[] | null
          iso_code: string | null
          key_sectors: string[] | null
          name: string
          official_languages: string[] | null
          population: number | null
          region_id: string
          skill_relevance: string[] | null
          status: string | null
          tagline: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          capital?: string | null
          capital_coordinates?: Json | null
          country_code_iso2?: string | null
          country_code_iso3?: string | null
          country_slug?: string | null
          created_at?: string
          currency_code?: string | null
          description?: string | null
          description_full?: string | null
          description_short?: string | null
          diaspora_population_estimate?: number | null
          diaspora_top_destinations?: string[] | null
          flag_url?: string | null
          gdp_growth_rate?: number | null
          gdp_usd?: number | null
          hero_image_url?: string | null
          id?: string
          interest_tags?: string[] | null
          iso_code?: string | null
          key_sectors?: string[] | null
          name: string
          official_languages?: string[] | null
          population?: number | null
          region_id: string
          skill_relevance?: string[] | null
          status?: string | null
          tagline?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          capital?: string | null
          capital_coordinates?: Json | null
          country_code_iso2?: string | null
          country_code_iso3?: string | null
          country_slug?: string | null
          created_at?: string
          currency_code?: string | null
          description?: string | null
          description_full?: string | null
          description_short?: string | null
          diaspora_population_estimate?: number | null
          diaspora_top_destinations?: string[] | null
          flag_url?: string | null
          gdp_growth_rate?: number | null
          gdp_usd?: number | null
          hero_image_url?: string | null
          id?: string
          interest_tags?: string[] | null
          iso_code?: string | null
          key_sectors?: string[] | null
          name?: string
          official_languages?: string[] | null
          population?: number | null
          region_id?: string
          skill_relevance?: string[] | null
          status?: string | null
          tagline?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          events_processed: number | null
          id: string
          job_name: string
          metadata: Json | null
          reminders_sent: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          events_processed?: number | null
          id?: string
          job_name: string
          metadata?: Json | null
          reminders_sent?: number | null
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          events_processed?: number | null
          id?: string
          job_name?: string
          metadata?: Json | null
          reminders_sent?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      currency_stances: {
        Row: {
          archived_at: string | null
          availability: Database["public"]["Enums"]["stance_availability"]
          created_at: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          description: string | null
          display_order: number
          id: string
          is_archived: boolean
          manifest_id: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["stance_visibility"]
        }
        Insert: {
          archived_at?: string | null
          availability?: Database["public"]["Enums"]["stance_availability"]
          created_at?: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          description?: string | null
          display_order?: number
          id?: string
          is_archived?: boolean
          manifest_id: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["stance_visibility"]
        }
        Update: {
          archived_at?: string | null
          availability?: Database["public"]["Enums"]["stance_availability"]
          created_at?: string
          currency?: Database["public"]["Enums"]["contribution_currency"]
          description?: string | null
          display_order?: number
          id?: string
          is_archived?: boolean
          manifest_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["stance_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "currency_stances_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "contribution_manifests"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_analytics: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          route: string | null
          session_id: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          route?: string | null
          session_id?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          route?: string | null
          session_id?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dia_brief_cards: {
        Row: {
          body: string
          brief_date: string
          c_module: string
          cta_label: string
          cta_route: string
          expires_at: string
          generated_at: string
          id: string
          is_fallback: boolean
          position: number
          reasoning: string
          signal_strength: number
          signal_type: string
          target_entity_id: string | null
          target_entity_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          brief_date: string
          c_module: string
          cta_label: string
          cta_route: string
          expires_at: string
          generated_at?: string
          id?: string
          is_fallback?: boolean
          position: number
          reasoning: string
          signal_strength: number
          signal_type: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          brief_date?: string
          c_module?: string
          cta_label?: string
          cta_route?: string
          expires_at?: string
          generated_at?: string
          id?: string
          is_fallback?: boolean
          position?: number
          reasoning?: string
          signal_strength?: number
          signal_type?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dia_brief_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dia_brief_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dia_brief_interactions: {
        Row: {
          card_id: string
          created_at: string
          id: string
          interaction_type: Database["public"]["Enums"]["brief_interaction_type"]
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          interaction_type: Database["public"]["Enums"]["brief_interaction_type"]
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          interaction_type?: Database["public"]["Enums"]["brief_interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dia_brief_interactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "dia_brief_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dia_brief_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dia_brief_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dia_brief_snoozes: {
        Row: {
          created_at: string
          id: string
          snoozed_until: string
          thread_id: string
          thread_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          snoozed_until: string
          thread_id: string
          thread_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          snoozed_until?: string
          thread_id?: string
          thread_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dia_insights: {
        Row: {
          category: string | null
          click_count: number | null
          created_at: string | null
          description: string
          display_order: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          query_prompt: string
          region: string | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          click_count?: number | null
          created_at?: string | null
          description: string
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          query_prompt: string
          region?: string | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          click_count?: number | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          query_prompt?: string
          region?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dia_messaging_events: {
        Row: {
          conversation_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          model: string | null
          ref_id: string | null
          user_id: string
          variant: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          model?: string | null
          ref_id?: string | null
          user_id: string
          variant?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          ref_id?: string | null
          user_id?: string
          variant?: string | null
        }
        Relationships: []
      }
      dia_messaging_feedback: {
        Row: {
          conversation_id: string
          created_at: string
          helpful: boolean
          id: string
          model: string | null
          ref_id: string | null
          surface: string
          user_id: string
          variant: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          helpful: boolean
          id?: string
          model?: string | null
          ref_id?: string | null
          surface: string
          user_id: string
          variant?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          helpful?: boolean
          id?: string
          model?: string | null
          ref_id?: string | null
          surface?: string
          user_id?: string
          variant?: string | null
        }
        Relationships: []
      }
      dia_messaging_prefs: {
        Row: {
          created_at: string
          email_digest: boolean
          smart_replies_enabled: boolean
          summaries_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_digest?: boolean
          smart_replies_enabled?: boolean
          summaries_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_digest?: boolean
          smart_replies_enabled?: boolean
          summaries_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dia_queries: {
        Row: {
          cache_hits: number | null
          citations: Json | null
          created_at: string | null
          estimated_cost: number | null
          expires_at: string | null
          id: string
          model_used: string | null
          network_matches: Json | null
          normalized_query: string
          perplexity_response: Json
          query_hash: string
          query_text: string
          tokens_used: number | null
        }
        Insert: {
          cache_hits?: number | null
          citations?: Json | null
          created_at?: string | null
          estimated_cost?: number | null
          expires_at?: string | null
          id?: string
          model_used?: string | null
          network_matches?: Json | null
          normalized_query: string
          perplexity_response: Json
          query_hash: string
          query_text: string
          tokens_used?: number | null
        }
        Update: {
          cache_hits?: number | null
          citations?: Json | null
          created_at?: string | null
          estimated_cost?: number | null
          expires_at?: string | null
          id?: string
          model_used?: string | null
          network_matches?: Json | null
          normalized_query?: string
          perplexity_response?: Json
          query_hash?: string
          query_text?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      dia_query_log: {
        Row: {
          cache_hit: boolean | null
          created_at: string | null
          id: string
          query_text: string
          response_time_ms: number | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          created_at?: string | null
          id?: string
          query_text: string
          response_time_ms?: number | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          created_at?: string | null
          id?: string
          query_text?: string
          response_time_ms?: number | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dia_user_usage: {
        Row: {
          created_at: string | null
          id: string
          last_query_at: string | null
          period_start: string
          query_count: number | null
          query_limit: number | null
          total_estimated_cost: number | null
          total_tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_query_at?: string | null
          period_start: string
          query_count?: number | null
          query_limit?: number | null
          total_estimated_cost?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_query_at?: string | null
          period_start?: string
          query_count?: number | null
          query_limit?: number | null
          total_estimated_cost?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diaspora_data: {
        Row: {
          country_id: string | null
          created_at: string
          currency: string | null
          diaspora_location: string | null
          diaspora_name: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          project_name: string | null
          project_type: string | null
          remittance_value: number | null
          story_content: string | null
          story_title: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          currency?: string | null
          diaspora_location?: string | null
          diaspora_name?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          project_name?: string | null
          project_type?: string | null
          remittance_value?: number | null
          story_content?: string | null
          story_title?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          country_id?: string | null
          created_at?: string
          currency?: string | null
          diaspora_location?: string | null
          diaspora_name?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          project_name?: string | null
          project_type?: string | null
          remittance_value?: number | null
          story_content?: string | null
          story_title?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diaspora_data_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_indicators: {
        Row: {
          country_id: string | null
          created_at: string
          id: string
          indicator_type: string
          month: number | null
          province_id: string | null
          region_id: string | null
          source: string | null
          unit: string | null
          updated_at: string
          value: number
          year: number
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          id?: string
          indicator_type: string
          month?: number | null
          province_id?: string | null
          region_id?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string
          value: number
          year: number
        }
        Update: {
          country_id?: string | null
          created_at?: string
          id?: string
          indicator_type?: string
          month?: number | null
          province_id?: string | null
          region_id?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "economic_indicators_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "economic_indicators_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "economic_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_vectors: {
        Row: {
          created_at: string
          dimension: number
          entity_id: string
          entity_type: string
          id: string
          source: string
          updated_at: string
          vector: Json
        }
        Insert: {
          created_at?: string
          dimension?: number
          entity_id: string
          entity_type: string
          id?: string
          source: string
          updated_at?: string
          vector: Json
        }
        Update: {
          created_at?: string
          dimension?: number
          entity_id?: string
          entity_type?: string
          id?: string
          source?: string
          updated_at?: string
          vector?: Json
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component_stack: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_analytics: {
        Row: {
          event_id: string | null
          happened_at: string | null
          id: string
          kind: string | null
          payload: Json | null
        }
        Insert: {
          event_id?: string | null
          happened_at?: string | null
          id?: string
          kind?: string | null
          payload?: Json | null
        }
        Update: {
          event_id?: string | null
          happened_at?: string | null
          id?: string
          kind?: string | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
          event_id: string
          guest_name: string | null
          id: string
          qr_code_token: string | null
          response_note: string | null
          source: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          guest_name?: string | null
          id?: string
          qr_code_token?: string | null
          response_note?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          guest_name?: string | null
          id?: string
          qr_code_token?: string | null
          response_note?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_blasts: {
        Row: {
          body_markdown: string
          event_id: string | null
          id: string
          scheduled_for: string | null
          segment: Json | null
          sent_at: string | null
          subject: string
        }
        Insert: {
          body_markdown: string
          event_id?: string | null
          id?: string
          scheduled_for?: string | null
          segment?: Json | null
          sent_at?: string | null
          subject: string
        }
        Update: {
          body_markdown?: string
          event_id?: string | null
          id?: string
          scheduled_for?: string | null
          segment?: Json | null
          sent_at?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_blasts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checkins: {
        Row: {
          by_profile_id: string | null
          checked_in_at: string | null
          id: string
          registration_id: string | null
        }
        Insert: {
          by_profile_id?: string | null
          checked_in_at?: string | null
          id?: string
          registration_id?: string | null
        }
        Update: {
          by_profile_id?: string | null
          checked_in_at?: string | null
          id?: string
          registration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_checkins_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          event_id: string
          id: string
          is_deleted: boolean
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          event_id: string
          id?: string
          is_deleted?: boolean
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          is_deleted?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          event_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          event_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          event_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_questions: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          label: string
          options: Json | null
          position: number | null
          required: boolean | null
          type: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          label: string
          options?: Json | null
          position?: number | null
          required?: boolean | null
          type: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          label?: string
          options?: Json | null
          position?: number | null
          required?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          answers: Json | null
          cancelled_at: string | null
          currency: string | null
          event_id: string
          id: string
          join_token: string | null
          notes: string | null
          price_paid_cents: number | null
          registered_at: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          ticket_type_id: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          cancelled_at?: string | null
          currency?: string | null
          event_id: string
          id?: string
          join_token?: string | null
          notes?: string | null
          price_paid_cents?: number | null
          registered_at?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_type_id?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          cancelled_at?: string | null
          currency?: string | null
          event_id?: string
          id?: string
          join_token?: string | null
          notes?: string | null
          price_paid_cents?: number | null
          registered_at?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_type_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminder_logs: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notification_id: string | null
          reminder_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notification_id?: string | null
          reminder_type?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notification_id?: string | null
          reminder_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminder_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminder_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reports: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          reason: string
          reported_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          reason: string
          reported_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          reason?: string
          reported_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_roles: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          permissions?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_holds: {
        Row: {
          created_at: string
          event_id: string | null
          expires_at: string
          id: string
          quantity: number | null
          ticket_type_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          expires_at: string
          id?: string
          quantity?: number | null
          ticket_type_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          expires_at?: string
          id?: string
          quantity?: number | null
          ticket_type_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_holds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ticket_holds_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ticket_holds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ticket_holds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_types: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string | null
          hidden: boolean | null
          id: string
          min_price_cents: number | null
          name: string
          payment_type: string
          price_cents: number | null
          require_approval: boolean | null
          sales_end: string | null
          sales_start: string | null
          suggested_price_cents: number | null
          total_tickets: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          hidden?: boolean | null
          id?: string
          min_price_cents?: number | null
          name: string
          payment_type?: string
          price_cents?: number | null
          require_approval?: boolean | null
          sales_end?: string | null
          sales_start?: string | null
          suggested_price_cents?: number | null
          total_tickets?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          hidden?: boolean | null
          id?: string
          min_price_cents?: number | null
          name?: string
          payment_type?: string
          price_cents?: number | null
          require_approval?: boolean | null
          sales_end?: string | null
          sales_start?: string | null
          suggested_price_cents?: number | null
          total_tickets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_waitlist: {
        Row: {
          created_at: string
          event_id: string
          id: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          position: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agenda: Json | null
          allow_guests: boolean
          cancellation_reason: string | null
          cover_image_url: string | null
          created_at: string
          curated_at: string | null
          curated_source: string | null
          curated_source_url: string | null
          description: string
          dress_code: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          format: Database["public"]["Enums"]["event_format"]
          group_id: string | null
          id: string
          is_cancelled: boolean
          is_curated: boolean | null
          is_flagship: boolean | null
          is_public: boolean
          is_published: boolean
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_attendees: number | null
          meeting_platform: string | null
          meeting_url: string | null
          organizer_id: string | null
          requires_approval: boolean
          short_description: string | null
          slug: string | null
          speakers: Json | null
          start_time: string
          status: string | null
          subtitle: string | null
          tags: string[] | null
          timezone: string
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          agenda?: Json | null
          allow_guests?: boolean
          cancellation_reason?: string | null
          cover_image_url?: string | null
          created_at?: string
          curated_at?: string | null
          curated_source?: string | null
          curated_source_url?: string | null
          description: string
          dress_code?: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          format: Database["public"]["Enums"]["event_format"]
          group_id?: string | null
          id?: string
          is_cancelled?: boolean
          is_curated?: boolean | null
          is_flagship?: boolean | null
          is_public?: boolean
          is_published?: boolean
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_attendees?: number | null
          meeting_platform?: string | null
          meeting_url?: string | null
          organizer_id?: string | null
          requires_approval?: boolean
          short_description?: string | null
          slug?: string | null
          speakers?: Json | null
          start_time: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          timezone?: string
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          agenda?: Json | null
          allow_guests?: boolean
          cancellation_reason?: string | null
          cover_image_url?: string | null
          created_at?: string
          curated_at?: string | null
          curated_source?: string | null
          curated_source_url?: string | null
          description?: string
          dress_code?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          format?: Database["public"]["Enums"]["event_format"]
          group_id?: string | null
          id?: string
          is_cancelled?: boolean
          is_curated?: boolean | null
          is_flagship?: boolean | null
          is_public?: boolean
          is_published?: boolean
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_attendees?: number | null
          meeting_platform?: string | null
          meeting_url?: string | null
          organizer_id?: string | null
          requires_approval?: boolean
          short_description?: string | null
          slug?: string | null
          speakers?: Json | null
          start_time?: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          timezone?: string
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      events_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          feature_key: string
          is_enabled: boolean
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          is_enabled?: boolean
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          is_enabled?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feed_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_comments: {
        Row: {
          body: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_engagement_events: {
        Row: {
          action: string
          created_at: string
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          metadata: Json | null
          post_id: string
          post_type: string
          surface: string
          tab: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          metadata?: Json | null
          post_id: string
          post_type: string
          surface: string
          tab?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          metadata?: Json | null
          post_id?: string
          post_type?: string
          surface?: string
          tab?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feed_reactions: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_research_responses: {
        Row: {
          check_frequency: string
          concerns: Json | null
          content_to_see: Json | null
          content_to_share: Json | null
          created_at: string | null
          differentiation_idea: string | null
          dream_feature: string | null
          early_access_email: string | null
          feature_ratings: Json | null
          id: string
          post_frequency: string
          updated_at: string | null
          use_case: string | null
          user_id: string
          value_rating: string
          wants_early_access: boolean | null
        }
        Insert: {
          check_frequency: string
          concerns?: Json | null
          content_to_see?: Json | null
          content_to_share?: Json | null
          created_at?: string | null
          differentiation_idea?: string | null
          dream_feature?: string | null
          early_access_email?: string | null
          feature_ratings?: Json | null
          id?: string
          post_frequency: string
          updated_at?: string | null
          use_case?: string | null
          user_id: string
          value_rating: string
          wants_early_access?: boolean | null
        }
        Update: {
          check_frequency?: string
          concerns?: Json | null
          content_to_see?: Json | null
          content_to_share?: Json | null
          created_at?: string | null
          differentiation_idea?: string | null
          dream_feature?: string | null
          early_access_email?: string | null
          feature_ratings?: Json | null
          id?: string
          post_frequency?: string
          updated_at?: string | null
          use_case?: string | null
          user_id?: string
          value_rating?: string
          wants_early_access?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_research_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_research_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reshares: {
        Row: {
          commentary: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          commentary?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          commentary?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_attachments: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "feedback_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_channel_memberships: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          last_read_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_channel_memberships_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "feedback_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_channels: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback_messages: {
        Row: {
          admin_notes: string | null
          category: string | null
          channel_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_highlighted: boolean | null
          is_pinned: boolean | null
          message_type: string
          parent_id: string | null
          priority: string | null
          reply_count: number | null
          sender_id: string
          status: string
          updated_at: string | null
          user_tag: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string | null
          channel_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_highlighted?: boolean | null
          is_pinned?: boolean | null
          message_type?: string
          parent_id?: string | null
          priority?: string | null
          reply_count?: number | null
          sender_id: string
          status?: string
          updated_at?: string | null
          user_tag?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string | null
          channel_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_highlighted?: boolean | null
          is_pinned?: boolean | null
          message_type?: string
          parent_id?: string | null
          priority?: string | null
          reply_count?: number | null
          sender_id?: string
          status?: string
          updated_at?: string | null
          user_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "feedback_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feedback_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "feedback_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      geographic_relevance: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          hub_id: string
          hub_type: string
          id: string
          relevance_score: number | null
          relevance_type: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          hub_id: string
          hub_type: string
          id?: string
          relevance_score?: number | null
          relevance_type?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          hub_id?: string
          hub_type?: string
          id?: string
          relevance_score?: number | null
          relevance_type?: string | null
        }
        Relationships: []
      }
      group_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_ids: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_ids: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_ids?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          banned_at: string | null
          banned_by: string | null
          banned_reason: string | null
          group_id: string
          id: string
          is_banned: boolean
          joined_at: string
          role: Database["public"]["Enums"]["group_member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          group_id: string
          id?: string
          is_banned?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          group_id?: string
          id?: string
          is_banned?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_mentions: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          mentioned_user_id: string
          message_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          mentioned_user_id: string
          message_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          mentioned_user_id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_mentions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_new"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          read_by: string[] | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "group_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          author_id: string
          comment_count: number
          content: string
          created_at: string
          group_id: string
          id: string
          image_urls: string[] | null
          is_deleted: boolean
          is_pinned: boolean
          like_count: number
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_count?: number
          content: string
          created_at?: string
          group_id: string
          id?: string
          image_urls?: string[] | null
          is_deleted?: boolean
          is_pinned?: boolean
          like_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_count?: number
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          image_urls?: string[] | null
          is_deleted?: boolean
          is_pinned?: boolean
          like_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_starred_messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_new"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          join_policy: Database["public"]["Enums"]["group_join_policy"]
          location: string | null
          member_count: number
          name: string
          post_count: number
          privacy: Database["public"]["Enums"]["group_privacy"]
          search_vector: unknown
          slug: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          join_policy?: Database["public"]["Enums"]["group_join_policy"]
          location?: string | null
          member_count?: number
          name: string
          post_count?: number
          privacy?: Database["public"]["Enums"]["group_privacy"]
          search_vector?: unknown
          slug: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          join_policy?: Database["public"]["Enums"]["group_join_policy"]
          location?: string | null
          member_count?: number
          name?: string
          post_count?: number
          privacy?: Database["public"]["Enums"]["group_privacy"]
          search_vector?: unknown
          slug?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      hashtag_analytics: {
        Row: {
          created_at: string | null
          date: string
          engagement_count: number | null
          follower_change: number | null
          hashtag_id: string
          id: string
          unique_users: number | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          engagement_count?: number | null
          follower_change?: number | null
          hashtag_id: string
          id?: string
          unique_users?: number | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          engagement_count?: number | null
          follower_change?: number | null
          hashtag_id?: string
          id?: string
          unique_users?: number | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_analytics_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_followers: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_followers_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_usage_requests: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          owner_id: string
          post_id: string
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          owner_id: string
          post_id: string
          requester_id: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
          owner_id?: string
          post_id?: string
          requester_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_usage_requests_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_usage_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_usage_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_usage_requests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_usage_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_usage_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          first_used_at: string
          follower_count: number | null
          id: string
          is_personal: boolean | null
          is_verified: boolean | null
          last_used_at: string
          owner_id: string | null
          requires_approval: boolean | null
          status: Database["public"]["Enums"]["hashtag_status"] | null
          tag: string
          type: Database["public"]["Enums"]["hashtag_type"] | null
          updated_at: string | null
          usage_count: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          first_used_at?: string
          follower_count?: number | null
          id?: string
          is_personal?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string
          owner_id?: string | null
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["hashtag_status"] | null
          tag: string
          type?: Database["public"]["Enums"]["hashtag_type"] | null
          updated_at?: string | null
          usage_count?: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          first_used_at?: string
          follower_count?: number | null
          id?: string
          is_personal?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string
          owner_id?: string | null
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["hashtag_status"] | null
          tag?: string
          type?: Database["public"]["Enums"]["hashtag_type"] | null
          updated_at?: string | null
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "hashtags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_metrics: {
        Row: {
          connections_made: number | null
          contributions_total: number | null
          created_at: string | null
          events_hosted: number | null
          hub_id: string
          hub_type: string
          id: string
          last_calculated_at: string | null
          members_connected: number | null
          projects_active: number | null
          stories_published: number | null
          updated_at: string | null
        }
        Insert: {
          connections_made?: number | null
          contributions_total?: number | null
          created_at?: string | null
          events_hosted?: number | null
          hub_id: string
          hub_type: string
          id?: string
          last_calculated_at?: string | null
          members_connected?: number | null
          projects_active?: number | null
          stories_published?: number | null
          updated_at?: string | null
        }
        Update: {
          connections_made?: number | null
          contributions_total?: number | null
          created_at?: string | null
          events_hosted?: number | null
          hub_id?: string
          hub_type?: string
          id?: string
          last_calculated_at?: string | null
          members_connected?: number | null
          projects_active?: number | null
          stories_published?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hub_notification_signups: {
        Row: {
          created_at: string
          email: string
          hub: string
          id: string
          name: string | null
          preferences: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          hub: string
          id?: string
          name?: string | null
          preferences?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          hub?: string
          id?: string
          name?: string | null
          preferences?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      impact_attributions: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          impact_type: string | null
          metric: Json | null
          source_event_id: string | null
          verified_by: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          impact_type?: string | null
          metric?: Json | null
          source_event_id?: string | null
          verified_by?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          impact_type?: string | null
          metric?: Json | null
          source_event_id?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      impact_badges: {
        Row: {
          active: boolean
          badge_key: string
          created_at: string
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          badge_key: string
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          badge_key?: string
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      impact_log: {
        Row: {
          action_type: string | null
          context: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          pillar: string | null
          points: number | null
          score: number | null
          target_id: string | null
          target_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_type?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pillar?: string | null
          points?: number | null
          score?: number | null
          target_id?: string | null
          target_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          action_type?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pillar?: string | null
          points?: number | null
          score?: number | null
          target_id?: string | null
          target_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      initiatives: {
        Row: {
          completed_at: string | null
          completion_metrics: Json | null
          created_at: string | null
          created_by: string | null
          creator_id: string
          description: string | null
          id: string
          impact_area: string | null
          order_index: number | null
          space_id: string | null
          started_at: string | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_metrics?: Json | null
          created_at?: string | null
          created_by?: string | null
          creator_id: string
          description?: string | null
          id?: string
          impact_area?: string | null
          order_index?: number | null
          space_id?: string | null
          started_at?: string | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_metrics?: Json | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          impact_area?: string | null
          order_index?: number | null
          space_id?: string | null
          started_at?: string | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_data: {
        Row: {
          country_id: string | null
          created_at: string
          description: string | null
          featured: boolean | null
          founded_year: number | null
          funding_amount: number | null
          funding_currency: string | null
          id: string
          logo_url: string | null
          name: string
          organization_type: string
          province_id: string | null
          sector: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          founded_year?: number | null
          funding_amount?: number | null
          funding_currency?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_type: string
          province_id?: string | null
          sector?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          founded_year?: number | null
          funding_amount?: number | null
          funding_currency?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_type?: string
          province_id?: string | null
          sector?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "innovation_data_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innovation_data_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      introductions: {
        Row: {
          context: Json | null
          conversation_id: string | null
          created_at: string
          id: string
          intro_type: string
          introducer_id: string
          message: string | null
          person_a_id: string
          person_b_id: string
          status: string
        }
        Insert: {
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          intro_type?: string
          introducer_id: string
          message?: string | null
          person_a_id: string
          person_b_id: string
          status?: string
        }
        Update: {
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          intro_type?: string
          introducer_id?: string
          message?: string | null
          person_a_id?: string
          person_b_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "introductions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_introducer_id_fkey"
            columns: ["introducer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_introducer_id_fkey"
            columns: ["introducer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_person_a_id_fkey"
            columns: ["person_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_person_a_id_fkey"
            columns: ["person_a_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_person_b_id_fkey"
            columns: ["person_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_person_b_id_fkey"
            columns: ["person_b_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          referral_code: string | null
          role: string | null
          used_at: string | null
          used_by_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          referral_code?: string | null
          role?: string | null
          used_at?: string | null
          used_by_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          referral_code?: string | null
          role?: string | null
          used_at?: string | null
          used_by_id?: string | null
        }
        Relationships: []
      }
      mcp_tool_events: {
        Row: {
          client_id: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          input_summary: Json | null
          latency_ms: number
          success: boolean
          tool_name: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_summary?: Json | null
          latency_ms: number
          success: boolean
          tool_name: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_summary?: Json | null
          latency_ms?: number
          success?: boolean
          tool_name?: string
        }
        Relationships: []
      }
      member_heritage: {
        Row: {
          created_at: string
          diaspora_networks: string[]
          ethnic_heritage: string[]
          heritage_notes: string | null
          id: string
          is_primary: boolean
          origin_country: string
          profile_id: string
          source_archive_ref: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diaspora_networks?: string[]
          ethnic_heritage?: string[]
          heritage_notes?: string | null
          id?: string
          is_primary?: boolean
          origin_country: string
          profile_id: string
          source_archive_ref?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diaspora_networks?: string[]
          ethnic_heritage?: string[]
          heritage_notes?: string | null
          id?: string
          is_primary?: boolean
          origin_country?: string
          profile_id?: string
          source_archive_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_heritage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_heritage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_mentions: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          mentioned_user_id: string
          message_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          mentioned_user_id: string
          message_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          mentioned_user_id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_mentions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_rate_log: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: number
          sender_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: number
          sender_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: number
          sender_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      message_receipts: {
        Row: {
          conversation_id: string
          created_at: string
          delivered_at: string | null
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          client_id: string | null
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          forwarded_from_message_id: string | null
          id: string
          is_deleted: boolean
          payload: Json | null
          read: boolean
          sender_id: string
        }
        Insert: {
          client_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_deleted?: boolean
          payload?: Json | null
          read?: boolean
          sender_id: string
        }
        Update: {
          client_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_deleted?: boolean
          payload?: Json | null
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_new: {
        Row: {
          client_id: string | null
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          forwarded_from_message_id: string | null
          id: string
          is_deleted: boolean
          media_urls: Json | null
          message_type: string
          payload: Json | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_deleted?: boolean
          media_urls?: Json | null
          message_type?: string
          payload?: Json | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_deleted?: boolean
          media_urls?: Json | null
          message_type?: string
          payload?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_new_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_new_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "messages_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_new_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages_new"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          celebration_shared: boolean | null
          completion_date: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          initiative_id: string | null
          order_index: number | null
          space_id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          celebration_shared?: boolean | null
          completion_date?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id?: string | null
          order_index?: number | null
          space_id: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          celebration_shared?: boolean | null
          completion_date?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id?: string | null
          order_index?: number | null
          space_id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      module_status: {
        Row: {
          label: string
          module: string
          state: Database["public"]["Enums"]["module_status_state"]
          target_launch: string | null
          updated_at: string
        }
        Insert: {
          label: string
          module: string
          state: Database["public"]["Enums"]["module_status_state"]
          target_launch?: string | null
          updated_at?: string
        }
        Update: {
          label?: string
          module?: string
          state?: Database["public"]["Enums"]["module_status_state"]
          target_launch?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          country_id: string | null
          created_at: string
          diaspora_spotlight: string | null
          economic_summary: string | null
          featured_image_url: string | null
          id: string
          innovation_highlight: string | null
          is_published: boolean | null
          political_summary: string | null
          published_at: string | null
          region_id: string | null
          report_month: number
          report_year: number
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          diaspora_spotlight?: string | null
          economic_summary?: string | null
          featured_image_url?: string | null
          id?: string
          innovation_highlight?: string | null
          is_published?: boolean | null
          political_summary?: string | null
          published_at?: string | null
          region_id?: string | null
          report_month: number
          report_year: number
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          diaspora_spotlight?: string | null
          economic_summary?: string | null
          featured_image_url?: string | null
          id?: string
          innovation_highlight?: string | null
          is_published?: boolean | null
          political_summary?: string | null
          published_at?: string | null
          region_id?: string | null
          report_month?: number
          report_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      muted_authors: {
        Row: {
          created_at: string
          id: string
          muted_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muted_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muted_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      need_declarations: {
        Row: {
          closed_at: string | null
          context: string | null
          created_at: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          ends_at: string | null
          expires_at: string | null
          id: string
          published_at: string | null
          related_stance_id: string | null
          scope: Database["public"]["Enums"]["need_scope"]
          starts_at: string | null
          status: Database["public"]["Enums"]["need_status"]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["stance_visibility"]
        }
        Insert: {
          closed_at?: string | null
          context?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          published_at?: string | null
          related_stance_id?: string | null
          scope?: Database["public"]["Enums"]["need_scope"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["need_status"]
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["stance_visibility"]
        }
        Update: {
          closed_at?: string | null
          context?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["contribution_currency"]
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          published_at?: string | null
          related_stance_id?: string | null
          scope?: Database["public"]["Enums"]["need_scope"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["need_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["stance_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "need_declarations_related_stance_id_fkey"
            columns: ["related_stance_id"]
            isOneToOne: false
            referencedRelation: "currency_stances"
            referencedColumns: ["id"]
          },
        ]
      }
      need_fulfillments: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          created_at: string
          fulfilled_at: string | null
          fulfiller_id: string
          fulfiller_message: string | null
          id: string
          need_id: string
          requester_id: string
          room_curation_id: string | null
          status: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          fulfiller_id: string
          fulfiller_message?: string | null
          id?: string
          need_id: string
          requester_id: string
          room_curation_id?: string | null
          status?: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          fulfiller_id?: string
          fulfiller_message?: string | null
          id?: string
          need_id?: string
          requester_id?: string
          room_curation_id?: string | null
          status?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "need_fulfillments_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "need_declarations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_fulfillments_room_curation_id_fkey"
            columns: ["room_curation_id"]
            isOneToOne: false
            referencedRelation: "room_curations"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          country_interests: string[] | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          region_interest: string | null
          subscription_type: string | null
          updated_at: string
        }
        Insert: {
          country_interests?: string[] | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          region_interest?: string | null
          subscription_type?: string | null
          updated_at?: string
        }
        Update: {
          country_interests?: string[] | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          region_interest?: string | null
          subscription_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscriptions_region_interest_fkey"
            columns: ["region_interest"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          payload: Json | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          payload?: Json | null
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          payload?: Json | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nudges: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          id: string
          message: string
          sent_at: string | null
          sent_by: string | null
          space_id: string
          target_user_id: string
          task_id: string | null
          tone: string | null
          type: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          message: string
          sent_at?: string | null
          sent_by?: string | null
          space_id: string
          target_user_id: string
          task_id?: string | null
          tone?: string | null
          type?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          message?: string
          sent_at?: string | null
          sent_by?: string | null
          space_id?: string
          target_user_id?: string
          task_id?: string | null
          tone?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nudges_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          link: string | null
          location: string | null
          space_id: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          location?: string | null
          space_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          location?: string | null
          space_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string | null
          id: string
          opportunity_id: string
          poster_notes: string | null
          proposed_contribution_type: Database["public"]["Enums"]["contribution_type"]
          proposed_hours_per_month: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          status_updated_at: string | null
          updated_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          opportunity_id: string
          poster_notes?: string | null
          proposed_contribution_type: Database["public"]["Enums"]["contribution_type"]
          proposed_hours_per_month?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          status_updated_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          opportunity_id?: string
          poster_notes?: string | null
          proposed_contribution_type?: Database["public"]["Enums"]["contribution_type"]
          proposed_hours_per_month?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          status_updated_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_bookmarks: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_bookmarks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_contributions: {
        Row: {
          application_id: string | null
          completed_at: string | null
          contribution_type: Database["public"]["Enums"]["contribution_type"]
          contributor_id: string
          created_at: string | null
          description: string | null
          hours_contributed: number | null
          id: string
          opportunity_id: string
          started_at: string | null
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          application_id?: string | null
          completed_at?: string | null
          contribution_type: Database["public"]["Enums"]["contribution_type"]
          contributor_id: string
          created_at?: string | null
          description?: string | null
          hours_contributed?: number | null
          id?: string
          opportunity_id: string
          started_at?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          application_id?: string | null
          completed_at?: string | null
          contribution_type?: Database["public"]["Enums"]["contribution_type"]
          contributor_id?: string
          created_at?: string | null
          description?: string | null
          hours_contributed?: number | null
          id?: string
          opportunity_id?: string
          started_at?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_contributions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "opportunity_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contributions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contributions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contributions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contributions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contributions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_interests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          opportunity_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          opportunity_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          opportunity_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_interests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_verification_requests: {
        Row: {
          annual_budget_usd: number | null
          created_at: string | null
          description_of_work: string | null
          financial_document_url: string | null
          id: string
          organization_id: string
          proof_of_activity_url: string | null
          reference_1_email: string | null
          reference_1_name: string | null
          reference_1_relationship: string | null
          reference_2_email: string | null
          reference_2_name: string | null
          reference_2_relationship: string | null
          registration_document_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          social_media_links: string[] | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          annual_budget_usd?: number | null
          created_at?: string | null
          description_of_work?: string | null
          financial_document_url?: string | null
          id?: string
          organization_id: string
          proof_of_activity_url?: string | null
          reference_1_email?: string | null
          reference_1_name?: string | null
          reference_1_relationship?: string | null
          reference_2_email?: string | null
          reference_2_name?: string | null
          reference_2_relationship?: string | null
          registration_document_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          social_media_links?: string[] | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          annual_budget_usd?: number | null
          created_at?: string | null
          description_of_work?: string | null
          financial_document_url?: string | null
          id?: string
          organization_id?: string
          proof_of_activity_url?: string | null
          reference_1_email?: string | null
          reference_1_name?: string | null
          reference_1_relationship?: string | null
          reference_2_email?: string | null
          reference_2_name?: string | null
          reference_2_relationship?: string | null
          registration_document_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          social_media_links?: string[] | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_verification_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          annual_budget_usd: number | null
          country_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          opportunities_posted_this_year: number | null
          owner_user_id: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          verification_approved_at: string | null
          verification_documents_url: string | null
          verification_fee_paid: boolean | null
          verification_notes: string | null
          verification_rejected_at: string | null
          verification_status: string | null
          verification_submitted_at: string | null
          verified: boolean | null
          verified_at: string | null
          website: string | null
          year_reset_at: string | null
        }
        Insert: {
          annual_budget_usd?: number | null
          country_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          opportunities_posted_this_year?: number | null
          owner_user_id: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          verification_approved_at?: string | null
          verification_documents_url?: string | null
          verification_fee_paid?: boolean | null
          verification_notes?: string | null
          verification_rejected_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          website?: string | null
          year_reset_at?: string | null
        }
        Update: {
          annual_budget_usd?: number | null
          country_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          opportunities_posted_this_year?: number | null
          owner_user_id?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          verification_approved_at?: string | null
          verification_documents_url?: string | null
          verification_fee_paid?: boolean | null
          verification_notes?: string | null
          verification_rejected_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          website?: string | null
          year_reset_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_fees: {
        Row: {
          applies_to: string | null
          created_at: string | null
          fee_type: string
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          name: string
          value: number
        }
        Insert: {
          applies_to?: string | null
          created_at?: string | null
          fee_type: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          value: number
        }
        Update: {
          applies_to?: string | null
          created_at?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          value?: number
        }
        Relationships: []
      }
      political_digest: {
        Row: {
          author: string | null
          country_id: string
          created_at: string
          elections_upcoming: boolean | null
          id: string
          policy_changes: string | null
          reforms_highlight: string | null
          report_date: string
          risk_level: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          country_id: string
          created_at?: string
          elections_upcoming?: boolean | null
          id?: string
          policy_changes?: string | null
          reforms_highlight?: string | null
          report_date: string
          risk_level?: string | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          country_id?: string
          created_at?: string
          elections_upcoming?: boolean | null
          id?: string
          policy_changes?: string | null
          reforms_highlight?: string | null
          report_date?: string
          risk_level?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "political_digest_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          count: number
          created_at: string
          engaged: boolean | null
          engagement_type: string | null
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          post_id: string | null
          user_id: string | null
          view_duration: number | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          count?: number
          created_at?: string
          engaged?: boolean | null
          engagement_type?: string | null
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          post_id?: string | null
          user_id?: string | null
          view_duration?: number | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          count?: number
          created_at?: string
          engaged?: boolean | null
          engagement_type?: string | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          post_id?: string | null
          user_id?: string | null
          view_duration?: number | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          folder: string | null
          id: string
          pinned_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder?: string | null
          id?: string
          pinned_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder?: string | null
          id?: string
          pinned_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          is_deleted: boolean
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_deleted?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_deleted?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          share_commentary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          share_commentary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          share_commentary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          post_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          post_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comments_disabled: boolean
          content: string
          created_at: string
          event_id: string | null
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          gallery_urls: string[] | null
          id: string
          image_url: string | null
          is_deleted: boolean
          is_featured: boolean | null
          link_description: string | null
          link_metadata: Json | null
          link_title: string | null
          link_url: string | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          metadata: Json | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          original_post_id: string | null
          pinned_at: string | null
          post_type: string
          privacy_level: string
          share_commentary: string | null
          shared_by: string | null
          slug: string | null
          space_id: string | null
          story_type: string | null
          subtitle: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          comments_disabled?: boolean
          content: string
          created_at?: string
          event_id?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_featured?: boolean | null
          link_description?: string | null
          link_metadata?: Json | null
          link_title?: string | null
          link_url?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          metadata?: Json | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          original_post_id?: string | null
          pinned_at?: string | null
          post_type?: string
          privacy_level?: string
          share_commentary?: string | null
          shared_by?: string | null
          slug?: string | null
          space_id?: string | null
          story_type?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          comments_disabled?: boolean
          content?: string
          created_at?: string
          event_id?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_featured?: boolean | null
          link_description?: string | null
          link_metadata?: Json | null
          link_title?: string | null
          link_url?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          metadata?: Json | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          original_post_id?: string | null
          pinned_at?: string | null
          post_type?: string
          privacy_level?: string
          share_commentary?: string | null
          shared_by?: string | null
          slug?: string | null
          space_id?: string | null
          story_type?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_causes: {
        Row: {
          cause_id: string
          created_at: string | null
          profile_id: string
        }
        Insert: {
          cause_id: string
          created_at?: string | null
          profile_id: string
        }
        Update: {
          cause_id?: string
          created_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_causes_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_causes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_causes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_completion: {
        Row: {
          completed_at: string | null
          guide_dismissed: boolean | null
          guide_minimized: boolean | null
          steps_completed: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          guide_dismissed?: boolean | null
          guide_minimized?: boolean | null
          steps_completed?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          guide_dismissed?: boolean | null
          guide_minimized?: boolean | null
          steps_completed?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_skills: {
        Row: {
          created_at: string | null
          profile_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string | null
          profile_id: string
          skill_id: string
        }
        Update: {
          created_at?: string | null
          profile_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          metadata: Json | null
          profile_id: string
          view_type: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          profile_id: string
          view_type?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          profile_id?: string
          view_type?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_visibility: string | null
          achievements: string | null
          adin_mode: string | null
          adin_prompt_status: string | null
          advocacy_interests: string[] | null
          africa_focus_areas: string[] | null
          africa_visit_frequency: string | null
          african_causes: string[] | null
          agrees_to_values: boolean | null
          allow_profile_sharing: boolean | null
          auto_connect_enabled: boolean | null
          availability_for_mentoring: boolean | null
          availability_hours_per_month: number | null
          availability_tags: Json | null
          availability_visible: boolean | null
          available_for: string[] | null
          available_hours_per_month: number | null
          avatar_position: Json | null
          avatar_url: string | null
          banner_gradient: string | null
          banner_overlay: boolean | null
          banner_type: string | null
          banner_url: string | null
          beta_expires_at: string | null
          beta_features_tested: string[] | null
          beta_feedback_count: number | null
          beta_phase: string | null
          beta_signup_data: Json | null
          beta_status: string | null
          bio: string | null
          certifications: string | null
          city: string | null
          collaboration_needs: string[] | null
          collaboration_tags: Json | null
          community_involvement: string | null
          company: string | null
          connection_count: number | null
          consent_event_invites: boolean | null
          consent_marketing_emails: boolean | null
          consent_partner_intros: boolean | null
          consent_public_search: boolean | null
          contact_number_visibility: string
          continent: string | null
          contribution_style: string | null
          contribution_tags: Json | null
          contribution_types: string[] | null
          country: string | null
          created_at: string
          current_city: string | null
          current_country: string | null
          current_country_code: string | null
          current_country_id: string | null
          current_country_name: string | null
          current_location: string | null
          current_region: string | null
          dashboard_version: string | null
          deleted_at: string | null
          dia_insight: string | null
          dia_insight_updated_at: string | null
          diaspora_networks: string[] | null
          display_name: string | null
          education: string | null
          email: string | null
          email_notifications: boolean | null
          email_visible: boolean | null
          engagement_intentions: string[] | null
          ethnic_heritage: string[] | null
          event_interest_tags: Json | null
          facebook_url: string | null
          first_action_completed: boolean | null
          first_action_type: string | null
          first_name: string | null
          focus_areas: string[] | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          fundraising_status: string | null
          github_url: string | null
          giving_back_initiatives: string | null
          headline: string | null
          hidden_activity_ids: Json | null
          home_country_projects: string | null
          id: string
          impact_areas: string[] | null
          impact_goals: string[] | null
          impact_regions: string[] | null
          impact_scores: Json | null
          impact_scores_updated_at: string | null
          industries: string[] | null
          industry: string | null
          industry_sectors: string[] | null
          innovation_pathways: string | null
          instagram_url: string | null
          intent_tags: Json | null
          intentions: string[] | null
          intents: string[] | null
          interest_tags: string[] | null
          interests: string[] | null
          intro_audio_url: string | null
          intro_text: string | null
          intro_video_url: string | null
          is_admin: boolean | null
          is_beta_tester: boolean | null
          is_public: boolean | null
          is_test_account: boolean | null
          language_tags: Json | null
          languages: string[] | null
          last_active: string | null
          last_active_at: string | null
          last_name: string | null
          last_seen_at: string | null
          linkedin_url: string | null
          location: string | null
          location_preference: string | null
          looking_for_opportunities: boolean | null
          mentorship_areas: string[] | null
          mentorship_interest: string[] | null
          mentorship_offering: boolean | null
          middle_initial: string | null
          my_dna_statement: string | null
          needs: string[] | null
          networking_goals: string[] | null
          newsletter_emails: boolean | null
          notification_preferences: Json | null
          notifications_enabled: boolean | null
          offers: string[] | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_progress: Json
          onboarding_recommendations_viewed: boolean | null
          onboarding_stage: string | null
          open_to_opportunities: boolean | null
          organization: string | null
          organization_category: string | null
          organization_name: string | null
          past_contributions: string | null
          phone: string | null
          phone_number: string | null
          pinned_activity_ids: Json | null
          place_declared_at: string | null
          preferred_contact: string | null
          preferred_contact_method: string | null
          profession: string | null
          professional_role: string | null
          professional_sectors: string[] | null
          professional_summary: string | null
          profile_completeness_score: number | null
          profile_completion_percentage: number | null
          profile_completion_score: number | null
          profile_picture_url: string | null
          profile_views_count: number | null
          profile_visibility_settings: Json | null
          pronouns: string | null
          recent_searches: string[] | null
          referral_code: string | null
          referrer_id: string | null
          region_tags: Json | null
          regional_expertise: string[] | null
          return_intentions: string | null
          role: Database["public"]["Enums"]["dna_identity_role"]
          role_declared_at: string | null
          sdg_focus: string[] | null
          sector_tags: Json | null
          sectors: string[] | null
          seeking_mentorship: boolean | null
          selected_pillars: string[] | null
          show_presence: boolean
          show_read_receipts: boolean
          skill_tags: Json | null
          skills: string[] | null
          skills_needed: string[] | null
          skills_offered: string[] | null
          support_areas: string[] | null
          timezone: string | null
          tour_completed_at: string | null
          tour_current_step: number | null
          tour_last_shown_at: string | null
          tour_skipped_at: string | null
          twitter_handle: string | null
          twitter_url: string | null
          updated_at: string
          username: string
          username_change_count: number | null
          username_changes: number | null
          username_changes_count: number | null
          username_changes_left: number | null
          username_history: Json | null
          venture_name: string | null
          venture_stage: string | null
          verification_method: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          visibility: Json | null
          volunteer_experience: string | null
          website_url: string | null
          what_to_give: string[] | null
          what_to_receive: string[] | null
          whatsapp_number: string | null
          why_contribute: string | null
          years_experience: number | null
          years_of_experience: number | null
        }
        Insert: {
          account_visibility?: string | null
          achievements?: string | null
          adin_mode?: string | null
          adin_prompt_status?: string | null
          advocacy_interests?: string[] | null
          africa_focus_areas?: string[] | null
          africa_visit_frequency?: string | null
          african_causes?: string[] | null
          agrees_to_values?: boolean | null
          allow_profile_sharing?: boolean | null
          auto_connect_enabled?: boolean | null
          availability_for_mentoring?: boolean | null
          availability_hours_per_month?: number | null
          availability_tags?: Json | null
          availability_visible?: boolean | null
          available_for?: string[] | null
          available_hours_per_month?: number | null
          avatar_position?: Json | null
          avatar_url?: string | null
          banner_gradient?: string | null
          banner_overlay?: boolean | null
          banner_type?: string | null
          banner_url?: string | null
          beta_expires_at?: string | null
          beta_features_tested?: string[] | null
          beta_feedback_count?: number | null
          beta_phase?: string | null
          beta_signup_data?: Json | null
          beta_status?: string | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          collaboration_needs?: string[] | null
          collaboration_tags?: Json | null
          community_involvement?: string | null
          company?: string | null
          connection_count?: number | null
          consent_event_invites?: boolean | null
          consent_marketing_emails?: boolean | null
          consent_partner_intros?: boolean | null
          consent_public_search?: boolean | null
          contact_number_visibility?: string
          continent?: string | null
          contribution_style?: string | null
          contribution_tags?: Json | null
          contribution_types?: string[] | null
          country?: string | null
          created_at?: string
          current_city?: string | null
          current_country?: string | null
          current_country_code?: string | null
          current_country_id?: string | null
          current_country_name?: string | null
          current_location?: string | null
          current_region?: string | null
          dashboard_version?: string | null
          deleted_at?: string | null
          dia_insight?: string | null
          dia_insight_updated_at?: string | null
          diaspora_networks?: string[] | null
          display_name?: string | null
          education?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_visible?: boolean | null
          engagement_intentions?: string[] | null
          ethnic_heritage?: string[] | null
          event_interest_tags?: Json | null
          facebook_url?: string | null
          first_action_completed?: boolean | null
          first_action_type?: string | null
          first_name?: string | null
          focus_areas?: string[] | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          fundraising_status?: string | null
          github_url?: string | null
          giving_back_initiatives?: string | null
          headline?: string | null
          hidden_activity_ids?: Json | null
          home_country_projects?: string | null
          id: string
          impact_areas?: string[] | null
          impact_goals?: string[] | null
          impact_regions?: string[] | null
          impact_scores?: Json | null
          impact_scores_updated_at?: string | null
          industries?: string[] | null
          industry?: string | null
          industry_sectors?: string[] | null
          innovation_pathways?: string | null
          instagram_url?: string | null
          intent_tags?: Json | null
          intentions?: string[] | null
          intents?: string[] | null
          interest_tags?: string[] | null
          interests?: string[] | null
          intro_audio_url?: string | null
          intro_text?: string | null
          intro_video_url?: string | null
          is_admin?: boolean | null
          is_beta_tester?: boolean | null
          is_public?: boolean | null
          is_test_account?: boolean | null
          language_tags?: Json | null
          languages?: string[] | null
          last_active?: string | null
          last_active_at?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          location_preference?: string | null
          looking_for_opportunities?: boolean | null
          mentorship_areas?: string[] | null
          mentorship_interest?: string[] | null
          mentorship_offering?: boolean | null
          middle_initial?: string | null
          my_dna_statement?: string | null
          needs?: string[] | null
          networking_goals?: string[] | null
          newsletter_emails?: boolean | null
          notification_preferences?: Json | null
          notifications_enabled?: boolean | null
          offers?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_progress?: Json
          onboarding_recommendations_viewed?: boolean | null
          onboarding_stage?: string | null
          open_to_opportunities?: boolean | null
          organization?: string | null
          organization_category?: string | null
          organization_name?: string | null
          past_contributions?: string | null
          phone?: string | null
          phone_number?: string | null
          pinned_activity_ids?: Json | null
          place_declared_at?: string | null
          preferred_contact?: string | null
          preferred_contact_method?: string | null
          profession?: string | null
          professional_role?: string | null
          professional_sectors?: string[] | null
          professional_summary?: string | null
          profile_completeness_score?: number | null
          profile_completion_percentage?: number | null
          profile_completion_score?: number | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          profile_visibility_settings?: Json | null
          pronouns?: string | null
          recent_searches?: string[] | null
          referral_code?: string | null
          referrer_id?: string | null
          region_tags?: Json | null
          regional_expertise?: string[] | null
          return_intentions?: string | null
          role?: Database["public"]["Enums"]["dna_identity_role"]
          role_declared_at?: string | null
          sdg_focus?: string[] | null
          sector_tags?: Json | null
          sectors?: string[] | null
          seeking_mentorship?: boolean | null
          selected_pillars?: string[] | null
          show_presence?: boolean
          show_read_receipts?: boolean
          skill_tags?: Json | null
          skills?: string[] | null
          skills_needed?: string[] | null
          skills_offered?: string[] | null
          support_areas?: string[] | null
          timezone?: string | null
          tour_completed_at?: string | null
          tour_current_step?: number | null
          tour_last_shown_at?: string | null
          tour_skipped_at?: string | null
          twitter_handle?: string | null
          twitter_url?: string | null
          updated_at?: string
          username: string
          username_change_count?: number | null
          username_changes?: number | null
          username_changes_count?: number | null
          username_changes_left?: number | null
          username_history?: Json | null
          venture_name?: string | null
          venture_stage?: string | null
          verification_method?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          visibility?: Json | null
          volunteer_experience?: string | null
          website_url?: string | null
          what_to_give?: string[] | null
          what_to_receive?: string[] | null
          whatsapp_number?: string | null
          why_contribute?: string | null
          years_experience?: number | null
          years_of_experience?: number | null
        }
        Update: {
          account_visibility?: string | null
          achievements?: string | null
          adin_mode?: string | null
          adin_prompt_status?: string | null
          advocacy_interests?: string[] | null
          africa_focus_areas?: string[] | null
          africa_visit_frequency?: string | null
          african_causes?: string[] | null
          agrees_to_values?: boolean | null
          allow_profile_sharing?: boolean | null
          auto_connect_enabled?: boolean | null
          availability_for_mentoring?: boolean | null
          availability_hours_per_month?: number | null
          availability_tags?: Json | null
          availability_visible?: boolean | null
          available_for?: string[] | null
          available_hours_per_month?: number | null
          avatar_position?: Json | null
          avatar_url?: string | null
          banner_gradient?: string | null
          banner_overlay?: boolean | null
          banner_type?: string | null
          banner_url?: string | null
          beta_expires_at?: string | null
          beta_features_tested?: string[] | null
          beta_feedback_count?: number | null
          beta_phase?: string | null
          beta_signup_data?: Json | null
          beta_status?: string | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          collaboration_needs?: string[] | null
          collaboration_tags?: Json | null
          community_involvement?: string | null
          company?: string | null
          connection_count?: number | null
          consent_event_invites?: boolean | null
          consent_marketing_emails?: boolean | null
          consent_partner_intros?: boolean | null
          consent_public_search?: boolean | null
          contact_number_visibility?: string
          continent?: string | null
          contribution_style?: string | null
          contribution_tags?: Json | null
          contribution_types?: string[] | null
          country?: string | null
          created_at?: string
          current_city?: string | null
          current_country?: string | null
          current_country_code?: string | null
          current_country_id?: string | null
          current_country_name?: string | null
          current_location?: string | null
          current_region?: string | null
          dashboard_version?: string | null
          deleted_at?: string | null
          dia_insight?: string | null
          dia_insight_updated_at?: string | null
          diaspora_networks?: string[] | null
          display_name?: string | null
          education?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_visible?: boolean | null
          engagement_intentions?: string[] | null
          ethnic_heritage?: string[] | null
          event_interest_tags?: Json | null
          facebook_url?: string | null
          first_action_completed?: boolean | null
          first_action_type?: string | null
          first_name?: string | null
          focus_areas?: string[] | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          fundraising_status?: string | null
          github_url?: string | null
          giving_back_initiatives?: string | null
          headline?: string | null
          hidden_activity_ids?: Json | null
          home_country_projects?: string | null
          id?: string
          impact_areas?: string[] | null
          impact_goals?: string[] | null
          impact_regions?: string[] | null
          impact_scores?: Json | null
          impact_scores_updated_at?: string | null
          industries?: string[] | null
          industry?: string | null
          industry_sectors?: string[] | null
          innovation_pathways?: string | null
          instagram_url?: string | null
          intent_tags?: Json | null
          intentions?: string[] | null
          intents?: string[] | null
          interest_tags?: string[] | null
          interests?: string[] | null
          intro_audio_url?: string | null
          intro_text?: string | null
          intro_video_url?: string | null
          is_admin?: boolean | null
          is_beta_tester?: boolean | null
          is_public?: boolean | null
          is_test_account?: boolean | null
          language_tags?: Json | null
          languages?: string[] | null
          last_active?: string | null
          last_active_at?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          location_preference?: string | null
          looking_for_opportunities?: boolean | null
          mentorship_areas?: string[] | null
          mentorship_interest?: string[] | null
          mentorship_offering?: boolean | null
          middle_initial?: string | null
          my_dna_statement?: string | null
          needs?: string[] | null
          networking_goals?: string[] | null
          newsletter_emails?: boolean | null
          notification_preferences?: Json | null
          notifications_enabled?: boolean | null
          offers?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_progress?: Json
          onboarding_recommendations_viewed?: boolean | null
          onboarding_stage?: string | null
          open_to_opportunities?: boolean | null
          organization?: string | null
          organization_category?: string | null
          organization_name?: string | null
          past_contributions?: string | null
          phone?: string | null
          phone_number?: string | null
          pinned_activity_ids?: Json | null
          place_declared_at?: string | null
          preferred_contact?: string | null
          preferred_contact_method?: string | null
          profession?: string | null
          professional_role?: string | null
          professional_sectors?: string[] | null
          professional_summary?: string | null
          profile_completeness_score?: number | null
          profile_completion_percentage?: number | null
          profile_completion_score?: number | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          profile_visibility_settings?: Json | null
          pronouns?: string | null
          recent_searches?: string[] | null
          referral_code?: string | null
          referrer_id?: string | null
          region_tags?: Json | null
          regional_expertise?: string[] | null
          return_intentions?: string | null
          role?: Database["public"]["Enums"]["dna_identity_role"]
          role_declared_at?: string | null
          sdg_focus?: string[] | null
          sector_tags?: Json | null
          sectors?: string[] | null
          seeking_mentorship?: boolean | null
          selected_pillars?: string[] | null
          show_presence?: boolean
          show_read_receipts?: boolean
          skill_tags?: Json | null
          skills?: string[] | null
          skills_needed?: string[] | null
          skills_offered?: string[] | null
          support_areas?: string[] | null
          timezone?: string | null
          tour_completed_at?: string | null
          tour_current_step?: number | null
          tour_last_shown_at?: string | null
          tour_skipped_at?: string | null
          twitter_handle?: string | null
          twitter_url?: string | null
          updated_at?: string
          username?: string
          username_change_count?: number | null
          username_changes?: number | null
          username_changes_count?: number | null
          username_changes_left?: number | null
          username_history?: Json | null
          venture_name?: string | null
          venture_stage?: string | null
          verification_method?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          visibility?: Json | null
          volunteer_experience?: string | null
          website_url?: string | null
          what_to_give?: string[] | null
          what_to_receive?: string[] | null
          whatsapp_number?: string | null
          why_contribute?: string | null
          years_experience?: number | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_country_id_fkey"
            columns: ["current_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contributions: {
        Row: {
          contribution_type: string
          contributor_id: string
          created_at: string | null
          funding_interest: number | null
          id: string
          message: string | null
          project_id: string
          skills_offered: string[] | null
          status: string | null
          time_commitment: string | null
        }
        Insert: {
          contribution_type: string
          contributor_id: string
          created_at?: string | null
          funding_interest?: number | null
          id?: string
          message?: string | null
          project_id: string
          skills_offered?: string[] | null
          status?: string | null
          time_commitment?: string | null
        }
        Update: {
          contribution_type?: string
          contributor_id?: string
          created_at?: string | null
          funding_interest?: number | null
          id?: string
          message?: string | null
          project_id?: string
          skills_offered?: string[] | null
          status?: string | null
          time_commitment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          creator_id: string | null
          description: string | null
          id: string
          impact_area: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          impact_area?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          impact_area?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provinces: {
        Row: {
          country_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          population: number | null
          province_type: string | null
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          population?: number | null
          province_type?: string | null
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          population?: number | null
          province_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provinces_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          subscription_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          subscription_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          subscription_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_checks: {
        Row: {
          action_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          continent_id: string | null
          created_at: string
          description: string | null
          description_full: string | null
          description_short: string | null
          diaspora_population_estimate: number | null
          hero_image_url: string | null
          id: string
          interest_tags: string[] | null
          key_sectors: string[] | null
          languages_primary: string[] | null
          map_coordinates: Json | null
          name: string
          region_code: string | null
          region_slug: string | null
          skill_relevance: string[] | null
          status: string | null
          tagline: string | null
          timezone_primary: string | null
          updated_at: string
        }
        Insert: {
          continent_id?: string | null
          created_at?: string
          description?: string | null
          description_full?: string | null
          description_short?: string | null
          diaspora_population_estimate?: number | null
          hero_image_url?: string | null
          id?: string
          interest_tags?: string[] | null
          key_sectors?: string[] | null
          languages_primary?: string[] | null
          map_coordinates?: Json | null
          name: string
          region_code?: string | null
          region_slug?: string | null
          skill_relevance?: string[] | null
          status?: string | null
          tagline?: string | null
          timezone_primary?: string | null
          updated_at?: string
        }
        Update: {
          continent_id?: string | null
          created_at?: string
          description?: string | null
          description_full?: string | null
          description_short?: string | null
          diaspora_population_estimate?: number | null
          hero_image_url?: string | null
          id?: string
          interest_tags?: string[] | null
          key_sectors?: string[] | null
          languages_primary?: string[] | null
          map_coordinates?: Json | null
          name?: string
          region_code?: string | null
          region_slug?: string | null
          skill_relevance?: string[] | null
          status?: string | null
          tagline?: string | null
          timezone_primary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "continents"
            referencedColumns: ["id"]
          },
        ]
      }
      release_features: {
        Row: {
          created_at: string | null
          feature_text: string
          id: string
          release_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          feature_text: string
          id?: string
          release_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          feature_text?: string
          id?: string
          release_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "release_features_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          archived_at: string | null
          category: string
          created_at: string | null
          created_by: string | null
          cta_link: string | null
          cta_text: string | null
          description: string
          hero_image_url: string | null
          hero_type: string | null
          hero_video_url: string | null
          id: string
          is_pinned: boolean | null
          meta_description: string | null
          meta_title: string | null
          release_date: string
          slug: string
          status: string | null
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          archived_at?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description: string
          hero_image_url?: string | null
          hero_type?: string | null
          hero_video_url?: string | null
          id?: string
          is_pinned?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          release_date: string
          slug: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          archived_at?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string
          hero_image_url?: string | null
          hero_type?: string | null
          hero_video_url?: string | null
          id?: string
          is_pinned?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          release_date?: string
          slug?: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      remittance_caveats: {
        Row: {
          body: string
          id: string
          sort_order: number
        }
        Insert: {
          body: string
          id?: string
          sort_order?: number
        }
        Update: {
          body?: string
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      remittance_channel_players: {
        Row: {
          channel_id: string
          detail: string | null
          id: string
          name: string
          sort_order: number
          stat: string | null
        }
        Insert: {
          channel_id: string
          detail?: string | null
          id?: string
          name: string
          sort_order?: number
          stat?: string | null
        }
        Update: {
          channel_id?: string
          detail?: string | null
          id?: string
          name?: string
          sort_order?: number
          stat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remittance_channel_players_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "remittance_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      remittance_channels: {
        Row: {
          callout: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          tagline: string | null
        }
        Insert: {
          callout?: string | null
          icon?: string | null
          id: string
          name: string
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          callout?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      remittance_citations: {
        Row: {
          citation_type: string
          detail: string | null
          id: string
          sort_order: number
          title: string
          url: string | null
          viz_key: string
        }
        Insert: {
          citation_type: string
          detail?: string | null
          id?: string
          sort_order?: number
          title: string
          url?: string | null
          viz_key: string
        }
        Update: {
          citation_type?: string
          detail?: string | null
          id?: string
          sort_order?: number
          title?: string
          url?: string | null
          viz_key?: string
        }
        Relationships: []
      }
      remittance_compare_corridors: {
        Row: {
          channel: string
          fee_pct: number | null
          from_country: string
          id: string
          to_country: string
        }
        Insert: {
          channel: string
          fee_pct?: number | null
          from_country: string
          id?: string
          to_country: string
        }
        Update: {
          channel?: string
          fee_pct?: number | null
          from_country?: string
          id?: string
          to_country?: string
        }
        Relationships: []
      }
      remittance_corridor_comparisons: {
        Row: {
          created_at: string
          estimates: Json
          from_country: string
          id: string
          session_id: string | null
          to_country: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estimates: Json
          from_country: string
          id?: string
          session_id?: string | null
          to_country: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estimates?: Json
          from_country?: string
          id?: string
          session_id?: string | null
          to_country?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      remittance_cost_data: {
        Row: {
          color: string | null
          id: string
          label: string
          note: string | null
          pct: number
          sort_order: number
        }
        Insert: {
          color?: string | null
          id?: string
          label: string
          note?: string | null
          pct: number
          sort_order?: number
        }
        Update: {
          color?: string | null
          id?: string
          label?: string
          note?: string | null
          pct?: number
          sort_order?: number
        }
        Relationships: []
      }
      remittance_diaspora_bonds: {
        Row: {
          country: string
          detail: string | null
          flag: string | null
          headline: string | null
          id: string
          label: string | null
          sort_order: number
          status: string | null
        }
        Insert: {
          country: string
          detail?: string | null
          flag?: string | null
          headline?: string | null
          id?: string
          label?: string | null
          sort_order?: number
          status?: string | null
        }
        Update: {
          country?: string
          detail?: string | null
          flag?: string | null
          headline?: string | null
          id?: string
          label?: string | null
          sort_order?: number
          status?: string | null
        }
        Relationships: []
      }
      remittance_diaspora_regions: {
        Row: {
          created_at: string
          id: string
          note: string | null
          population_millions: number
          region: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          population_millions: number
          region: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          population_millions?: number
          region?: string
          sort_order?: number
        }
        Relationships: []
      }
      remittance_fatf_status: {
        Row: {
          country: string
          id: string
          sort_order: number
          status: string
          status_date: string | null
        }
        Insert: {
          country: string
          id?: string
          sort_order?: number
          status: string
          status_date?: string | null
        }
        Update: {
          country?: string
          id?: string
          sort_order?: number
          status?: string
          status_date?: string | null
        }
        Relationships: []
      }
      remittance_forecast: {
        Row: {
          id: string
          sort_order: number
          value: number
          year_label: string
        }
        Insert: {
          id?: string
          sort_order?: number
          value: number
          year_label: string
        }
        Update: {
          id?: string
          sort_order?: number
          value?: number
          year_label?: string
        }
        Relationships: []
      }
      remittance_future_trends: {
        Row: {
          body: string | null
          icon: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          body?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          body?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      remittance_fx_cases: {
        Row: {
          after_label: string | null
          before_label: string | null
          body: string | null
          country: string
          delta: string | null
          event: string | null
          flag: string | null
          id: string
          sort_order: number
        }
        Insert: {
          after_label?: string | null
          before_label?: string | null
          body?: string | null
          country: string
          delta?: string | null
          event?: string | null
          flag?: string | null
          id?: string
          sort_order?: number
        }
        Update: {
          after_label?: string | null
          before_label?: string | null
          body?: string | null
          country?: string
          delta?: string | null
          event?: string | null
          flag?: string | null
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      remittance_gdp_leaders: {
        Row: {
          country: string
          id: string
          pct_gdp: number
          sort_order: number
        }
        Insert: {
          country: string
          id?: string
          pct_gdp: number
          sort_order?: number
        }
        Update: {
          country?: string
          id?: string
          pct_gdp?: number
          sort_order?: number
        }
        Relationships: []
      }
      remittance_macro_flows: {
        Row: {
          fill: string | null
          flow_type: string
          id: string
          sort_order: number
          value: number
        }
        Insert: {
          fill?: string | null
          flow_type: string
          id?: string
          sort_order?: number
          value: number
        }
        Update: {
          fill?: string | null
          flow_type?: string
          id?: string
          sort_order?: number
          value?: number
        }
        Relationships: []
      }
      remittance_newsletter_subscribers: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      remittance_sources: {
        Row: {
          id: string
          name: string
          role: string | null
          sort_order: number
          url: string | null
        }
        Insert: {
          id?: string
          name: string
          role?: string | null
          sort_order?: number
          url?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: string | null
          sort_order?: number
          url?: string | null
        }
        Relationships: []
      }
      remittance_top_corridors: {
        Row: {
          from_country: string
          id: string
          note: string | null
          sort_order: number
          to_country: string
          usd_billions: number
        }
        Insert: {
          from_country: string
          id?: string
          note?: string | null
          sort_order?: number
          to_country: string
          usd_billions: number
        }
        Update: {
          from_country?: string
          id?: string
          note?: string | null
          sort_order?: number
          to_country?: string
          usd_billions?: number
        }
        Relationships: []
      }
      remittance_top_recipients: {
        Row: {
          country: string
          flag: string | null
          id: string
          pct_gdp: number
          sort_order: number
          source: string | null
          usd_billions: number
        }
        Insert: {
          country: string
          flag?: string | null
          id?: string
          pct_gdp: number
          sort_order?: number
          source?: string | null
          usd_billions: number
        }
        Update: {
          country?: string
          flag?: string | null
          id?: string
          pct_gdp?: number
          sort_order?: number
          source?: string | null
          usd_billions?: number
        }
        Relationships: []
      }
      remittance_use_of_funds: {
        Row: {
          color: string | null
          id: string
          name: string
          sort_order: number
          value: number
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          sort_order?: number
          value: number
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          sort_order?: number
          value?: number
        }
        Relationships: []
      }
      reserved_hashtags: {
        Row: {
          can_be_used: boolean | null
          category: Database["public"]["Enums"]["reserved_category"]
          claimable_with_verification: boolean | null
          created_at: string | null
          name: string
          reason: string | null
          source: string | null
        }
        Insert: {
          can_be_used?: boolean | null
          category: Database["public"]["Enums"]["reserved_category"]
          claimable_with_verification?: boolean | null
          created_at?: string | null
          name: string
          reason?: string | null
          source?: string | null
        }
        Update: {
          can_be_used?: boolean | null
          category?: Database["public"]["Enums"]["reserved_category"]
          claimable_with_verification?: boolean | null
          created_at?: string | null
          name?: string
          reason?: string | null
          source?: string | null
        }
        Relationships: []
      }
      roadmap_attendees: {
        Row: {
          country_code: string | null
          edition_year: number
          email: string
          full_name: string | null
          goals: string | null
          id: string
          interests: Json
          networking_opt_in: boolean
          organization: string | null
          registered_at: string
          role_title: string | null
          source: string | null
          status: string
          ticket_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country_code?: string | null
          edition_year?: number
          email: string
          full_name?: string | null
          goals?: string | null
          id?: string
          interests?: Json
          networking_opt_in?: boolean
          organization?: string | null
          registered_at?: string
          role_title?: string | null
          source?: string | null
          status?: string
          ticket_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country_code?: string | null
          edition_year?: number
          email?: string
          full_name?: string | null
          goals?: string | null
          id?: string
          interests?: Json
          networking_opt_in?: boolean
          organization?: string | null
          registered_at?: string
          role_title?: string | null
          source?: string | null
          status?: string
          ticket_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      roadmap_event_photos: {
        Row: {
          caption: string | null
          created_at: string
          edition_year: number
          id: string
          image_url: string
          is_approved: boolean
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          edition_year: number
          id?: string
          image_url: string
          is_approved?: boolean
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          edition_year?: number
          id?: string
          image_url?: string
          is_approved?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      roadmap_impact_metrics: {
        Row: {
          created_at: string
          display_order: number
          edition_year: number
          id: string
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          edition_year?: number
          id?: string
          label: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          edition_year?: number
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      roadmap_reminder_prefs: {
        Row: {
          created_at: string
          email_enabled: boolean
          lead_minutes: number
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          lead_minutes?: number
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          lead_minutes?: number
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_saved_sessions: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_saved_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_session_reminder_sends: {
        Row: {
          id: string
          sent_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_session_reminder_sends_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_sessions: {
        Row: {
          created_at: string
          day_label: string
          description: string | null
          display_order: number
          edition_year: number
          end_time: string | null
          id: string
          is_published: boolean
          lead: string | null
          location: string | null
          recording_published_at: string | null
          recording_thumbnail_url: string | null
          recording_url: string | null
          start_time: string | null
          time_label: string | null
          title: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_label: string
          description?: string | null
          display_order?: number
          edition_year?: number
          end_time?: string | null
          id?: string
          is_published?: boolean
          lead?: string | null
          location?: string | null
          recording_published_at?: string | null
          recording_thumbnail_url?: string | null
          recording_url?: string | null
          start_time?: string | null
          time_label?: string | null
          title: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_label?: string
          description?: string | null
          display_order?: number
          edition_year?: number
          end_time?: string | null
          id?: string
          is_published?: boolean
          lead?: string | null
          location?: string | null
          recording_published_at?: string | null
          recording_thumbnail_url?: string | null
          recording_url?: string | null
          start_time?: string | null
          time_label?: string | null
          title?: string
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "roadmap_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_speaker_followers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          notify_email: boolean
          source: string
          speaker_id: string
          unsubscribe_token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          notify_email?: boolean
          source?: string
          speaker_id: string
          unsubscribe_token?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          notify_email?: boolean
          source?: string
          speaker_id?: string
          unsubscribe_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_speaker_followers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "roadmap_speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_speaker_update_sends: {
        Row: {
          email: string
          error: string | null
          id: string
          provider_message_id: string | null
          sent_at: string
          status: string
          update_id: string
        }
        Insert: {
          email: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string
          status: string
          update_id: string
        }
        Update: {
          email?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string
          status?: string
          update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_speaker_update_sends_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "roadmap_speaker_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_speaker_updates: {
        Row: {
          body_md: string
          created_at: string
          created_by: string
          cta_label: string | null
          cta_url: string | null
          dispatched_at: string | null
          edition_year: number
          id: string
          last_error: string | null
          published_at: string | null
          recipients_count: number | null
          speaker_id: string
          subject: string
        }
        Insert: {
          body_md: string
          created_at?: string
          created_by: string
          cta_label?: string | null
          cta_url?: string | null
          dispatched_at?: string | null
          edition_year?: number
          id?: string
          last_error?: string | null
          published_at?: string | null
          recipients_count?: number | null
          speaker_id: string
          subject: string
        }
        Update: {
          body_md?: string
          created_at?: string
          created_by?: string
          cta_label?: string | null
          cta_url?: string | null
          dispatched_at?: string | null
          edition_year?: number
          id?: string
          last_error?: string | null
          published_at?: string | null
          recipients_count?: number | null
          speaker_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_speaker_updates_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "roadmap_speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_speakers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          display_order: number
          edition_year: number
          full_name: string
          id: string
          is_announced: boolean
          linkedin_url: string | null
          organization: string | null
          role_title: string | null
          slug: string
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_order?: number
          edition_year?: number
          full_name: string
          id?: string
          is_announced?: boolean
          linkedin_url?: string | null
          organization?: string | null
          role_title?: string | null
          slug: string
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_order?: number
          edition_year?: number
          full_name?: string
          id?: string
          is_announced?: boolean
          linkedin_url?: string | null
          organization?: string | null
          role_title?: string | null
          slug?: string
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      roadmap_sponsor_digest_sends: {
        Row: {
          id: string
          manager_user_id: string
          sent_at: string
          sponsor_id: string
          week_start: string
        }
        Insert: {
          id?: string
          manager_user_id: string
          sent_at?: string
          sponsor_id: string
          week_start: string
        }
        Update: {
          id?: string
          manager_user_id?: string
          sent_at?: string
          sponsor_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_sponsor_digest_sends_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_sponsor_leads: {
        Row: {
          created_at: string
          email: string
          follow_up_at: string | null
          id: string
          last_contacted_at: string | null
          message: string | null
          name: string
          notes: string | null
          organization: string | null
          source: string
          sponsor_id: string
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          follow_up_at?: string | null
          id?: string
          last_contacted_at?: string | null
          message?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          source?: string
          sponsor_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          follow_up_at?: string | null
          id?: string
          last_contacted_at?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          source?: string
          sponsor_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_sponsor_leads_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_sponsor_managers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          sponsor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          sponsor_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          sponsor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_sponsor_managers_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_sponsors: {
        Row: {
          blurb: string | null
          contact_email: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          display_order: number
          edition_year: number
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          slug: string
          tier: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          blurb?: string | null
          contact_email?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          display_order?: number
          edition_year?: number
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          slug: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          blurb?: string | null
          contact_email?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          display_order?: number
          edition_year?: number
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      roadmap_subscribers: {
        Row: {
          edition_year: number
          email: string
          id: string
          source: string
          subscribed_at: string
        }
        Insert: {
          edition_year?: number
          email: string
          id?: string
          source?: string
          subscribed_at?: string
        }
        Update: {
          edition_year?: number
          email?: string
          id?: string
          source?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      roadmap_survey_responses: {
        Row: {
          created_at: string
          edition_year: number
          email: string | null
          highlight: string | null
          id: string
          improvement: string | null
          nps: number | null
          themes: string[] | null
          user_id: string | null
          would_attend_again: boolean | null
        }
        Insert: {
          created_at?: string
          edition_year: number
          email?: string | null
          highlight?: string | null
          id?: string
          improvement?: string | null
          nps?: number | null
          themes?: string[] | null
          user_id?: string | null
          would_attend_again?: boolean | null
        }
        Update: {
          created_at?: string
          edition_year?: number
          email?: string | null
          highlight?: string | null
          id?: string
          improvement?: string | null
          nps?: number | null
          themes?: string[] | null
          user_id?: string | null
          would_attend_again?: boolean | null
        }
        Relationships: []
      }
      roadmap_testimonials: {
        Row: {
          author_name: string
          author_org: string | null
          author_role: string | null
          avatar_url: string | null
          created_at: string
          display_order: number
          edition_year: number
          id: string
          is_featured: boolean
          quote: string
        }
        Insert: {
          author_name: string
          author_org?: string | null
          author_role?: string | null
          avatar_url?: string | null
          created_at?: string
          display_order?: number
          edition_year?: number
          id?: string
          is_featured?: boolean
          quote: string
        }
        Update: {
          author_name?: string
          author_org?: string | null
          author_role?: string | null
          avatar_url?: string | null
          created_at?: string
          display_order?: number
          edition_year?: number
          id?: string
          is_featured?: boolean
          quote?: string
        }
        Relationships: []
      }
      roadmap_tracks: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          edition_year: number
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          edition_year?: number
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          edition_year?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_curations: {
        Row: {
          created_at: string
          curation_date: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          dismissed_at: string | null
          engaged_at: string | null
          engaged_thread_id: string | null
          id: string
          kind: Database["public"]["Enums"]["match_kind"]
          reasoning: string
          reasoning_source: Database["public"]["Enums"]["reasoning_source"]
          score: number
          subject_need_id: string | null
          subject_stance_id: string | null
          subject_user_id: string
          viewer_need_id: string | null
          viewer_stance_id: string | null
          viewer_user_id: string
        }
        Insert: {
          created_at?: string
          curation_date?: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          dismissed_at?: string | null
          engaged_at?: string | null
          engaged_thread_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["match_kind"]
          reasoning: string
          reasoning_source?: Database["public"]["Enums"]["reasoning_source"]
          score?: number
          subject_need_id?: string | null
          subject_stance_id?: string | null
          subject_user_id: string
          viewer_need_id?: string | null
          viewer_stance_id?: string | null
          viewer_user_id: string
        }
        Update: {
          created_at?: string
          curation_date?: string
          currency?: Database["public"]["Enums"]["contribution_currency"]
          dismissed_at?: string | null
          engaged_at?: string | null
          engaged_thread_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["match_kind"]
          reasoning?: string
          reasoning_source?: Database["public"]["Enums"]["reasoning_source"]
          score?: number
          subject_need_id?: string | null
          subject_stance_id?: string | null
          subject_user_id?: string
          viewer_need_id?: string | null
          viewer_stance_id?: string | null
          viewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_curations_subject_need_id_fkey"
            columns: ["subject_need_id"]
            isOneToOne: false
            referencedRelation: "need_declarations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_curations_subject_stance_id_fkey"
            columns: ["subject_stance_id"]
            isOneToOne: false
            referencedRelation: "currency_stances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_curations_viewer_need_id_fkey"
            columns: ["viewer_need_id"]
            isOneToOne: false
            referencedRelation: "need_declarations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_curations_viewer_stance_id_fkey"
            columns: ["viewer_stance_id"]
            isOneToOne: false
            referencedRelation: "currency_stances"
            referencedColumns: ["id"]
          },
        ]
      }
      search_preferences: {
        Row: {
          created_at: string
          default_filters: Json | null
          id: string
          saved_searches: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_filters?: Json | null
          id?: string
          saved_searches?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_filters?: Json | null
          id?: string
          saved_searches?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_analytics: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          profile_updated_at: string | null
          skill_name: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          profile_updated_at?: string | null
          skill_name: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          profile_updated_at?: string | null
          skill_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      skill_connections: {
        Row: {
          connection_strength: number | null
          created_at: string | null
          id: string
          shared_skills: string[]
          user_a_id: string | null
          user_b_id: string | null
        }
        Insert: {
          connection_strength?: number | null
          created_at?: string | null
          id?: string
          shared_skills: string[]
          user_a_id?: string | null
          user_b_id?: string | null
        }
        Update: {
          connection_strength?: number | null
          created_at?: string | null
          id?: string
          shared_skills?: string[]
          user_a_id?: string | null
          user_b_id?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      space_activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          space_id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          space_id: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          space_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_activity_log_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_attachments: {
        Row: {
          attached_to_id: string
          attached_to_type: Database["public"]["Enums"]["attachment_type"]
          created_at: string
          file_name: string
          file_size: number
          file_type: string | null
          file_url: string
          id: string
          space_id: string
          uploaded_by: string
        }
        Insert: {
          attached_to_id: string
          attached_to_type: Database["public"]["Enums"]["attachment_type"]
          created_at?: string
          file_name: string
          file_size: number
          file_type?: string | null
          file_url: string
          id?: string
          space_id: string
          uploaded_by: string
        }
        Update: {
          attached_to_id?: string
          attached_to_type?: Database["public"]["Enums"]["attachment_type"]
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string | null
          file_url?: string
          id?: string
          space_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_attachments_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          id: string | null
          invited_by: string | null
          joined_at: string
          role: string
          role_id: string | null
          space_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string | null
          invited_by?: string | null
          joined_at?: string
          role?: string
          role_id?: string | null
          space_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string | null
          invited_by?: string | null
          joined_at?: string
          role?: string
          role_id?: string | null
          space_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "space_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_lead: boolean | null
          order_index: number | null
          permissions: Json | null
          required_skills: string[] | null
          space_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_lead?: boolean | null
          order_index?: number | null
          permissions?: Json | null
          required_skills?: string[] | null
          space_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_lead?: boolean | null
          order_index?: number | null
          permissions?: Json | null
          required_skills?: string[] | null
          space_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_roles_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "space_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "space_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      space_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          last_nudge_at: string | null
          nudge_count: number
          parent_task_id: string | null
          priority: string | null
          sort_order: number | null
          space_id: string
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          last_nudge_at?: string | null
          nudge_count?: number
          parent_task_id?: string | null
          priority?: string | null
          sort_order?: number | null
          space_id: string
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          last_nudge_at?: string | null
          nudge_count?: number
          parent_task_id?: string | null
          priority?: string | null
          sort_order?: number | null
          space_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "space_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_tasks_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_templates: {
        Row: {
          category: string
          created_at: string | null
          default_initiatives: Json | null
          default_roles: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          suggested_milestones: Json | null
          tier_availability: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_initiatives?: Json | null
          default_roles?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          suggested_milestones?: Json | null
          tier_availability?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_initiatives?: Json | null
          default_roles?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          suggested_milestones?: Json | null
          tier_availability?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      space_updates: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          space_id: string
          type: Database["public"]["Enums"]["space_update_type"]
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          space_id: string
          type?: Database["public"]["Enums"]["space_update_type"]
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          space_id?: string
          type?: Database["public"]["Enums"]["space_update_type"]
        }
        Relationships: [
          {
            foreignKeyName: "space_updates_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          completion_summary: Json | null
          contributor_stats: Json | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          focus_areas: string[] | null
          health_score: number | null
          health_updated_at: string | null
          id: string
          last_activity_at: string | null
          name: string
          origin_event_id: string | null
          origin_group_id: string | null
          region: string | null
          slug: string
          source_id: string | null
          source_type: string | null
          space_type: string
          stall_threshold_days: number | null
          status: string
          tagline: string | null
          template_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          completion_summary?: Json | null
          contributor_stats?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          focus_areas?: string[] | null
          health_score?: number | null
          health_updated_at?: string | null
          id?: string
          last_activity_at?: string | null
          name: string
          origin_event_id?: string | null
          origin_group_id?: string | null
          region?: string | null
          slug: string
          source_id?: string | null
          source_type?: string | null
          space_type: string
          stall_threshold_days?: number | null
          status?: string
          tagline?: string | null
          template_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          completion_summary?: Json | null
          contributor_stats?: Json | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          focus_areas?: string[] | null
          health_score?: number | null
          health_updated_at?: string | null
          id?: string
          last_activity_at?: string | null
          name?: string
          origin_event_id?: string | null
          origin_group_id?: string | null
          region?: string | null
          slug?: string
          source_id?: string | null
          source_type?: string | null
          space_type?: string
          stall_threshold_days?: number | null
          status?: string
          tagline?: string | null
          template_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_origin_event_id_fkey"
            columns: ["origin_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_origin_group_id_fkey"
            columns: ["origin_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "space_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_logo_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          logo_url: string | null
          metadata: Json
          sponsor_id: string | null
          storage_path: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          sponsor_id?: string | null
          storage_path?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          sponsor_id?: string | null
          storage_path?: string | null
        }
        Relationships: []
      }
      sponsor_placements: {
        Row: {
          click_count: number
          created_at: string
          cta_label: string | null
          cta_url: string | null
          ends_at: string | null
          headline: string | null
          id: string
          impression_count: number
          is_active: boolean
          placement: string
          priority: number
          sponsor_id: string
          starts_at: string | null
          status: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          headline?: string | null
          id?: string
          impression_count?: number
          is_active?: boolean
          placement: string
          priority?: number
          sponsor_id: string
          starts_at?: string | null
          status?: string
        }
        Update: {
          click_count?: number
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          headline?: string | null
          id?: string
          impression_count?: number
          is_active?: boolean
          placement?: string
          priority?: number
          sponsor_id?: string
          starts_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_placements_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          tier: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      starred_messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_citations: {
        Row: {
          created_at: string
          definition: string | null
          description: string
          display_value: string
          id: string
          is_active: boolean
          key: string
          label: string
          methodology: string | null
          sort_order: number
          source_name: string
          source_url: string | null
          updated_at: string
          updated_by: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          definition?: string | null
          description: string
          display_value: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          methodology?: string | null
          sort_order?: number
          source_name: string
          source_url?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          definition?: string | null
          description?: string
          display_value?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          methodology?: string | null
          sort_order?: number
          source_name?: string
          source_url?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number | null
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          space_id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          space_id: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          space_id?: string
          task_id?: string
        }
        Relationships: []
      }
      trend_follows: {
        Row: {
          followed_at: string
          hashtag: string
          id: string
          user_id: string
        }
        Insert: {
          followed_at?: string
          hashtag: string
          id?: string
          user_id: string
        }
        Update: {
          followed_at?: string
          hashtag?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trend_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_adin_profile: {
        Row: {
          contributor_impact_type: string | null
          contributor_score: number | null
          contributor_verified_at: string | null
          created_at: string
          engagement_pillars: string[] | null
          id: string
          industries: string[] | null
          interests: string[] | null
          is_verified_contributor: boolean | null
          last_active: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contributor_impact_type?: string | null
          contributor_score?: number | null
          contributor_verified_at?: string | null
          created_at?: string
          engagement_pillars?: string[] | null
          id?: string
          industries?: string[] | null
          interests?: string[] | null
          is_verified_contributor?: boolean | null
          last_active?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contributor_impact_type?: string | null
          contributor_score?: number | null
          contributor_verified_at?: string | null
          created_at?: string
          engagement_pillars?: string[] | null
          id?: string
          industries?: string[] | null
          interests?: string[] | null
          is_verified_contributor?: boolean | null
          last_active?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_communities: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          owner_id: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          owner_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_dashboard_preferences: {
        Row: {
          collapsed_modules: Json
          density: string
          updated_at: string
          user_id: string
          visible_modules: Json
        }
        Insert: {
          collapsed_modules?: Json
          density?: string
          updated_at?: string
          user_id: string
          visible_modules?: Json
        }
        Update: {
          collapsed_modules?: Json
          density?: string
          updated_at?: string
          user_id?: string
          visible_modules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_engagement_tracking: {
        Row: {
          cohort: string | null
          created_at: string
          engagement_score: number | null
          event_context: Json | null
          event_type: string
          id: string
          last_active: string | null
          last_connection_made: string | null
          last_post_created: string | null
          last_profile_update: string | null
          reminder_stage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          engagement_score?: number | null
          event_context?: Json | null
          event_type: string
          id?: string
          last_active?: string | null
          last_connection_made?: string | null
          last_post_created?: string | null
          last_profile_update?: string | null
          reminder_stage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cohort?: string | null
          created_at?: string
          engagement_score?: number | null
          event_context?: Json | null
          event_type?: string
          id?: string
          last_active?: string | null
          last_connection_made?: string | null
          last_post_created?: string | null
          last_profile_update?: string | null
          reminder_stage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          context_c: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string
          weight: number
        }
        Insert: {
          context_c?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id: string
          weight?: number
        }
        Update: {
          context_c?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      user_last_view_state: {
        Row: {
          context: Json | null
          last_view_state: string
          last_visited_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          last_view_state: string
          last_visited_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          last_view_state?: string
          last_visited_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_last_view_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_last_view_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_selections: {
        Row: {
          created_at: string | null
          id: string
          selected_at: string | null
          selection_type: string
          target_id: string
          target_title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          selected_at?: string | null
          selection_type: string
          target_id: string
          target_title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          selected_at?: string | null
          selection_type?: string
          target_id?: string
          target_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recommendations: {
        Row: {
          created_at: string | null
          id: string
          match_reasons: string[] | null
          match_score: number | null
          recommendation_type: string
          status: string | null
          target_description: string | null
          target_id: string
          target_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_reasons?: string[] | null
          match_score?: number | null
          recommendation_type: string
          status?: string | null
          target_description?: string | null
          target_id: string
          target_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_reasons?: string[] | null
          match_score?: number | null
          recommendation_type?: string
          status?: string | null
          target_description?: string | null
          target_id?: string
          target_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          conversation_id: string | null
          created_at: string
          details: string | null
          id: string
          message_id: string | null
          reason: Database["public"]["Enums"]["user_report_reason"]
          reporter_id: string
          status: Database["public"]["Enums"]["user_report_status"]
          target_user_id: string
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason: Database["public"]["Enums"]["user_report_reason"]
          reporter_id: string
          status?: Database["public"]["Enums"]["user_report_status"]
          target_user_id: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason?: Database["public"]["Enums"]["user_report_reason"]
          reporter_id?: string
          status?: Database["public"]["Enums"]["user_report_status"]
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vectors: {
        Row: {
          created_at: string
          dimension: number
          source: string
          updated_at: string
          user_id: string
          vector: Json
        }
        Insert: {
          created_at?: string
          dimension?: number
          source: string
          updated_at?: string
          user_id: string
          vector: Json
        }
        Update: {
          created_at?: string
          dimension?: number
          source?: string
          updated_at?: string
          user_id?: string
          vector?: Json
        }
        Relationships: []
      }
      username_history: {
        Row: {
          changed_at: string
          id: string
          new_username: string
          old_username: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_username: string
          old_username: string
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_username?: string
          old_username?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "username_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "username_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          causes: string[] | null
          created_at: string | null
          diaspora_tags: string[] | null
          email: string | null
          full_name: string | null
          id: string
          languages: string[] | null
          location: string | null
          origin_country: string | null
          role: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          causes?: string[] | null
          created_at?: string | null
          diaspora_tags?: string[] | null
          email?: string | null
          full_name?: string | null
          id: string
          languages?: string[] | null
          location?: string | null
          origin_country?: string | null
          role: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          causes?: string[] | null
          created_at?: string | null
          diaspora_tags?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          languages?: string[] | null
          location?: string | null
          origin_country?: string | null
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      verified_contributors: {
        Row: {
          expires_at: string | null
          id: string
          notes: string | null
          user_id: string | null
          verification_source: string
          verified_at: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
          verification_source: string
          verified_at?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
          verification_source?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verified_contributors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_contributors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          waitlist_entry_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          waitlist_entry_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          waitlist_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_notes_waitlist_entry_id_fkey"
            columns: ["waitlist_entry_id"]
            isOneToOne: false
            referencedRelation: "beta_waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          causes: string[] | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          location: string | null
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          causes?: string[] | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          location?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          causes?: string[] | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      adin_cost_tracking: {
        Row: {
          avg_cost_per_query: number | null
          date: string | null
          queries: number | null
          total_cost: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      adin_daily_stats: {
        Row: {
          avg_response_time_ms: number | null
          cache_hit_rate: number | null
          cache_hits: number | null
          cache_misses: number | null
          date: string | null
          total_queries: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      adin_popular_queries: {
        Row: {
          last_queried: string | null
          query_count: number | null
          query_text: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          available_for: string[] | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          company: string | null
          continent: string | null
          country: string | null
          created_at: string | null
          current_city: string | null
          current_country: string | null
          current_country_name: string | null
          current_region: string | null
          display_name: string | null
          first_name: string | null
          full_name: string | null
          headline: string | null
          id: string | null
          impact_areas: string[] | null
          impact_regions: string[] | null
          industry: string | null
          interest_tags: string[] | null
          interests: string[] | null
          is_public: boolean | null
          last_name: string | null
          needs: string[] | null
          networking_goals: string[] | null
          offers: string[] | null
          primary_origin_country: string | null
          profession: string | null
          professional_role: string | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["dna_identity_role"] | null
          sdg_focus: string[] | null
          sectors: string[] | null
          skills: string[] | null
          username: string | null
          venture_name: string | null
          venture_stage: string | null
          years_experience: number | null
        }
        Insert: {
          available_for?: string[] | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          company?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string | null
          current_city?: string | null
          current_country?: string | null
          current_country_name?: string | null
          current_region?: string | null
          display_name?: string | null
          first_name?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string | null
          impact_areas?: string[] | null
          impact_regions?: string[] | null
          industry?: string | null
          interest_tags?: string[] | null
          interests?: string[] | null
          is_public?: boolean | null
          last_name?: string | null
          needs?: string[] | null
          networking_goals?: string[] | null
          offers?: string[] | null
          primary_origin_country?: never
          profession?: string | null
          professional_role?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["dna_identity_role"] | null
          sdg_focus?: string[] | null
          sectors?: string[] | null
          skills?: string[] | null
          username?: string | null
          venture_name?: string | null
          venture_stage?: string | null
          years_experience?: number | null
        }
        Update: {
          available_for?: string[] | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          company?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string | null
          current_city?: string | null
          current_country?: string | null
          current_country_name?: string | null
          current_region?: string | null
          display_name?: string | null
          first_name?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string | null
          impact_areas?: string[] | null
          impact_regions?: string[] | null
          industry?: string | null
          interest_tags?: string[] | null
          interests?: string[] | null
          is_public?: boolean | null
          last_name?: string | null
          needs?: string[] | null
          networking_goals?: string[] | null
          offers?: string[] | null
          primary_origin_country?: never
          profession?: string | null
          professional_role?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["dna_identity_role"] | null
          sdg_focus?: string[] | null
          sectors?: string[] | null
          skills?: string[] | null
          username?: string | null
          venture_name?: string | null
          venture_stage?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      pulse_metrics_daily: {
        Row: {
          c_module: string | null
          event_count: number | null
          hour_bucket: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      user_impact_summary: {
        Row: {
          collaborate_actions: number | null
          comments_made: number | null
          connect_actions: number | null
          connections_made: number | null
          contribute_actions: number | null
          last_activity: string | null
          posts_created: number | null
          reactions_given: number | null
          total_actions: number | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _log_contrib_fixed: {
        Args: {
          _description: string
          _region: string
          _sector: string
          _target: string
          _type: string
          _user: string
        }
        Returns: undefined
      }
      accept_connection: { Args: { p_connection: string }; Returns: undefined }
      add_group_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      add_message_reaction: {
        Args: { p_message_id: string; p_reaction: string; p_user_id: string }
        Returns: undefined
      }
      add_notification: {
        Args: {
          p_link_url?: string
          p_message: string
          p_payload?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      admin_get_profile_contacts: {
        Args: { p_ids: string[] }
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      admin_get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      admin_lookup_user_id_by_email: {
        Args: { _email: string }
        Returns: string
      }
      admin_search_profiles: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          account_visibility: string | null
          achievements: string | null
          adin_mode: string | null
          adin_prompt_status: string | null
          advocacy_interests: string[] | null
          africa_focus_areas: string[] | null
          africa_visit_frequency: string | null
          african_causes: string[] | null
          agrees_to_values: boolean | null
          allow_profile_sharing: boolean | null
          auto_connect_enabled: boolean | null
          availability_for_mentoring: boolean | null
          availability_hours_per_month: number | null
          availability_tags: Json | null
          availability_visible: boolean | null
          available_for: string[] | null
          available_hours_per_month: number | null
          avatar_position: Json | null
          avatar_url: string | null
          banner_gradient: string | null
          banner_overlay: boolean | null
          banner_type: string | null
          banner_url: string | null
          beta_expires_at: string | null
          beta_features_tested: string[] | null
          beta_feedback_count: number | null
          beta_phase: string | null
          beta_signup_data: Json | null
          beta_status: string | null
          bio: string | null
          certifications: string | null
          city: string | null
          collaboration_needs: string[] | null
          collaboration_tags: Json | null
          community_involvement: string | null
          company: string | null
          connection_count: number | null
          consent_event_invites: boolean | null
          consent_marketing_emails: boolean | null
          consent_partner_intros: boolean | null
          consent_public_search: boolean | null
          contact_number_visibility: string
          continent: string | null
          contribution_style: string | null
          contribution_tags: Json | null
          contribution_types: string[] | null
          country: string | null
          created_at: string
          current_city: string | null
          current_country: string | null
          current_country_code: string | null
          current_country_id: string | null
          current_country_name: string | null
          current_location: string | null
          current_region: string | null
          dashboard_version: string | null
          deleted_at: string | null
          dia_insight: string | null
          dia_insight_updated_at: string | null
          diaspora_networks: string[] | null
          display_name: string | null
          education: string | null
          email: string | null
          email_notifications: boolean | null
          email_visible: boolean | null
          engagement_intentions: string[] | null
          ethnic_heritage: string[] | null
          event_interest_tags: Json | null
          facebook_url: string | null
          first_action_completed: boolean | null
          first_action_type: string | null
          first_name: string | null
          focus_areas: string[] | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          fundraising_status: string | null
          github_url: string | null
          giving_back_initiatives: string | null
          headline: string | null
          hidden_activity_ids: Json | null
          home_country_projects: string | null
          id: string
          impact_areas: string[] | null
          impact_goals: string[] | null
          impact_regions: string[] | null
          impact_scores: Json | null
          impact_scores_updated_at: string | null
          industries: string[] | null
          industry: string | null
          industry_sectors: string[] | null
          innovation_pathways: string | null
          instagram_url: string | null
          intent_tags: Json | null
          intentions: string[] | null
          intents: string[] | null
          interest_tags: string[] | null
          interests: string[] | null
          intro_audio_url: string | null
          intro_text: string | null
          intro_video_url: string | null
          is_admin: boolean | null
          is_beta_tester: boolean | null
          is_public: boolean | null
          is_test_account: boolean | null
          language_tags: Json | null
          languages: string[] | null
          last_active: string | null
          last_active_at: string | null
          last_name: string | null
          last_seen_at: string | null
          linkedin_url: string | null
          location: string | null
          location_preference: string | null
          looking_for_opportunities: boolean | null
          mentorship_areas: string[] | null
          mentorship_interest: string[] | null
          mentorship_offering: boolean | null
          middle_initial: string | null
          my_dna_statement: string | null
          needs: string[] | null
          networking_goals: string[] | null
          newsletter_emails: boolean | null
          notification_preferences: Json | null
          notifications_enabled: boolean | null
          offers: string[] | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_progress: Json
          onboarding_recommendations_viewed: boolean | null
          onboarding_stage: string | null
          open_to_opportunities: boolean | null
          organization: string | null
          organization_category: string | null
          organization_name: string | null
          past_contributions: string | null
          phone: string | null
          phone_number: string | null
          pinned_activity_ids: Json | null
          place_declared_at: string | null
          preferred_contact: string | null
          preferred_contact_method: string | null
          profession: string | null
          professional_role: string | null
          professional_sectors: string[] | null
          professional_summary: string | null
          profile_completeness_score: number | null
          profile_completion_percentage: number | null
          profile_completion_score: number | null
          profile_picture_url: string | null
          profile_views_count: number | null
          profile_visibility_settings: Json | null
          pronouns: string | null
          recent_searches: string[] | null
          referral_code: string | null
          referrer_id: string | null
          region_tags: Json | null
          regional_expertise: string[] | null
          return_intentions: string | null
          role: Database["public"]["Enums"]["dna_identity_role"]
          role_declared_at: string | null
          sdg_focus: string[] | null
          sector_tags: Json | null
          sectors: string[] | null
          seeking_mentorship: boolean | null
          selected_pillars: string[] | null
          show_presence: boolean
          show_read_receipts: boolean
          skill_tags: Json | null
          skills: string[] | null
          skills_needed: string[] | null
          skills_offered: string[] | null
          support_areas: string[] | null
          timezone: string | null
          tour_completed_at: string | null
          tour_current_step: number | null
          tour_last_shown_at: string | null
          tour_skipped_at: string | null
          twitter_handle: string | null
          twitter_url: string | null
          updated_at: string
          username: string
          username_change_count: number | null
          username_changes: number | null
          username_changes_count: number | null
          username_changes_left: number | null
          username_history: Json | null
          venture_name: string | null
          venture_stage: string | null
          verification_method: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          visibility: Json | null
          volunteer_experience: string | null
          website_url: string | null
          what_to_give: string[] | null
          what_to_receive: string[] | null
          whatsapp_number: string | null
          why_contribute: string | null
          years_experience: number | null
          years_of_experience: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_verify_user: {
        Args: { admin_user_id: string; target_user_id: string }
        Returns: boolean
      }
      approve_beta_application: {
        Args: { admin_id: string; application_id: string }
        Returns: {
          expires_at: string
          magic_link_token: string
        }[]
      }
      archive_personal_hashtag: {
        Args: { p_hashtag_id: string; p_user_id: string }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      are_users_connected: {
        Args: { _a: string; _b: string }
        Returns: boolean
      }
      block_user: {
        Args: { p_blocked_user_id: string; p_reason?: string }
        Returns: undefined
      }
      calculate_impact_score: {
        Args: { target_user_id: string }
        Returns: number
      }
      calculate_match_score:
        | { Args: { profile_id: string; signal_id: string }; Returns: number }
        | {
            Args: {
              user1_regions: string[]
              user1_sectors: string[]
              user2_regions: string[]
              user2_sectors: string[]
            }
            Returns: number
          }
      calculate_profile_completeness: {
        Args: { target_user_id: string }
        Returns: number
      }
      calculate_profile_completeness_score_new: {
        Args: { p_id: string }
        Returns: number
      }
      calculate_profile_completion_percentage: {
        Args: { profile_id: string }
        Returns: number
      }
      calculate_profile_completion_score: {
        Args: { profile_id: string }
        Returns: number
      }
      can_create_collaboration: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      can_message_user: {
        Args: { p_recipient_id: string; p_sender_id: string }
        Returns: boolean
      }
      can_post_opportunity: { Args: { _org_id: string }; Returns: boolean }
      can_send_messages: { Args: { user_id_param: string }; Returns: boolean }
      can_view_field: {
        Args: {
          p_field: string
          p_owner: string
          p_viewer: string
          p_visibility: Json
        }
        Returns: boolean
      }
      check_event_permission: {
        Args: { p_event_id: string; p_permission: string; p_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _ip_address: unknown
          _max_submissions?: number
          _submission_type: string
          _time_window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit_uid: {
        Args: {
          p_action: string
          p_limit: number
          p_user: string
          p_window_seconds: number
        }
        Returns: boolean
      }
      check_user_reshared: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: boolean
      }
      check_username_available: {
        Args: { p_user_id?: string; p_username: string }
        Returns: boolean
      }
      cleanup_expired_adin_cache: { Args: never; Returns: number }
      close_need_declaration: {
        Args: { declaration_id: string }
        Returns: {
          closed_at: string | null
          context: string | null
          created_at: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          ends_at: string | null
          expires_at: string | null
          id: string
          published_at: string | null
          related_stance_id: string | null
          scope: Database["public"]["Enums"]["need_scope"]
          starts_at: string | null
          status: Database["public"]["Enums"]["need_status"]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["stance_visibility"]
        }
        SetofOptions: {
          from: "*"
          to: "need_declarations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      compute_influence_score: {
        Args: { target_user_id: string }
        Returns: number
      }
      compute_profile_completion_score: {
        Args: {
          profile_record: Database["public"]["Tables"]["profiles"]["Row"]
        }
        Returns: number
      }
      compute_reasoning_string: {
        Args: {
          p_currency: Database["public"]["Enums"]["contribution_currency"]
          p_kind: Database["public"]["Enums"]["match_kind"]
          p_shared_tags: string[]
          p_subject_need_title: string
          p_subject_stance_title: string
          p_viewer_need_title: string
          p_viewer_stance_title: string
        }
        Returns: string
      }
      confirm_fulfillment: {
        Args: { p_fulfillment_id: string }
        Returns: undefined
      }
      cosine_similarity: { Args: { vec1: Json; vec2: Json }; Returns: number }
      create_acknowledgment: {
        Args: {
          p_fulfillment_id: string
          p_is_public?: boolean
          p_message: string
          p_rating?: number
          p_to_profile_id: string
        }
        Returns: string
      }
      create_admin_notification: {
        Args: {
          p_admin_id: string
          p_message: string
          p_related_resource_id?: string
          p_related_resource_type?: string
          p_severity?: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_admin_id: string
          p_details?: Json
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type: string
          p_status?: string
          p_user_agent?: string
        }
        Returns: string
      }
      create_conversation_with_participant: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      create_entity_feed_post:
        | {
            Args: {
              p_author_id: string
              p_content: string
              p_entity_id: string
              p_entity_type: string
              p_metadata?: Json
            }
            Returns: string
          }
        | {
            Args: {
              p_author_id: string
              p_content: string
              p_entity_id: string
              p_entity_type: string
              p_event_id: string
              p_space_id: string
            }
            Returns: string
          }
      create_event_messaging_thread: {
        Args: { p_event_id: string; p_title?: string }
        Returns: string
      }
      create_group_conversation: {
        Args: {
          p_created_by?: string
          p_participant_ids: string[]
          p_title: string
        }
        Returns: string
      }
      create_notification:
        | {
            Args: {
              p_action_url?: string
              p_actor_id: string
              p_entity_id?: string
              p_entity_type?: string
              p_message: string
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_actor_id?: string
              p_link?: string
              p_message: string
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
      create_opportunity_messaging_thread: {
        Args: { p_opportunity_id: string; p_title?: string }
        Returns: string
      }
      create_personal_hashtag: {
        Args: { p_description?: string; p_tag: string; p_user_id: string }
        Returns: {
          error_message: string
          hashtag_id: string
          success: boolean
        }[]
      }
      create_space_messaging_channel: {
        Args: { p_space_id: string; p_title?: string }
        Returns: string
      }
      cron_overdue_task_reminders: { Args: never; Returns: undefined }
      curate_room_for_user: {
        Args: { p_max_per_kind?: number }
        Returns: number
      }
      delete_reshare: {
        Args: { p_original_post_id: string; p_user_id: string }
        Returns: undefined
      }
      discover_members: {
        Args: {
          p_country_of_origin?: string
          p_current_user_id: string
          p_ethnic_heritage?: string[]
          p_focus_areas?: string[]
          p_industries?: string[]
          p_limit?: number
          p_location_country?: string
          p_offset?: number
          p_regional_expertise?: string[]
          p_search_query?: string
          p_skills?: string[]
          p_sort_by?: string
        }
        Returns: {
          available_for: string[]
          avatar_url: string
          banner_gradient: string
          banner_overlay: boolean
          banner_type: string
          banner_url: string
          calc_match_score: number
          created_at: string
          ethnic_heritage: string[]
          focus_areas: string[]
          full_name: string
          headline: string
          id: string
          industries: string[]
          last_seen_at: string
          location: string
          primary_origin_country: string
          profession: string
          profile_comp: number
          regional_expertise: string[]
          skills: string[]
          username: string
        }[]
      }
      dismiss_curation: { Args: { curation_id: string }; Returns: undefined }
      edit_group_message: {
        Args: { p_message_id: string; p_new_content: string }
        Returns: undefined
      }
      edit_message: {
        Args: { p_message_id: string; p_new_content: string }
        Returns: undefined
      }
      enqueue_reminders_for_all_users: { Args: never; Returns: number }
      ensure_connection: { Args: { u1: string; u2: string }; Returns: string }
      ensure_manifest: { Args: never; Returns: string }
      ensure_profile_for_user: {
        Args: { p_email?: string; p_user: string }
        Returns: undefined
      }
      evaluate_cohort_criteria: {
        Args: { p_criteria: Json; p_user_id: string }
        Returns: boolean
      }
      event_owner_id: { Args: { p_event: string }; Returns: string }
      expire_overdue_need_declarations: { Args: never; Returns: number }
      extract_and_create_hashtags: {
        Args: { p_content: string; p_post_id: string }
        Returns: undefined
      }
      extract_hashtags: { Args: { content: string }; Returns: string[] }
      find_adin_matches:
        | {
            Args: { target_user_id: string }
            Returns: {
              match_reason: string
              match_score: number
              matched_user_id: string
              shared_regions: string[]
              shared_sectors: string[]
            }[]
          }
        | {
            Args: { match_threshold?: number; user_id: string }
            Returns: {
              match_score: number
              signal_created_at: string
              signal_id: string
              signal_title: string
              signal_type: string
            }[]
          }
      find_orphaned_profiles: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          has_auth_user: boolean
          profile_id: string
          username: string
        }[]
      }
      flag_content: {
        Args: { content_id: string; content_type: string; reason: string }
        Returns: undefined
      }
      forward_group_message: {
        Args: {
          p_note?: string
          p_source_message_id: string
          p_target_conversation_id: string
        }
        Returns: string
      }
      generate_event_slug: {
        Args: { event_year?: number; title: string }
        Returns: string
      }
      generate_join_token: { Args: never; Returns: string }
      generate_magic_link_token: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      generate_username: { Args: { _full_name: string }; Returns: string }
      generate_username_from_name: {
        Args: { full_name: string }
        Returns: string
      }
      get_active_users_this_week: { Args: never; Returns: number }
      get_activity_feed: {
        Args: {
          p_activity_types?: string[]
          p_limit?: number
          p_offset?: number
          p_user_id: string
        }
        Returns: {
          action_text: string
          activity_id: string
          activity_type: string
          actor_avatar: string
          actor_id: string
          actor_name: string
          actor_username: string
          created_at: string
          metadata: Json
          target_id: string
          target_name: string
        }[]
      }
      get_adin_user_usage: {
        Args: { p_user_id: string }
        Returns: {
          period_start: string
          queries_remaining: number
          query_count: number
          query_limit: number
          resets_at: string
        }[]
      }
      get_applications_for_opportunity: {
        Args: {
          p_cursor?: string
          p_limit?: number
          p_opportunity_id: string
          p_status_filter?: string
        }
        Returns: {
          applicant_avatar: string
          applicant_headline: string
          applicant_id: string
          applicant_name: string
          applicant_username: string
          cover_letter: string
          created_at: string
          id: string
          opportunity_id: string
          poster_notes: string
          proposed_contribution_type: string
          proposed_hours_per_month: number
          review_notes: string
          status: string
          status_updated_at: string
          updated_at: string
          withdrawn_at: string
        }[]
      }
      get_blocked_users: {
        Args: { p_user_id: string }
        Returns: {
          block_id: string
          blocked_at: string
          blocked_avatar_url: string
          blocked_full_name: string
          blocked_user_id: string
          blocked_username: string
          reason: string
        }[]
      }
      get_chat_connection_context: {
        Args: { _other_user_id: string }
        Returns: Json
      }
      get_connection_requests: {
        Args: { user_id: string }
        Returns: {
          avatar_url: string
          connection_id: string
          created_at: string
          full_name: string
          headline: string
          location: string
          message: string
          professional_role: string
          requester_id: string
          username: string
        }[]
      }
      get_connection_status: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_conversation_details: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: {
          conversation_id: string
          last_message_at: string
          last_message_content: string
          other_user_avatar_url: string
          other_user_full_name: string
          other_user_headline: string
          other_user_id: string
          other_user_username: string
          participant_status: string
        }[]
      }
      get_conversation_messages: {
        Args: {
          p_before_timestamp?: string
          p_conversation_id: string
          p_limit?: number
          p_user_id: string
        }
        Returns: {
          content: string
          content_type: string
          created_at: string
          delivered_at: string
          is_deleted: boolean
          is_read: boolean
          message_id: string
          metadata: Json
          sender_avatar_url: string
          sender_full_name: string
          sender_id: string
          sender_username: string
        }[]
      }
      get_current_admin_status: {
        Args: never
        Returns: {
          email: string
          is_admin: boolean
          is_super_admin: boolean
          role_level: string
          user_id: string
        }[]
      }
      get_current_user_profile: {
        Args: never
        Returns: {
          is_public: boolean
          user_id: string
        }[]
      }
      get_dashboard_preferences: { Args: { p_user_id: string }; Returns: Json }
      get_dia_daily_brief: {
        Args: { p_user_id?: string }
        Returns: {
          body: string
          c_module: string
          cta_label: string
          cta_route: string
          id: string
          is_fallback: boolean
          position: number
          reasoning: string
          signal_type: string
          target_entity_id: string
          target_entity_type: string
          title: string
        }[]
      }
      get_email_digest_recipients: {
        Args: never
        Returns: {
          conversation_count: number
          email: string
          full_name: string
          unread_total: number
          user_id: string
        }[]
      }
      get_engagement_rate: { Args: never; Returns: number }
      get_engine_loop_metrics:
        | { Args: never; Returns: Json }
        | { Args: { p_end_date: string; p_start_date: string }; Returns: Json }
      get_event_analytics: { Args: { p_event_id: string }; Returns: Json }
      get_event_attendees: {
        Args: {
          p_event_id: string
          p_status?: Database["public"]["Enums"]["rsvp_status"]
        }
        Returns: {
          attendee_id: string
          avatar_url: string
          checked_in: boolean
          created_at: string
          full_name: string
          headline: string
          response_note: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
          username: string
        }[]
      }
      get_event_details: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: {
          allow_guests: boolean
          attendee_count: number
          can_edit: boolean
          cancellation_reason: string
          cover_image_url: string
          created_at: string
          description: string
          end_time: string
          event_id: string
          event_type: string
          format: string
          going_count: number
          is_cancelled: boolean
          is_organizer: boolean
          is_public: boolean
          location_address: string
          location_city: string
          location_country: string
          location_lat: number
          location_lng: number
          location_name: string
          max_attendees: number
          maybe_count: number
          meeting_platform: string
          meeting_url: string
          organizer_avatar_url: string
          organizer_full_name: string
          organizer_headline: string
          organizer_id: string
          organizer_username: string
          requires_approval: boolean
          start_time: string
          timezone: string
          title: string
          updated_at: string
          user_rsvp_status: string
        }[]
      }
      get_events: {
        Args: {
          p_city?: string
          p_country?: string
          p_event_type?: Database["public"]["Enums"]["event_type"]
          p_filter?: string
          p_format?: Database["public"]["Enums"]["event_format"]
          p_limit?: number
          p_offset?: number
          p_user_id: string
        }
        Returns: {
          attendee_count: number
          cover_image_url: string
          created_at: string
          description: string
          end_time: string
          event_id: string
          event_type: Database["public"]["Enums"]["event_type"]
          format: Database["public"]["Enums"]["event_format"]
          is_organizer: boolean
          is_public: boolean
          location_city: string
          location_country: string
          location_name: string
          max_attendees: number
          meeting_url: string
          organizer_avatar_url: string
          organizer_full_name: string
          organizer_id: string
          organizer_username: string
          requires_approval: boolean
          start_time: string
          timezone: string
          title: string
          user_rsvp_status: Database["public"]["Enums"]["rsvp_status"]
        }[]
      }
      get_five_cs_pulse: {
        Args: { p_scope?: string; p_time_range?: string; p_user_id?: string }
        Returns: {
          c_module: string
          delta_vs_prior_period: number
          event_count: number
          unique_users: number
        }[]
      }
      get_group_conversations_for_user:
        | {
            Args: never
            Returns: {
              avatar_url: string
              conversation_id: string
              conversation_type: string
              created_at: string
              created_by: string
              description: string
              last_message_at: string
              participant_count: number
              title: string
              unread_count: number
            }[]
          }
        | {
            Args: { p_include_archived?: boolean }
            Returns: {
              avatar_url: string
              conversation_id: string
              conversation_type: string
              created_at: string
              created_by: string
              description: string
              is_archived: boolean
              is_muted: boolean
              is_pinned: boolean
              last_message_at: string
              last_message_preview: string
              last_sender_name: string
              participant_count: number
              title: string
              unread_count: number
            }[]
          }
      get_group_details: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: {
          avatar_url: string
          can_post: boolean
          category: string
          cover_image_url: string
          created_at: string
          created_by: string
          description: string
          group_id: string
          is_member: boolean
          join_policy: Database["public"]["Enums"]["group_join_policy"]
          location: string
          member_count: number
          name: string
          post_count: number
          privacy: Database["public"]["Enums"]["group_privacy"]
          slug: string
          tags: string[]
          user_role: Database["public"]["Enums"]["group_member_role"]
        }[]
      }
      get_group_members: {
        Args: {
          p_group_id: string
          p_role?: Database["public"]["Enums"]["group_member_role"]
        }
        Returns: {
          avatar_url: string
          full_name: string
          headline: string
          joined_at: string
          member_id: string
          role: Database["public"]["Enums"]["group_member_role"]
          user_id: string
          username: string
        }[]
      }
      get_group_messages: {
        Args: {
          p_before_id?: string
          p_conversation_id: string
          p_limit?: number
        }
        Returns: {
          client_id: string
          content: string
          created_at: string
          edited_at: string
          is_deleted: boolean
          media_urls: Json
          message_id: string
          message_type: string
          payload: Json
          reply_to_id: string
          sender_avatar_url: string
          sender_full_name: string
          sender_id: string
          sender_username: string
        }[]
      }
      get_group_posts: {
        Args: {
          p_group_id: string
          p_limit?: number
          p_offset?: number
          p_user_id: string
        }
        Returns: {
          author_avatar_url: string
          author_full_name: string
          author_id: string
          author_username: string
          comment_count: number
          content: string
          created_at: string
          image_urls: string[]
          is_pinned: boolean
          like_count: number
          post_id: string
          user_has_liked: boolean
        }[]
      }
      get_group_unread_count: {
        Args: { p_conversation_id: string }
        Returns: number
      }
      get_groups: {
        Args: {
          p_category?: string
          p_filter?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_user_id: string
        }
        Returns: {
          avatar_url: string
          category: string
          cover_image_url: string
          created_at: string
          description: string
          group_id: string
          is_member: boolean
          join_policy: Database["public"]["Enums"]["group_join_policy"]
          location: string
          member_count: number
          name: string
          post_count: number
          privacy: Database["public"]["Enums"]["group_privacy"]
          slug: string
          user_role: Database["public"]["Enums"]["group_member_role"]
        }[]
      }
      get_hashtag_details: {
        Args: { p_hashtag_name: string; p_user_id?: string }
        Returns: {
          created_at: string
          description: string
          display_name: string
          follower_count: number
          id: string
          is_following: boolean
          is_verified: boolean
          name: string
          owner_avatar: string
          owner_id: string
          owner_name: string
          owner_username: string
          status: string
          tag: string
          type: string
          usage_count: number
        }[]
      }
      get_hashtag_posts: {
        Args: {
          p_hashtag_name: string
          p_limit?: number
          p_offset?: number
          p_sort?: string
        }
        Returns: {
          author_avatar: string
          author_headline: string
          author_id: string
          author_name: string
          author_username: string
          comment_count: number
          content: string
          created_at: string
          like_count: number
          media_urls: string[]
          post_id: string
          reshare_count: number
        }[]
      }
      get_inactive_users_for_reengagement: {
        Args: { p_days_inactive?: number }
        Returns: {
          days_inactive: number
          full_name: string
          last_seen_at: string
          user_id: string
          username: string
        }[]
      }
      get_inbox_for_user: {
        Args: {
          p_include_archived?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          bucket: string
          conversation_id: string
          group_avatar_url: string
          group_title: string
          is_archived: boolean
          is_group: boolean
          is_muted: boolean
          is_pinned: boolean
          last_message_at: string
          last_message_preview: string
          last_sender_name: string
          other_user_avatar_url: string
          other_user_full_name: string
          other_user_id: string
          other_user_username: string
          participant_count: number
          unread_count: number
        }[]
      }
      get_manifest_for_user: {
        Args: { target_user_id: string }
        Returns: {
          availability: Database["public"]["Enums"]["stance_availability"]
          currency: Database["public"]["Enums"]["contribution_currency"]
          description: string
          display_order: number
          headline: string
          is_published: boolean
          last_reviewed_at: string
          manifest_created_at: string
          manifest_id: string
          manifest_updated_at: string
          stance_created_at: string
          stance_id: string
          stance_updated_at: string
          tags: string[]
          title: string
          visibility: Database["public"]["Enums"]["stance_visibility"]
        }[]
      }
      get_message_reactions: {
        Args: { p_message_ids: string[] }
        Returns: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }[]
      }
      get_mutual_connection_count: {
        Args: { user_a: string; user_b: string }
        Returns: number
      }
      get_mutual_connections:
        | {
            Args: {
              p_limit?: number
              p_target_user_id: string
              p_viewer_id: string
            }
            Returns: {
              avatar_url: string
              full_name: string
              headline: string
              id: string
              username: string
            }[]
          }
        | {
            Args: { user1_id: string; user2_id: string }
            Returns: {
              avatar_url: string
              full_name: string
              headline: string
              id: string
              username: string
            }[]
          }
      get_my_contact_info: {
        Args: never
        Returns: {
          email: string
          phone: string
          phone_number: string
          whatsapp_number: string
        }[]
      }
      get_my_speaker_follows: {
        Args: never
        Returns: {
          created_at: string
          id: string
          notify_email: boolean
          speaker_avatar_url: string
          speaker_full_name: string
          speaker_id: string
          speaker_organization: string
          speaker_role_title: string
          speaker_slug: string
        }[]
      }
      get_need_declarations_for_user: {
        Args: { target_user_id: string }
        Returns: {
          closed_at: string
          context: string
          created_at: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          ends_at: string
          expires_at: string
          id: string
          published_at: string
          related_stance_id: string
          scope: Database["public"]["Enums"]["need_scope"]
          starts_at: string
          status: Database["public"]["Enums"]["need_status"]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["stance_visibility"]
        }[]
      }
      get_newsletter_followers: {
        Args: { newsletter_user_id: string }
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      get_or_create_adin_preferences: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string | null
          email_comments: boolean | null
          email_connections: boolean | null
          email_enabled: boolean | null
          email_events: boolean | null
          email_mentions: boolean | null
          email_messages: boolean | null
          email_reactions: boolean | null
          email_stories: boolean | null
          id: string
          in_app_enabled: boolean | null
          notification_frequency: string | null
          nudge_categories: Json | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string | null
          unsubscribe_token: string | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "adin_preferences"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_or_create_conversation: {
        Args: { p_other_user_id: string; p_user_id: string }
        Returns: string
      }
      get_or_create_hashtag: {
        Args: { p_display_name?: string; p_name: string }
        Returns: string
      }
      get_or_create_origin_conversation: {
        Args: {
          p_created_by: string
          p_origin_id: string
          p_origin_type: string
          p_title: string
        }
        Returns: string
      }
      get_organizer_analytics:
        | { Args: { p_organizer_id: string }; Returns: Json }
        | {
            Args: { p_days_back: number; p_organizer_id: string }
            Returns: Json
          }
      get_own_profile: {
        Args: never
        Returns: {
          account_visibility: string | null
          achievements: string | null
          adin_mode: string | null
          adin_prompt_status: string | null
          advocacy_interests: string[] | null
          africa_focus_areas: string[] | null
          africa_visit_frequency: string | null
          african_causes: string[] | null
          agrees_to_values: boolean | null
          allow_profile_sharing: boolean | null
          auto_connect_enabled: boolean | null
          availability_for_mentoring: boolean | null
          availability_hours_per_month: number | null
          availability_tags: Json | null
          availability_visible: boolean | null
          available_for: string[] | null
          available_hours_per_month: number | null
          avatar_position: Json | null
          avatar_url: string | null
          banner_gradient: string | null
          banner_overlay: boolean | null
          banner_type: string | null
          banner_url: string | null
          beta_expires_at: string | null
          beta_features_tested: string[] | null
          beta_feedback_count: number | null
          beta_phase: string | null
          beta_signup_data: Json | null
          beta_status: string | null
          bio: string | null
          certifications: string | null
          city: string | null
          collaboration_needs: string[] | null
          collaboration_tags: Json | null
          community_involvement: string | null
          company: string | null
          connection_count: number | null
          consent_event_invites: boolean | null
          consent_marketing_emails: boolean | null
          consent_partner_intros: boolean | null
          consent_public_search: boolean | null
          contact_number_visibility: string
          continent: string | null
          contribution_style: string | null
          contribution_tags: Json | null
          contribution_types: string[] | null
          country: string | null
          created_at: string
          current_city: string | null
          current_country: string | null
          current_country_code: string | null
          current_country_id: string | null
          current_country_name: string | null
          current_location: string | null
          current_region: string | null
          dashboard_version: string | null
          deleted_at: string | null
          dia_insight: string | null
          dia_insight_updated_at: string | null
          diaspora_networks: string[] | null
          display_name: string | null
          education: string | null
          email: string | null
          email_notifications: boolean | null
          email_visible: boolean | null
          engagement_intentions: string[] | null
          ethnic_heritage: string[] | null
          event_interest_tags: Json | null
          facebook_url: string | null
          first_action_completed: boolean | null
          first_action_type: string | null
          first_name: string | null
          focus_areas: string[] | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          fundraising_status: string | null
          github_url: string | null
          giving_back_initiatives: string | null
          headline: string | null
          hidden_activity_ids: Json | null
          home_country_projects: string | null
          id: string
          impact_areas: string[] | null
          impact_goals: string[] | null
          impact_regions: string[] | null
          impact_scores: Json | null
          impact_scores_updated_at: string | null
          industries: string[] | null
          industry: string | null
          industry_sectors: string[] | null
          innovation_pathways: string | null
          instagram_url: string | null
          intent_tags: Json | null
          intentions: string[] | null
          intents: string[] | null
          interest_tags: string[] | null
          interests: string[] | null
          intro_audio_url: string | null
          intro_text: string | null
          intro_video_url: string | null
          is_admin: boolean | null
          is_beta_tester: boolean | null
          is_public: boolean | null
          is_test_account: boolean | null
          language_tags: Json | null
          languages: string[] | null
          last_active: string | null
          last_active_at: string | null
          last_name: string | null
          last_seen_at: string | null
          linkedin_url: string | null
          location: string | null
          location_preference: string | null
          looking_for_opportunities: boolean | null
          mentorship_areas: string[] | null
          mentorship_interest: string[] | null
          mentorship_offering: boolean | null
          middle_initial: string | null
          my_dna_statement: string | null
          needs: string[] | null
          networking_goals: string[] | null
          newsletter_emails: boolean | null
          notification_preferences: Json | null
          notifications_enabled: boolean | null
          offers: string[] | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_progress: Json
          onboarding_recommendations_viewed: boolean | null
          onboarding_stage: string | null
          open_to_opportunities: boolean | null
          organization: string | null
          organization_category: string | null
          organization_name: string | null
          past_contributions: string | null
          phone: string | null
          phone_number: string | null
          pinned_activity_ids: Json | null
          place_declared_at: string | null
          preferred_contact: string | null
          preferred_contact_method: string | null
          profession: string | null
          professional_role: string | null
          professional_sectors: string[] | null
          professional_summary: string | null
          profile_completeness_score: number | null
          profile_completion_percentage: number | null
          profile_completion_score: number | null
          profile_picture_url: string | null
          profile_views_count: number | null
          profile_visibility_settings: Json | null
          pronouns: string | null
          recent_searches: string[] | null
          referral_code: string | null
          referrer_id: string | null
          region_tags: Json | null
          regional_expertise: string[] | null
          return_intentions: string | null
          role: Database["public"]["Enums"]["dna_identity_role"]
          role_declared_at: string | null
          sdg_focus: string[] | null
          sector_tags: Json | null
          sectors: string[] | null
          seeking_mentorship: boolean | null
          selected_pillars: string[] | null
          show_presence: boolean
          show_read_receipts: boolean
          skill_tags: Json | null
          skills: string[] | null
          skills_needed: string[] | null
          skills_offered: string[] | null
          support_areas: string[] | null
          timezone: string | null
          tour_completed_at: string | null
          tour_current_step: number | null
          tour_last_shown_at: string | null
          tour_skipped_at: string | null
          twitter_handle: string | null
          twitter_url: string | null
          updated_at: string
          username: string
          username_change_count: number | null
          username_changes: number | null
          username_changes_count: number | null
          username_changes_left: number | null
          username_history: Json | null
          venture_name: string | null
          venture_stage: string | null
          verification_method: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          visibility: Json | null
          volunteer_experience: string | null
          website_url: string | null
          what_to_give: string[] | null
          what_to_receive: string[] | null
          whatsapp_number: string | null
          why_contribute: string | null
          years_experience: number | null
          years_of_experience: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pending_hashtag_requests: {
        Args: { p_owner_id: string }
        Returns: {
          created_at: string
          hashtag_id: string
          hashtag_tag: string
          post_content: string
          post_id: string
          request_id: string
          requester_avatar: string
          requester_id: string
          requester_name: string
        }[]
      }
      get_pending_reminders: {
        Args: { batch_size?: number }
        Returns: {
          cohort: string
          metadata: Json
          reminder_id: string
          reminder_type: string
          user_email: string
          user_id: string
        }[]
      }
      get_post_analytics_summary: {
        Args: { p_post_id: string }
        Returns: {
          avg_view_duration: number
          engagement_breakdown: Json
          engagement_rate: number
          total_engagements: number
          total_views: number
          unique_viewers: number
        }[]
      }
      get_post_comments: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: {
          author_avatar_url: string
          author_full_name: string
          author_id: string
          author_username: string
          comment_id: string
          content: string
          created_at: string
          updated_at: string
        }[]
      }
      get_post_details: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: {
          author_avatar_url: string
          author_full_name: string
          author_headline: string
          author_id: string
          author_username: string
          comments_count: number
          content: string
          created_at: string
          image_url: string
          likes_count: number
          link_description: string
          link_title: string
          link_url: string
          post_id: string
          post_type: string
          privacy_level: string
          updated_at: string
          user_has_liked: boolean
        }[]
      }
      get_post_likers: {
        Args: { p_limit?: number; p_post_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          headline: string
          liked_at: string
          user_id: string
          username: string
        }[]
      }
      get_post_share_count: { Args: { p_post_id: string }; Returns: number }
      get_profile_acknowledgments: {
        Args: { p_cursor?: string; p_limit?: number; p_profile_id: string }
        Returns: {
          created_at: string
          from_avatar: string
          from_name: string
          from_profile_id: string
          from_username: string
          fulfillment_id: string
          id: string
          is_public: boolean
          message: string
          opportunity_title: string
          rating: number
          to_profile_id: string
        }[]
      }
      get_profile_contact: {
        Args: { target_id: string }
        Returns: {
          email: string
          id: string
          phone: string
          phone_number: string
          whatsapp_number: string
        }[]
      }
      get_profile_contribution_history: {
        Args: {
          p_cursor?: string
          p_limit?: number
          p_profile_id: string
          p_type?: string
        }
        Returns: {
          completed_at: string
          contributor_avatar: string
          contributor_id: string
          contributor_name: string
          created_at: string
          has_acknowledgment: boolean
          id: string
          opportunity_id: string
          opportunity_title: string
          poster_avatar: string
          poster_id: string
          poster_name: string
          status: string
        }[]
      }
      get_profile_viewers: {
        Args: { p_limit?: number; p_offset?: number; p_profile_id: string }
        Returns: {
          is_connected: boolean
          last_viewed_at: string
          view_count: number
          viewer_avatar_url: string
          viewer_full_name: string
          viewer_headline: string
          viewer_id: string
          viewer_username: string
        }[]
      }
      get_public_profiles: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          headline: string
          id: string
          links: Json
          location: string
          org: string
          skills: string[]
          username: string
        }[]
      }
      get_pulse_breakdown: {
        Args: {
          p_c_module: string
          p_scope?: string
          p_time_range?: string
          p_user_id?: string
        }
        Returns: {
          display_label: string
          event_count: number
          event_type: string
        }[]
      }
      get_random_featured_insight: {
        Args: never
        Returns: {
          category: string
          description: string
          id: string
          query_prompt: string
          region: string
          title: string
        }[]
      }
      get_reshare_count: { Args: { p_post_id: string }; Returns: number }
      get_roadmap_subscribers: {
        Args: { _edition_year?: number }
        Returns: {
          edition_year: number
          email: string
          id: string
          source: string
          subscribed_at: string
        }[]
      }
      get_room_for_viewer: {
        Args: never
        Returns: {
          curation_date: string
          curation_id: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          kind: Database["public"]["Enums"]["match_kind"]
          reasoning: string
          reasoning_source: Database["public"]["Enums"]["reasoning_source"]
          score: number
          subject_need_context: string
          subject_need_id: string
          subject_need_scope: Database["public"]["Enums"]["need_scope"]
          subject_need_title: string
          subject_stance_id: string
          subject_stance_title: string
          subject_user_id: string
          viewer_need_id: string
          viewer_need_title: string
          viewer_stance_id: string
          viewer_stance_title: string
        }[]
      }
      get_room_readiness: {
        Args: never
        Returns: {
          active_need_count: number
          active_stance_count: number
          curation_count_today: number
          has_manifest: boolean
          manifest_published: boolean
        }[]
      }
      get_safe_profile_fields: {
        Args: { profile_id: string; viewer_id: string }
        Returns: {
          available_for: string[]
          available_hours_per_month: number
          avatar_url: string
          banner_url: string
          bio: string
          company: string
          created_at: string
          current_city: string
          current_country: string
          current_country_name: string
          current_location: string
          current_region: string
          display_name: string
          email: string
          first_name: string
          full_name: string
          headline: string
          id: string
          impact_areas: string[]
          impact_regions: string[]
          industry: string
          interest_tags: string[]
          interests: string[]
          is_public: boolean
          last_name: string
          linkedin_url: string
          location: string
          needs: string[]
          networking_goals: string[]
          offers: string[]
          preferred_contact: string
          primary_origin_country: string
          profession: string
          professional_role: string
          profile_picture_url: string
          sdg_focus: string[]
          sectors: string[]
          skills: string[]
          twitter_url: string
          username: string
          venture_name: string
          venture_stage: string
          website_url: string
          years_experience: number
        }[]
      }
      get_similar_entities: {
        Args: {
          limit_count?: number
          target_entity_id: string
          target_entity_type: string
        }
        Returns: {
          entity_id: string
          entity_type: string
          similarity_score: number
        }[]
      }
      get_similar_users: {
        Args: { limit_count?: number; target_user_id: string }
        Returns: {
          similarity_score: number
          user_id: string
        }[]
      }
      get_speaker_follower_count: {
        Args: { _speaker_id: string }
        Returns: number
      }
      get_speaker_update_recipient_count: {
        Args: { _speaker_id: string }
        Returns: number
      }
      get_sponsor_contact: {
        Args: { _sponsor_id: string }
        Returns: {
          contact_email: string
          contact_name: string
          id: string
        }[]
      }
      get_suggested_connections: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          focus_areas: string[]
          full_name: string
          headline: string
          id: string
          industries: string[]
          location: string
          match_score: number
          primary_origin_country: string
          profession: string
          skills: string[]
          username: string
        }[]
      }
      get_thread_participant_count: {
        Args: { p_conversation_id: string }
        Returns: number
      }
      get_threaded_comments: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: {
          author_avatar_url: string
          author_full_name: string
          author_id: string
          author_username: string
          comment_id: string
          content: string
          created_at: string
          parent_comment_id: string
          reaction_counts: Json
          reply_count: number
          updated_at: string
          user_reaction: string
        }[]
      }
      get_top_cross_transitions:
        | {
            Args: { p_limit?: number }
            Returns: {
              from_state: string
              to_state: string
              transition_count: number
            }[]
          }
        | {
            Args: { p_end_date: string; p_limit: number; p_start_date: string }
            Returns: {
              from_state: string
              to_state: string
              transition_count: number
            }[]
          }
      get_top_transition_entities:
        | {
            Args: {
              p_end_date: string
              p_entity_type: string
              p_limit: number
              p_start_date: string
            }
            Returns: {
              entity_id: string
              entity_type: string
              transition_count: number
            }[]
          }
        | {
            Args: { p_from_state: string; p_limit?: number }
            Returns: {
              entity_id: string
              entity_type: string
              transition_count: number
            }[]
          }
      get_total_connections: { Args: never; Returns: number }
      get_total_events: { Args: never; Returns: number }
      get_total_posts: { Args: never; Returns: number }
      get_total_unread_count: { Args: { p_user_id: string }; Returns: number }
      get_total_users: { Args: never; Returns: number }
      get_trending_hashtags:
        | {
            Args: { p_days?: number; p_limit?: number }
            Returns: {
              display_name: string
              follower_count: number
              id: string
              name: string
              recent_uses: number
              tag: string
              trending_score: number
              type: string
              usage_count: number
            }[]
          }
        | {
            Args: { p_limit?: number; p_time_range?: string }
            Returns: {
              hashtag: string
              is_followed: boolean
              post_count: number
              unique_authors: number
            }[]
          }
      get_trending_stories: {
        Args: { p_limit?: number }
        Returns: {
          bookmark_count: number
          comment_count: number
          post_id: string
          reaction_count: number
          trending_score: number
          view_count: number
        }[]
      }
      get_universal_feed: {
        Args: {
          p_author_id?: string
          p_event_id?: string
          p_hashtag?: string
          p_limit?: number
          p_offset?: number
          p_ranking_mode?: string
          p_space_id?: string
          p_tab?: string
          p_viewer_id: string
        }
        Returns: {
          author_avatar_url: string
          author_full_name: string
          author_headline: string
          author_id: string
          author_username: string
          comments_count: number
          content: string
          created_at: string
          event_id: string
          gallery_urls: string[]
          id: string
          image_url: string
          likes_count: number
          link_description: string
          link_metadata: Json
          link_title: string
          link_url: string
          linked_entity_id: string
          linked_entity_type: string
          original_author_avatar_url: string
          original_author_full_name: string
          original_author_headline: string
          original_author_id: string
          original_author_username: string
          original_content: string
          original_created_at: string
          original_image_url: string
          original_post_id: string
          post_type: string
          privacy_level: string
          slug: string
          space_id: string
          subtitle: string
          title: string
          updated_at: string
          user_has_bookmarked: boolean
          user_has_liked: boolean
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_cohort: { Args: { target_user_id: string }; Returns: string }
      get_user_connections: {
        Args: {
          limit_count?: number
          offset_count?: number
          search_query?: string
          user_id: string
        }
        Returns: {
          avatar_url: string
          connected_at: string
          full_name: string
          headline: string
          id: string
          location: string
          professional_role: string
          username: string
        }[]
      }
      get_user_conversations: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          conversation_id: string
          is_archived: boolean
          is_muted: boolean
          is_pinned: boolean
          last_message_at: string
          last_message_content: string
          last_message_preview: string
          origin_id: string
          origin_metadata: Json
          origin_type: string
          other_user_avatar_url: string
          other_user_full_name: string
          other_user_headline: string
          other_user_id: string
          other_user_username: string
          participant_status: string
          unread_count: number
        }[]
      }
      get_user_conversations_with_preview: {
        Args: { p_user_id: string }
        Returns: {
          conversation_id: string
          created_at: string
          last_message_at: string
          last_message_content: string
          last_message_sender_id: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          other_user_username: string
          unread_count: number
        }[]
      }
      get_user_hashtag_limits: {
        Args: { p_user_id: string }
        Returns: {
          active_count: number
          archived_count: number
          available_slots: number
          max_hashtags: number
        }[]
      }
      get_user_notifications: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_unread_only?: boolean
          p_user_id: string
        }
        Returns: {
          action_url: string
          actor_avatar_url: string
          actor_full_name: string
          actor_id: string
          actor_username: string
          created_at: string
          entity_id: string
          entity_type: string
          is_read: boolean
          message: string
          notification_id: string
          read_at: string
          title: string
          type: string
        }[]
      }
      get_user_owned_hashtags: {
        Args: { p_user_id: string }
        Returns: {
          archived_at: string
          created_at: string
          description: string
          follower_count: number
          id: string
          pending_requests: number
          status: string
          tag: string
          usage_count: number
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_user_verification_status: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_users_needing_connection_nudges: {
        Args: never
        Returns: {
          account_age_days: number
          connections_count: number
          full_name: string
          user_id: string
          username: string
        }[]
      }
      get_view_state_distribution:
        | {
            Args: never
            Returns: {
              user_count: number
              view_state: string
            }[]
          }
        | {
            Args: { p_end_date: string; p_start_date: string }
            Returns: {
              user_count: number
              view_state: string
            }[]
          }
      handle_referral_signup: {
        Args: { new_user_id: string; referral_code_param: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_adin_usage: {
        Args: {
          p_estimated_cost?: number
          p_tokens_used?: number
          p_user_id: string
        }
        Returns: boolean
      }
      increment_insight_click: {
        Args: { insight_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_email: { Args: { email_address: string }; Returns: boolean }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_affirmed_member: { Args: { p_profile_id: string }; Returns: boolean }
      is_blocked_between: { Args: { _a: string; _b: string }; Returns: boolean }
      is_blocked_from_space: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      is_connection_participant: {
        Args: { p_connection: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      is_event_owner: {
        Args: { p_event: string; p_user: string }
        Returns: boolean
      }
      is_feedback_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      is_group_creator: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_hashtag_reserved: {
        Args: { p_name: string }
        Returns: {
          can_be_used: boolean
          category: Database["public"]["Enums"]["reserved_category"]
          is_reserved: boolean
          reason: string
        }[]
      }
      is_member_of_space: {
        Args: {
          _approved_only?: boolean
          _roles?: string[]
          _space: string
          _user: string
        }
        Returns: boolean
      }
      is_prelaunch_locked: { Args: never; Returns: boolean }
      is_space_lead: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      is_sponsor_manager: {
        Args: { _sponsor_id: string; _user_id: string }
        Returns: boolean
      }
      is_typing_topic_participant: {
        Args: { _topic: string }
        Returns: boolean
      }
      is_user_blocked: {
        Args: { p_other_user_id: string; p_user_id: string }
        Returns: boolean
      }
      is_valid_admin_email: {
        Args: { check_email: string }
        Returns: {
          is_super_admin: boolean
          is_valid: boolean
          role_level: string
        }[]
      }
      leave_group_conversation: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      list_sponsor_logo_audit_log: {
        Args: {
          _action?: string
          _admin_user_id?: string
          _from?: string
          _limit?: number
          _offset?: number
          _to?: string
        }
        Returns: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          logo_url: string
          metadata: Json
          sponsor_id: string
          storage_path: string
          total_count: number
        }[]
      }
      log_connection_event: {
        Args: { p_connection: string; p_event_type: string; p_payload?: Json }
        Returns: string
      }
      log_engagement_event: {
        Args: {
          cohort_param?: string
          event_context_param?: Json
          event_type_param: string
          target_user_id: string
        }
        Returns: string
      }
      log_post_event: {
        Args: { p_event_type: string; p_metadata?: Json; p_post_id: string }
        Returns: undefined
      }
      log_post_view: { Args: { p_post_id: string }; Returns: undefined }
      log_profile_view: {
        Args: { p_profile_id: string; p_view_type?: string }
        Returns: undefined
      }
      log_sponsor_logo_action: {
        Args: {
          _action: string
          _logo_url?: string
          _metadata?: Json
          _sponsor_id?: string
          _storage_path?: string
        }
        Returns: string
      }
      make_user_admin: { Args: { user_email: string }; Returns: string }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      mark_conversation_read:
        | { Args: { _conversation_id: string }; Returns: undefined }
        | {
            Args: { p_conversation_id: string; p_user_id: string }
            Returns: undefined
          }
      mark_notifications_read: {
        Args: { p_notification_ids: string[]; p_user_id: string }
        Returns: undefined
      }
      offer_fulfillment: {
        Args: {
          p_message?: string
          p_need_id: string
          p_room_curation_id?: string
        }
        Returns: string
      }
      owns_organization: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      process_post_hashtags: {
        Args: { p_content: string; p_post_id: string; p_user_id: string }
        Returns: undefined
      }
      profile_meets_visibility_requirement: {
        Args: { min_score?: number; user_id_param: string }
        Returns: boolean
      }
      promote_from_waitlist: { Args: { p_event: string }; Returns: string }
      publish_manifest: {
        Args: never
        Returns: {
          created_at: string
          headline: string | null
          id: string
          is_published: boolean
          last_reviewed_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "contribution_manifests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_need_declaration: {
        Args: { declaration_id: string }
        Returns: {
          closed_at: string | null
          context: string | null
          created_at: string
          currency: Database["public"]["Enums"]["contribution_currency"]
          ends_at: string | null
          expires_at: string | null
          id: string
          published_at: string | null
          related_stance_id: string | null
          scope: Database["public"]["Enums"]["need_scope"]
          starts_at: string | null
          status: Database["public"]["Enums"]["need_status"]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["stance_visibility"]
        }
        SetofOptions: {
          from: "*"
          to: "need_declarations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      purge_stale_curations: { Args: never; Returns: number }
      reactivate_personal_hashtag: {
        Args: { p_hashtag_id: string; p_user_id: string }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      recent_engagement_score_for_opportunity: {
        Args: { p_op: string }
        Returns: number
      }
      recent_engagement_score_for_space: {
        Args: { p_space: string }
        Returns: number
      }
      record_brief_interaction: {
        Args: {
          p_card_id: string
          p_interaction_type: Database["public"]["Enums"]["brief_interaction_type"]
        }
        Returns: string
      }
      record_group_mentions: {
        Args: { p_message_id: string; p_user_ids: string[] }
        Returns: undefined
      }
      reject_html: { Args: { _txt: string }; Returns: boolean }
      remove_connection: {
        Args: { p_connection_id: string }
        Returns: undefined
      }
      remove_group_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      remove_message_reaction: {
        Args: { p_message_id: string; p_reaction: string; p_user_id: string }
        Returns: undefined
      }
      request_hashtag_usage: {
        Args: {
          p_hashtag_id: string
          p_post_id: string
          p_requester_id: string
        }
        Returns: {
          error_message: string
          request_id: string
          success: boolean
        }[]
      }
      reset_seeded_data: { Args: never; Returns: undefined }
      resolve_nudge: {
        Args: { p_nudge: string; p_snooze_until?: string; p_status: string }
        Returns: undefined
      }
      respond_to_fulfillment: {
        Args: { p_action: string; p_fulfillment_id: string; p_notes?: string }
        Returns: undefined
      }
      review_hashtag_request: {
        Args: {
          p_approved: boolean
          p_note?: string
          p_owner_id: string
          p_request_id: string
        }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      roadmap_speakers_slugify: { Args: { input: string }; Returns: string }
      rpc_adin_recommend_opportunities:
        | {
            Args: never
            Returns: {
              match_score: number
              signal_created_at: string
              signal_id: string
              signal_title: string
              signal_type: string
            }[]
          }
        | {
            Args: { p_limit?: number }
            Returns: {
              description: string
              id: string
              link: string
              location: string
              score: number
              tags: string[]
              title: string
              type: string
            }[]
          }
      rpc_adin_recommend_people:
        | {
            Args: never
            Returns: {
              match_reason: string
              match_score: number
              matched_user_id: string
              shared_regions: string[]
              shared_sectors: string[]
            }[]
          }
        | {
            Args: { p_limit?: number }
            Returns: {
              full_name: string
              headline: string
              score: number
              user_id: string
              username: string
            }[]
          }
      rpc_adin_recommend_spaces:
        | {
            Args: never
            Returns: {
              match_score: number
              space_id: string
              space_name: string
            }[]
          }
        | {
            Args: { p_limit?: number }
            Returns: {
              description: string
              id: string
              score: number
              tags: string[]
              title: string
              visibility: string
            }[]
          }
      rpc_adin_recommendations_opportunities: {
        Args: { p_limit?: number; p_threshold?: number; p_user_id: string }
        Returns: {
          match_score: number
          signal_created_at: string
          signal_id: string
          signal_title: string
          signal_type: string
        }[]
      }
      rpc_adin_recommendations_people: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          match_reason: string
          match_score: number
          matched_user_id: string
          shared_regions: string[]
          shared_sectors: string[]
        }[]
      }
      rpc_attest_affirmation: {
        Args: { p_affirmation_id: string }
        Returns: undefined
      }
      rpc_check_in_by_token:
        | { Args: { p_event: string; p_token: string }; Returns: Json }
        | { Args: { p_token: string }; Returns: Json }
      rpc_create_post:
        | {
            Args: {
              content: string
              embed_metadata?: Json
              link_metadata?: Json
              link_url?: string
              media_url?: string
              opportunity_link?: string
              opportunity_type?: string
              pillar?: string
              poll_expires_at?: string
              poll_options?: Json
              status?: string
              type?: string
              visibility?: string
            }
            Returns: string
          }
        | { Args: { p: Json }; Returns: string }
        | {
            Args: { p_content: string; p_media_url?: string; p_pillar?: string }
            Returns: string
          }
      rpc_dashboard_counts: { Args: never; Returns: Json }
      rpc_event_approve: {
        Args: { p_registration: string }
        Returns: undefined
      }
      rpc_event_attendee_count: { Args: { p_event: string }; Returns: number }
      rpc_event_attendees: {
        Args: { p_event: string }
        Returns: {
          full_name: string
          registered_at: string
          user_id: string
          username: string
        }[]
      }
      rpc_event_decline: {
        Args: { p_registration: string }
        Returns: undefined
      }
      rpc_event_join_link: { Args: { p_token: string }; Returns: string }
      rpc_event_join_waitlist: { Args: { p_event: string }; Returns: number }
      rpc_event_register:
        | { Args: { p_event: string }; Returns: undefined }
        | {
            Args: { p_answers?: Json; p_event: string; p_ticket_type?: string }
            Returns: undefined
          }
        | {
            Args: {
              p_answers?: Json
              p_event: string
              p_profile: string
              p_ticket: string
            }
            Returns: string
          }
      rpc_event_set_status: {
        Args: { p_event: string; p_status: string; p_user: string }
        Returns: undefined
      }
      rpc_event_unregister: { Args: { p_event: string }; Returns: undefined }
      rpc_event_waitlist_promote: {
        Args: { p_event: string; p_user?: string }
        Returns: string
      }
      rpc_get_profile_bundle: {
        Args: { p_username: string; p_viewer_id?: string }
        Returns: Json
      }
      rpc_health_snapshot: { Args: never; Returns: Json }
      rpc_list_eligible_witnesses: {
        Args: {
          p_role_at_affirm: Database["public"]["Enums"]["dna_identity_role"]
        }
        Returns: string[]
      }
      rpc_log_contribution:
        | {
            Args: {
              p_description?: string
              p_region?: string
              p_sector?: string
              p_target_id: string
              p_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_metadata?: Json
              p_target_id: string
              p_target_title?: string
              p_type: string
            }
            Returns: undefined
          }
      rpc_membership_approve: {
        Args: { p_space: string; p_user: string }
        Returns: undefined
      }
      rpc_membership_reject: {
        Args: { p_space: string; p_user: string }
        Returns: undefined
      }
      rpc_notifications_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          body: string
          created_at: string
          id: string
          metadata: Json
          read_at: string
          title: string
        }[]
      }
      rpc_notifications_mark_all_read: { Args: never; Returns: number }
      rpc_notifications_mark_read: {
        Args: { p_ids: string[] }
        Returns: number
      }
      rpc_public_profile_bundle: { Args: { p_username: string }; Returns: Json }
      rpc_public_profile_by_id: {
        Args: { p_id: string }
        Returns: {
          avatar_url: string
          bio: string
          company: string
          created_at: string
          full_name: string
          headline: string
          id: string
          impact_areas: string[]
          location: string
          profession: string
          region: string
          skills: string[]
          username: string
        }[]
      }
      rpc_public_profiles: {
        Args: {
          p_limit?: number
          p_location?: string
          p_profession?: string
          p_skills?: string[]
        }
        Returns: {
          avatar_url: string
          bio: string
          company: string
          created_at: string
          full_name: string
          headline: string
          id: string
          impact_areas: string[]
          location: string
          profession: string
          region: string
          skills: string[]
          username: string
        }[]
      }
      rpc_request_join_space: { Args: { p_space: string }; Returns: undefined }
      rpc_run_cron_overdue_task_reminders: { Args: never; Returns: undefined }
      rpc_save_opportunity: { Args: { p_op: string }; Returns: undefined }
      rpc_seed_verified_contributor: { Args: never; Returns: undefined }
      rpc_toggle_spotlight: {
        Args: { p_post: string; p_value: boolean }
        Returns: undefined
      }
      search_hashtags: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          display_name: string
          follower_count: number
          id: string
          is_verified: boolean
          name: string
          tag: string
          type: string
          usage_count: number
        }[]
      }
      search_inbox_messages: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          conversation_id: string
          created_at: string
          is_group: boolean
          message_id: string
          snippet: string
        }[]
      }
      search_opportunities: {
        Args: {
          p_cursor?: string
          p_filters?: Json
          p_limit?: number
          p_query?: string
        }
        Returns: {
          created_at: string
          description: string
          id: string
          image_url: string
          location: string
          poster_avatar: string
          poster_id: string
          poster_name: string
          poster_username: string
          status: string
          tags: string[]
          title: string
          type: string
        }[]
      }
      send_group_message: {
        Args: {
          p_client_id?: string
          p_content: string
          p_conversation_id: string
          p_media_urls?: Json
          p_message_type?: string
          p_payload?: Json
          p_reply_to_id?: string
        }
        Returns: string
      }
      send_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_sender_id: string
        }
        Returns: string
      }
      send_notification: {
        Args: {
          p_body: string
          p_entity_id: string
          p_entity_type: string
          p_recipient_id: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      set_connection_intention: {
        Args: {
          p_connection: string
          p_notes?: string
          p_type: string
          p_visibility?: string
        }
        Returns: string
      }
      set_conversation_bucket: {
        Args: { _bucket: string; _conversation_id: string }
        Returns: undefined
      }
      set_group_conversation_archive: {
        Args: { p_archived: boolean; p_conversation_id: string }
        Returns: undefined
      }
      set_group_conversation_mute: {
        Args: { p_conversation_id: string; p_muted: boolean }
        Returns: undefined
      }
      set_group_conversation_pin: {
        Args: { p_conversation_id: string; p_pinned: boolean }
        Returns: undefined
      }
      set_group_mute: {
        Args: { p_conversation_id: string; p_muted: boolean }
        Returns: undefined
      }
      set_group_participant_role: {
        Args: { p_conversation_id: string; p_role: string; p_user_id: string }
        Returns: undefined
      }
      soft_delete_group_message: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      submit_fulfillment: {
        Args: {
          p_attachments?: Json
          p_fulfillment_id: string
          p_notes: string
        }
        Returns: undefined
      }
      tag_overlap_count: { Args: { a: string[]; b: string[] }; Returns: number }
      toggle_hashtag_follow: {
        Args: { p_hashtag_id: string; p_user_id: string }
        Returns: boolean
      }
      toggle_trend_follow: { Args: { p_hashtag: string }; Returns: boolean }
      track_post_engagement: {
        Args: {
          p_engagement_type: string
          p_post_id: string
          p_viewer_id: string
        }
        Returns: string
      }
      track_post_view: {
        Args: {
          p_post_id: string
          p_view_duration?: number
          p_viewer_id?: string
        }
        Returns: string
      }
      track_sponsor_click: {
        Args: { placement_id: string }
        Returns: undefined
      }
      track_sponsor_impression: {
        Args: { placement_id: string }
        Returns: undefined
      }
      transfer_group_ownership: {
        Args: { p_conversation_id: string; p_new_owner_id: string }
        Returns: undefined
      }
      trigger_adin_prompt: {
        Args: { event_type: string; target_user_id: string }
        Returns: undefined
      }
      unblock_user: { Args: { p_blocked_user_id: string }; Returns: undefined }
      unsend_group_message: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      unsend_message: { Args: { p_message_id: string }; Returns: undefined }
      unsubscribe_speaker_follow_by_token: {
        Args: { _token: string }
        Returns: {
          ok: boolean
          speaker_name: string
        }[]
      }
      update_adin_last_active: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      update_admin_session_activity: { Args: never; Returns: undefined }
      update_all_influence_scores: { Args: never; Returns: undefined }
      update_application_status: {
        Args: {
          p_application_id: string
          p_new_status: string
          p_poster_notes?: string
        }
        Returns: string
      }
      update_event_attendee_count: {
        Args: { p_event: string }
        Returns: undefined
      }
      update_group_info: {
        Args: {
          p_avatar_url?: string
          p_conversation_id: string
          p_description?: string
          p_title?: string
        }
        Returns: undefined
      }
      update_group_read_cursor: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      update_last_view_state: {
        Args: { p_context?: Json; p_user_id: string; p_view_state: string }
        Returns: undefined
      }
      update_my_speaker_follow_notify: {
        Args: { _follow_id: string; _notify_email: boolean }
        Returns: boolean
      }
      update_presence: { Args: never; Returns: undefined }
      update_profile_about: {
        Args: { p_bio: string; p_user_id: string }
        Returns: Json
      }
      update_profile_contributions: {
        Args: { p_contribution_tags: Json; p_user_id: string }
        Returns: Json
      }
      update_profile_identity: {
        Args: {
          p_company?: string
          p_full_name?: string
          p_headline?: string
          p_location?: string
          p_professional_role?: string
          p_user_id: string
        }
        Returns: Json
      }
      update_profile_interests: {
        Args: { p_interest_tags?: Json; p_interests: Json; p_user_id: string }
        Returns: Json
      }
      update_profile_skills: {
        Args: { p_skills: Json; p_user_id: string }
        Returns: Json
      }
      update_reminder_status: {
        Args: {
          error_message?: string
          new_status: string
          reminder_id: string
        }
        Returns: boolean
      }
      update_username: { Args: { new_username: string }; Returns: Json }
      user_group_role: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: string
      }
      user_has_profile: { Args: { user_id: string }; Returns: boolean }
      user_is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_invite_code: { Args: { invite_code: string }; Returns: Json }
      validate_prelaunch_access: {
        Args: { user_email: string }
        Returns: boolean
      }
      validate_promo_code: {
        Args: { p_code: string; p_event_id: string }
        Returns: {
          discount_type: string
          discount_value: number
          error_message: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      ad_campaign_status:
        | "draft"
        | "pending_review"
        | "active"
        | "paused"
        | "ended"
        | "rejected"
      advertiser_status: "pending" | "approved" | "suspended" | "rejected"
      advertiser_tier: "starter" | "growth" | "scale"
      app_role: "user" | "moderator" | "admin"
      application_status:
        | "pending"
        | "shortlisted"
        | "reviewing"
        | "accepted"
        | "rejected"
        | "withdrawn"
      attachment_type: "space" | "task" | "update"
      brief_interaction_type:
        | "viewed"
        | "clicked"
        | "dismissed"
        | "not_interested"
        | "saved"
        | "why_this_opened"
      contribution_currency: "expertise" | "network" | "resources" | "capital"
      contribution_need_priority: "normal" | "high"
      contribution_need_status: "open" | "in_progress" | "fulfilled" | "closed"
      contribution_need_type:
        | "funding"
        | "skills"
        | "time"
        | "access"
        | "resources"
      contribution_offer_status:
        | "pending"
        | "accepted"
        | "declined"
        | "completed"
      contribution_type: "time" | "expertise" | "network" | "capital"
      dna_identity_role: "returnee" | "anchor" | "ally" | "exploring"
      event_format: "in_person" | "virtual" | "hybrid"
      event_type:
        | "conference"
        | "workshop"
        | "meetup"
        | "webinar"
        | "networking"
        | "social"
        | "other"
      group_join_policy: "open" | "approval_required" | "invite_only"
      group_member_role: "owner" | "admin" | "moderator" | "member"
      group_privacy: "public" | "private" | "secret"
      hashtag_status: "active" | "archived" | "suspended" | "reserved"
      hashtag_type: "community" | "personal"
      linked_entity_type:
        | "event"
        | "space"
        | "need"
        | "story"
        | "community_post"
      match_kind:
        | "their_stance_my_need"
        | "their_need_my_stance"
        | "mutual"
        | "tag_affinity"
      module_status_state: "live" | "in_design" | "in_beta" | "coming_soon"
      need_scope:
        | "one_off"
        | "few_hours"
        | "short_project"
        | "extended"
        | "open_ended"
      need_status:
        | "draft"
        | "open"
        | "matched"
        | "fulfilled"
        | "closed"
        | "expired"
      opportunity_status: "draft" | "active" | "paused" | "closed" | "archived"
      opportunity_visibility: "public" | "network_only" | "private"
      reasoning_source: "sql" | "dia"
      reserved_category:
        | "country"
        | "public_figure"
        | "company"
        | "government"
        | "offensive"
        | "system"
        | "trademark"
      rsvp_status: "going" | "maybe" | "not_going" | "pending" | "waitlist"
      space_update_type: "manual_update" | "milestone" | "auto_task_event"
      stance_availability:
        | "open_ongoing"
        | "monthly_hours"
        | "quarterly"
        | "project_based"
        | "limited_capacity"
      stance_visibility: "public" | "connections_only" | "private"
      task_status: "open" | "in_progress" | "done"
      user_report_reason:
        | "spam"
        | "harassment"
        | "impersonation"
        | "inappropriate_content"
        | "other"
      user_report_status: "open" | "reviewing" | "resolved" | "dismissed"
      verification_status:
        | "pending_verification"
        | "soft_verified"
        | "fully_verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_campaign_status: [
        "draft",
        "pending_review",
        "active",
        "paused",
        "ended",
        "rejected",
      ],
      advertiser_status: ["pending", "approved", "suspended", "rejected"],
      advertiser_tier: ["starter", "growth", "scale"],
      app_role: ["user", "moderator", "admin"],
      application_status: [
        "pending",
        "shortlisted",
        "reviewing",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      attachment_type: ["space", "task", "update"],
      brief_interaction_type: [
        "viewed",
        "clicked",
        "dismissed",
        "not_interested",
        "saved",
        "why_this_opened",
      ],
      contribution_currency: ["expertise", "network", "resources", "capital"],
      contribution_need_priority: ["normal", "high"],
      contribution_need_status: ["open", "in_progress", "fulfilled", "closed"],
      contribution_need_type: [
        "funding",
        "skills",
        "time",
        "access",
        "resources",
      ],
      contribution_offer_status: [
        "pending",
        "accepted",
        "declined",
        "completed",
      ],
      contribution_type: ["time", "expertise", "network", "capital"],
      dna_identity_role: ["returnee", "anchor", "ally", "exploring"],
      event_format: ["in_person", "virtual", "hybrid"],
      event_type: [
        "conference",
        "workshop",
        "meetup",
        "webinar",
        "networking",
        "social",
        "other",
      ],
      group_join_policy: ["open", "approval_required", "invite_only"],
      group_member_role: ["owner", "admin", "moderator", "member"],
      group_privacy: ["public", "private", "secret"],
      hashtag_status: ["active", "archived", "suspended", "reserved"],
      hashtag_type: ["community", "personal"],
      linked_entity_type: ["event", "space", "need", "story", "community_post"],
      match_kind: [
        "their_stance_my_need",
        "their_need_my_stance",
        "mutual",
        "tag_affinity",
      ],
      module_status_state: ["live", "in_design", "in_beta", "coming_soon"],
      need_scope: [
        "one_off",
        "few_hours",
        "short_project",
        "extended",
        "open_ended",
      ],
      need_status: [
        "draft",
        "open",
        "matched",
        "fulfilled",
        "closed",
        "expired",
      ],
      opportunity_status: ["draft", "active", "paused", "closed", "archived"],
      opportunity_visibility: ["public", "network_only", "private"],
      reasoning_source: ["sql", "dia"],
      reserved_category: [
        "country",
        "public_figure",
        "company",
        "government",
        "offensive",
        "system",
        "trademark",
      ],
      rsvp_status: ["going", "maybe", "not_going", "pending", "waitlist"],
      space_update_type: ["manual_update", "milestone", "auto_task_event"],
      stance_availability: [
        "open_ongoing",
        "monthly_hours",
        "quarterly",
        "project_based",
        "limited_capacity",
      ],
      stance_visibility: ["public", "connections_only", "private"],
      task_status: ["open", "in_progress", "done"],
      user_report_reason: [
        "spam",
        "harassment",
        "impersonation",
        "inappropriate_content",
        "other",
      ],
      user_report_status: ["open", "reviewing", "resolved", "dismissed"],
      verification_status: [
        "pending_verification",
        "soft_verified",
        "fully_verified",
      ],
    },
  },
} as const
