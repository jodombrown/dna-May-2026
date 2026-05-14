// Type definitions for the dia-room-reasoning edge function.
//
// Phase 4 tables (room_curations, contribution_manifests,
// currency_stances, need_declarations) are not yet present in the
// generated Supabase types, so this module declares a minimal
// Database shape covering exactly the tables/columns this function
// reads or writes. When the upstream types are regenerated this
// file should be removed in favour of the global Database export.

export type CurationKind =
  | "their_stance_my_need"
  | "my_stance_their_need"
  | "stance_stance"
  | "need_need"
  | "shared_interest";

export type ReasoningSource = "sql" | "dia";

export type RequestMode = "replace" | "fill_only";

export interface RoomReasoningRequest {
  curation_ids: string[];
  mode?: RequestMode;
}

export interface RowFailure {
  curation_id: string;
  reason: string;
}

export interface RoomReasoningResponse {
  processed: number;
  upgraded: number;
  skipped: number;
  failed: number;
  failures: RowFailure[];
}

// Row shapes used by this function. These describe the rows as
// returned by the queries below; they are not a complete model of
// the underlying tables.

export interface RoomCurationRow {
  id: string;
  viewer_id: string;
  matched_user_id: string;
  kind: CurationKind | string;
  score: number;
  matched_stance_id: string | null;
  matched_need_id: string | null;
  reasoning_source: ReasoningSource | string;
}

export interface CurrencyStanceRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
}

export interface NeedDeclarationRow {
  id: string;
  user_id: string;
  title: string;
  context: string | null;
}

export interface ContributionManifestRow {
  user_id: string;
  headline: string | null;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
}

// Local Database shape. Restricted to the surface area this
// function touches so createClient<Database>() stays strongly
// typed without depending on regenerated upstream types.

export interface RoomReasoningDatabase {
  public: {
    Tables: {
      room_curations: {
        Row: RoomCurationRow & {
          reasoning_text: string | null;
          reasoning_generated_at: string | null;
        };
        Insert: never;
        Update: {
          reasoning_text?: string;
          reasoning_source?: ReasoningSource;
          reasoning_generated_at?: string;
        };
        Relationships: [];
      };
      currency_stances: {
        Row: CurrencyStanceRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      need_declarations: {
        Row: NeedDeclarationRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      contribution_manifests: {
        Row: ContributionManifestRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// The shape passed to the prompt builder. Resolved per curation
// after the context fetch.

export interface CurationContext {
  curation_id: string;
  kind: string;
  viewer_display_name: string;
  viewer_headline: string | null;
  matched_display_name: string;
  matched_headline: string | null;
  viewer_stance: { title: string; description: string | null } | null;
  viewer_need: { title: string; context: string | null } | null;
  matched_stance: { title: string; description: string | null } | null;
  matched_need: { title: string; context: string | null } | null;
}

// Perplexity Sonar response shape (subset).

export interface PerplexityChoice {
  message: { content: string };
}

export interface PerplexityResponse {
  choices: PerplexityChoice[];
}

export function isPerplexityResponse(
  value: unknown,
): value is PerplexityResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as { choices?: unknown };
  if (!Array.isArray(v.choices) || v.choices.length === 0) return false;
  const first = v.choices[0] as { message?: { content?: unknown } } | undefined;
  return (
    !!first &&
    !!first.message &&
    typeof first.message.content === "string"
  );
}
