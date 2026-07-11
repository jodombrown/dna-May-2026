import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { ComposerMode, ComposerContext, ComposerFormData } from '@/hooks/useUniversalComposer';
import { RebuildingCard } from '@/components/shared/RebuildingPlaceholder';
import { FieldError } from './fields/FieldError';
import { PostModeFields } from './fields/PostModeFields';
import { StoryModeFields } from './fields/StoryModeFields';
import { EventModeFields } from './fields/EventModeFields';
import {
  OpportunityModeFields,
  type OpportunityFieldValues,
} from './fields/OpportunityModeFields';

interface ComposerBodyProps {
  mode: ComposerMode;
  formData: ComposerFormData;
  context: ComposerContext;
  onChange: (updates: Partial<ComposerFormData>) => void;
  validationErrors?: Record<string, string>;
  /** Field keys DIA proposed and the member has not yet edited (BD085). */
  diaProposed?: Set<string>;
}

export const ComposerBody = ({
  mode,
  formData,
  context,
  onChange,
  validationErrors = {},
  diaProposed,
}: ComposerBodyProps) => {
  const { data: profile } = useProfile();

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0">
      {/* Author Info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback>
            {profile?.display_name?.[0] || profile?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {profile?.display_name || profile?.username || 'User'}
          </p>
          {context.spaceId && (
            <p className="text-xs text-muted-foreground">Posting in Space</p>
          )}
          {context.eventId && (
            <p className="text-xs text-muted-foreground">Posting in Event</p>
          )}
          {context.communityId && (
            <p className="text-xs text-muted-foreground">Posting in Community</p>
          )}
        </div>
      </div>

      {/* Mode-specific fields with inline validation errors */}
      {renderModeFields(mode, formData, onChange, validationErrors, diaProposed)}
    </div>
  );
};

function renderModeFields(
  mode: ComposerMode,
  formData: ComposerFormData,
  onChange: (updates: Partial<ComposerFormData>) => void,
  validationErrors: Record<string, string> = {},
  diaProposed?: Set<string>
) {
  switch (mode) {
    case 'connect':
      return (
        <>
          <PostModeFields formData={formData} onChange={onChange} validationErrors={validationErrors} />
          <FieldError field="content" errors={validationErrors} />
        </>
      );

    case 'story':
      return <StoryModeFields formData={formData} onChange={onChange} validationErrors={validationErrors} />;

    case 'event':
      return <EventModeFields formData={formData} onChange={onChange} validationErrors={validationErrors} />;

    case 'need':
      // Contribute — the give → to → impact triple (BD084). The field UI that
      // did not exist. DIA proposes; the member owns the final value (BD085).
      return (
        <OpportunityModeFields
          values={{
            direction: formData.direction ?? 'need',
            category: formData.category,
            giveWhat: formData.giveWhat,
            giveTo: formData.giveTo,
            intendedImpact: formData.intendedImpact,
          }}
          onChange={(patch) => onChange(patch)}
          diaProposed={diaProposed as Set<keyof OpportunityFieldValues> | undefined}
          errors={validationErrors as Partial<Record<keyof OpportunityFieldValues, string>>}
        />
      );

    case 'space':
      // Collaborate rides the existing Spaces substrate; the verb is a launcher.
      // Reaching this state means a direct open('space') — show the placeholder.
      return <RebuildingCard module="collaborate" />;

    default:
      return null;
  }
}
