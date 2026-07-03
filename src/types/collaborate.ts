// Space visibility + status domains — mirror the live DB CHECK constraints on public.spaces.
export type SpaceVisibility = 'public' | 'community' | 'private';
export type SpaceStatus = 'idea' | 'forming' | 'active' | 'completed' | 'paused' | 'abandoned';

export type TemplateCategory = 'learning' | 'investment' | 'community' | 'advocacy' | 'professional';

export interface SpaceTemplateRole {
  title: string;
  description?: string;
  is_lead?: boolean;
  permissions?: string[];
}

export interface SpaceTemplateInitiative {
  title: string;
  description?: string;
  priority?: string;
}

export interface SpaceTemplateMilestone {
  title: string;
  description?: string;
  due_offset_days?: number;
}

export interface SpaceTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  default_roles: SpaceTemplateRole[] | null;
  default_initiatives: SpaceTemplateInitiative[] | null;
  suggested_milestones: SpaceTemplateMilestone[] | null;
  tier_availability: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSpaceInput {
  name: string;
  description?: string;
  visibility?: SpaceVisibility;
  source_type?: 'event' | 'content' | 'marketplace' | 'organic';
  source_id?: string;
}

export interface CreateSpaceFromTemplateInput extends CreateSpaceInput {
  templateId: string;
}

// Space entity
export interface Space {
  id: string;
  slug?: string;
  name: string;
  tagline?: string;
  description?: string;
  space_type?: string;
  status: SpaceStatus;
  visibility: SpaceVisibility;
  focus_areas?: string[];
  region?: string;
  created_by: string;
  template_id?: string;
  cover_image_url?: string;
  source_type?: string;
  source_id?: string;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
}

// Space member
export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role?: string;
  role_id?: string;
  status: string;
  joined_at: string;
  invited_by?: string;
  user?: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
  };
  role_info?: SpaceRole;
}

// Space role
export interface SpaceRole {
  id: string;
  space_id: string;
  title: string;
  description?: string;
  required_skills?: string[];
  permissions?: Record<string, boolean>;
  is_lead: boolean;
  order_index: number;
  created_at: string;
}

// Initiative status type
export type InitiativeStatus = 'planning' | 'active' | 'completed' | 'abandoned';

// Initiative milestone (for inline display)
export interface InitiativeMilestone {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'missed';
}

// Initiative
export interface Initiative {
  id: string;
  space_id: string;
  title: string;
  description?: string;
  impact_area?: string;
  status: InitiativeStatus;
  target_date?: string;
  started_at?: string;
  completed_at?: string;
  completion_metrics?: Record<string, unknown>;
  order_index: number;
  creator_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  task_count?: number;
  completed_task_count?: number;
  milestones?: InitiativeMilestone[];
}

// Task status enum (matches DB enum: open, in_progress, done)
export type TaskStatus = 'open' | 'in_progress' | 'done';

// Task priority (not in DB, used for UI display)
export type TaskPriority = 'low' | 'medium' | 'high';

// Space task (alias Task for components)
export interface SpaceTask {
  id: string;
  space_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  status: TaskStatus;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Alias for cleaner component usage
export type Task = SpaceTask;

// Space activity
export interface SpaceActivity {
  id: string;
  space_id: string;
  user_id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Nudge types
export type NudgeTone = 'gentle' | 'checkin' | 'urgent';
export type NudgeType = 'manual' | 'stalled' | 'overdue';

export interface Nudge {
  id: string;
  space_id: string;
  task_id?: string;
  target_user_id: string;
  sent_by: string;
  type: NudgeType;
  tone: NudgeTone;
  message: string;
  sent_at: string;
  acknowledged_at?: string;
  created_at: string;
}
