import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/convey/RichTextEditor';
import { getStoryTypeOptions, getStoryTypeConfig, type StoryType } from '@/types/storyTypes';
import type { ComposerFormData } from '@/hooks/useUniversalComposer';
import { FieldError } from './FieldError';
import { StoryImageUpload } from './StoryImageUpload';
import { StoryGalleryUpload } from './StoryGalleryUpload';

interface StoryModeFieldsProps {
  formData: ComposerFormData;
  onChange: (updates: Partial<ComposerFormData>) => void;
  validationErrors?: Record<string, string>;
}

export function StoryModeFields({ formData, onChange, validationErrors = {} }: StoryModeFieldsProps) {
  const storyTypeOptions = getStoryTypeOptions();
  const selectedType = formData.storyType || 'update';
  const config = getStoryTypeConfig(selectedType);

  return (
    <>
      {/* Story Type Selector */}
      <div>
        <Label>What type of story? *</Label>
        <Select
          value={selectedType}
          onValueChange={(value: StoryType) => onChange({ storyType: value })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select story type" />
          </SelectTrigger>
          <SelectContent position="item-aligned" className="bg-popover z-[9999] [&_[data-highlighted]]:text-white [&_[data-highlighted]]:bg-[#2A7A8C]">
            {storyTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span>{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  <span className="text-muted-foreground text-sm hidden sm:inline">
                    – {option.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
      </div>

      {/* Title */}
      <div>
        <Label>Title *</Label>
        <Input
          placeholder={config.placeholders.title}
          value={formData.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <FieldError field="title" errors={validationErrors} />
      </div>

      {/* Subtitle */}
      <div>
        <Label>Subtitle (optional)</Label>
        <Input
          placeholder={config.placeholders.subtitle}
          value={formData.subtitle || ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
        />
      </div>

      {/* Content - Rich Text Editor */}
      <div>
        <Label>Story *</Label>
        <RichTextEditor
          value={formData.content}
          onChange={(value) => {
            if (value.length <= 4000) {
              onChange({ content: value });
            }
          }}
          placeholder={config.placeholders.content}
          minHeight="200px"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.content.length < config.suggestedLength.min
            ? `${formData.content.length}/${config.suggestedLength.min} characters (minimum for ${config.label})`
            : formData.content.length > config.suggestedLength.max - 200
              ? `${formData.content.length}/${config.suggestedLength.max} characters (nearing limit)`
              : `${formData.content.length} characters (${config.suggestedLength.min}–${config.suggestedLength.max} recommended)`
          }
        </p>
        <FieldError field="content" errors={validationErrors} />
      </div>

      {/* Cover Image */}
      <StoryImageUpload
        currentImageUrl={formData.heroImage}
        onUpload={(url) => onChange({ heroImage: url })}
        onRemove={() => onChange({ heroImage: undefined })}
      />

      {/* Gallery for Photo Essays */}
      {config.supportsGallery && (
        <StoryGalleryUpload
          galleryUrls={formData.galleryUrls || []}
          onChange={(urls) => onChange({ galleryUrls: urls })}
        />
      )}
    </>
  );
}
