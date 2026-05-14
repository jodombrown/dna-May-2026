import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { ComposerMode, ComposerContext, ComposerFormData } from '@/hooks/useUniversalComposer';
import { RebuildingCard } from '@/components/shared/RebuildingPlaceholder';
import { FieldError } from './fields/FieldError';
import { MediaUploadButton } from './fields/MediaUploadButton';
import { PostModeFields } from './fields/PostModeFields';
import { StoryModeFields } from './fields/StoryModeFields';
import { EventModeFields } from './fields/EventModeFields';

interface ComposerBodyProps {
  mode: ComposerMode;
  formData: ComposerFormData;
  context: ComposerContext;
  onChange: (updates: Partial<ComposerFormData>) => void;
  validationErrors?: Record<string, string>;
}

export const ComposerBody = ({
  mode,
  formData,
  context,
  onChange,
  validationErrors = {},
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
      {renderModeFields(mode, formData, onChange, validationErrors)}
    </div>
  );
};

function renderModeFields(
  mode: ComposerMode,
  formData: ComposerFormData,
  onChange: (updates: Partial<ComposerFormData>) => void,
  validationErrors: Record<string, string> = {}
) {
  switch (mode) {
    case 'post':
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
      // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
      return <RebuildingCard module="contribute" />;

    case 'space':
      // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
      return <RebuildingCard module="collaborate" />;

    case 'community':
      return (
        <>
          <div>
            <Label>Title (optional)</Label>
            <Input
              placeholder="Post title"
              value={formData.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Share with your community..."
            value={formData.content}
            onChange={(e) => onChange({ content: e.target.value })}
            className="min-h-[120px] resize-none"
          />
          <FieldError field="content" errors={validationErrors} />
          <MediaUploadButton onUpload={(url) => onChange({ mediaUrl: url })} />
        </>
      );

    default:
      return null;
  }
}
