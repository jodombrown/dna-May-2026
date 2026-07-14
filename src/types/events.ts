export type EventType = 
  | 'conference'
  | 'workshop'
  | 'meetup'
  | 'webinar'
  | 'networking'
  | 'social'
  | 'other';

export type EventFormat = 'in_person' | 'virtual' | 'hybrid';

export type RsvpStatus = 'going' | 'maybe' | 'not_going' | 'pending' | 'waitlist';

export interface Event {
  id: string;
  organizer_id: string;
  group_id?: string;
  title: string;
  description: string;
  event_type: EventType;
  format: EventFormat;
  
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  location_lat?: number;
  location_lng?: number;
  
  meeting_url?: string;
  meeting_platform?: string;
  
  start_time: string | null;
  end_time: string | null;
  time_confirmed?: boolean | null;
  date_confirmed?: boolean | null;
  timezone: string;

  max_attendees?: number;
  cover_image_url?: string;

  is_public: boolean;
  requires_approval: boolean;
  allow_guests: boolean;
  
  is_cancelled: boolean;
  cancellation_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface EventWithOrganizer extends Event {
  organizer_username: string;
  organizer_full_name: string;
  organizer_avatar_url?: string;
  organizer_headline?: string;
  attendee_count: number;
  going_count: number;
  maybe_count: number;
  user_rsvp_status?: RsvpStatus;
  is_organizer: boolean;
  can_edit: boolean;
}

export interface EventListItem {
  event_id: string;
  organizer_id: string;
  organizer_username: string;
  organizer_full_name: string;
  organizer_avatar_url?: string;
  title: string;
  description: string;
  event_type: EventType;
  format: EventFormat;
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  meeting_url?: string;
  start_time: string | null;
  end_time: string | null;
  time_confirmed?: boolean | null;
  date_confirmed?: boolean | null;
  timezone: string;
  max_attendees?: number;
  cover_image_url?: string;
  is_public: boolean;
  requires_approval: boolean;
  created_at: string;
  attendee_count: number;
  user_rsvp_status?: RsvpStatus;
  is_organizer: boolean;
}

export interface EventAttendee {
  attendee_id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  status: RsvpStatus;
  response_note?: string;
  checked_in: boolean;
  created_at: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  event_type: EventType;
  format: EventFormat;

  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_country?: string;

  meeting_url?: string;
  meeting_platform?: string;

  start_time: string;
  end_time: string;
  timezone: string;

  max_attendees?: number;
  cover_image_url?: string;

  is_public: boolean;
  requires_approval: boolean;
  allow_guests: boolean;
}

// =====================================================
// NEW TYPE DEFINITIONS - DNA Convene Part 1
// =====================================================

// Event lifecycle status
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'postponed' | 'completed';

// Event visibility
export type EventVisibility = 'public' | 'unlisted' | 'private' | 'invite_only';

// Virtual URL visibility
export type VirtualUrlVisibility = 'public' | 'on_rsvp' | 'on_checkin' | 'hidden';

// Event team roles
export type EventRole = 'owner' | 'cohost' | 'manager' | 'checkin' | 'promoter';

// Ticket status
export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded' | 'transferred' | 'expired';

// Order/payment status
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

// Ticket type visibility
export type TicketVisibility = 'public' | 'hidden' | 'promo_only';

// Ticket access level
export type TicketAccessLevel = 'standard' | 'vip' | 'premium' | 'sponsor' | 'speaker' | 'staff';

// Promo code discount type
export type PromoDiscountType = 'percentage' | 'fixed_amount' | 'free';

// Event role permissions
export interface EventPermissions {
  can_edit_details?: boolean;
  can_manage_tickets?: boolean;
  can_view_attendees?: boolean;
  can_message_attendees?: boolean;
  can_check_in?: boolean;
  can_view_analytics?: boolean;
  can_manage_team?: boolean;
  can_access_payments?: boolean;
}

// Event role record
export interface EventRoleMember {
  id: string;
  event_id: string;
  user_id: string;
  role: EventRole;
  permissions: EventPermissions;
  status: 'pending' | 'active' | 'declined' | 'removed';
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

// Individual ticket
export interface EventTicket {
  id: string;
  event_id: string;
  ticket_type_id: string;
  order_id?: string;
  attendee_id?: string;
  owner_user_id?: string;
  owner_email: string;
  owner_name?: string;
  ticket_number: string;
  qr_code_data: string;
  price_paid_cents: number;
  currency: string;
  status: TicketStatus;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
  transfer_count: number;
  created_at: string;
}

// Order (renamed from event_registrations)
export interface EventOrder {
  id: string;
  event_id: string;
  user_id?: string;
  order_number: string;
  purchaser_name?: string;
  purchaser_email?: string;
  purchaser_phone?: string;
  ticket_type_id?: string;
  subtotal_cents?: number;
  discount_cents: number;
  platform_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  promo_code_id?: string;
  promo_code_used?: string;
  payment_status: OrderStatus;
  payment_method?: string;
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
  stripe_charge_id?: string;
  stripe_receipt_url?: string;
  refunded_cents: number;
  refund_reason?: string;
  refunded_at?: string;
  created_at: string;
}

// Promo code
export interface EventPromoCode {
  id: string;
  event_id: string;
  code: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  applicable_ticket_types: string[];
  min_order_cents?: number;
  max_discount_cents?: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_user: number;
  valid_from?: string;
  valid_until?: string;
  reveals_ticket_types: string[];
  is_active: boolean;
  created_at: string;
}

// Enhanced Event interface fields (extend existing Event)
export interface EnhancedEvent extends Event {
  // New fields from Migration 001
  short_description?: string;
  venue_instructions?: string;
  virtual_url_visibility: VirtualUrlVisibility;
  doors_open_time?: string;
  recurrence_rule?: string;
  parent_event_id?: string;
  thumbnail_url?: string;
  gallery_urls: string[];
  speakers: Array<{
    name: string;
    title?: string;
    bio?: string;
    image_url?: string;
    profile_id?: string;
  }>;
  sponsors: Array<{
    name: string;
    tier?: string;
    logo_url?: string;
    url?: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  visibility: EventVisibility;
  max_guests_per_rsvp: number;
  age_restriction?: 'all_ages' | '18+' | '21+';
  registration_deadline?: string;
  status: EventStatus;
  published_at?: string;
  completed_at?: string;
  collaborate_space_id?: string;
  contribute_campaign_id?: string;
}

// Enhanced EventAttendee interface fields
export interface EnhancedEventAttendee extends EventAttendee {
  // New fields from Migration 002
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_count: number;
  additional_guests: Array<{ name: string; email?: string }>;
  ticket_id?: string;
  ticket_type_id?: string;
  check_in_method?: 'qr' | 'manual' | 'self';
  checked_in_by?: string;
  qr_code_token: string;
  source: 'direct' | 'referral' | 'share_link' | 'embed' | 'api' | 'import';
  referrer_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  organizer_notes?: string;
  order_id?: string;
}

// Enhanced EventTicketType interface
export interface EnhancedEventTicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price_cents: number;
  // New fields from Migration 003
  currency: string;
  original_price_cents?: number;
  quantity_sold: number;
  quantity_reserved: number;
  quantity_total?: number;
  min_per_order: number;
  max_per_order: number;
  visibility: TicketVisibility;
  access_level: TicketAccessLevel;
  perks: string[];
  sort_order: number;
  status: 'active' | 'paused' | 'sold_out' | 'ended';
  sales_start?: string;
  sales_end?: string;
  created_at: string;
}
