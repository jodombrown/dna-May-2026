import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ComposerFormData } from '@/hooks/useUniversalComposer';
import { FieldError } from './FieldError';
import { EventCoverUpload } from './EventCoverUpload';

interface EventModeFieldsProps {
  formData: ComposerFormData;
  onChange: (updates: Partial<ComposerFormData>) => void;
  validationErrors?: Record<string, string>;
}

/**
 * EventModeFields - Enhanced event creation form per PRD.
 */
export function EventModeFields({ formData, onChange, validationErrors = {} }: EventModeFieldsProps) {
  const formatOptions = [
    { value: 'in_person', label: 'In Person', icon: '📍', description: 'Physical location' },
    { value: 'virtual', label: 'Virtual', icon: '💻', description: 'Online meeting' },
    { value: 'hybrid', label: 'Hybrid', icon: '🌐', description: 'Both options' },
  ];

  const dressCodeOptions = [
    { value: 'casual', label: 'Casual' },
    { value: 'business_casual', label: 'Business Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'other', label: 'Other' },
  ];

  // Agenda items
  const agendaItems = formData.agenda || [];
  const addAgendaItem = () => {
    onChange({ agenda: [...agendaItems, { time: '', title: '' }] });
  };
  const updateAgendaItem = (index: number, field: 'time' | 'title', value: string) => {
    const updated = [...agendaItems];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ agenda: updated });
  };
  const removeAgendaItem = (index: number) => {
    onChange({ agenda: agendaItems.filter((_, i) => i !== index) });
  };

  // Tags
  const tags = formData.tags || [];
  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onChange({ tags: [...tags, tagInput.trim()] });
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => {
    onChange({ tags: tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-4">
      {/* Event Title */}
      <div>
        <Label className="text-sm font-medium">Event Title *</Label>
        <Input
          placeholder="Pan-African Investment Summit 2026"
          value={formData.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="mt-1.5"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {(formData.title?.length || 0)}/100 characters
        </p>
        <FieldError field="title" errors={validationErrors} />
      </div>

      {/* Subtitle */}
      <div>
        <Label className="text-sm font-medium">Subtitle (optional)</Label>
        <Input
          placeholder="Connecting diaspora investors with opportunities"
          value={formData.subtitle || ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          className="mt-1.5"
          maxLength={150}
        />
      </div>

      {/* Cover Image */}
      <div>
        <Label className="text-sm font-medium">Cover Image</Label>
        <EventCoverUpload
          currentImageUrl={formData.mediaUrl}
          onUpload={(url) => onChange({ mediaUrl: url })}
          onRemove={() => onChange({ mediaUrl: undefined })}
        />
      </div>

      {/* Date & Time Row */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Date & Time *</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Start</p>
            <Input
              type="date"
              value={formData.eventDate || ''}
              onChange={(e) => onChange({ eventDate: e.target.value })}
              className="w-full text-sm"
            />
            <Input
              type="time"
              value={formData.eventTime || ''}
              onChange={(e) => onChange({ eventTime: e.target.value })}
              className="w-full text-sm mt-1.5"
            />
            <FieldError field="eventDate" errors={validationErrors} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">End</p>
            <Input
              type="date"
              value={formData.eventEndDate || ''}
              onChange={(e) => onChange({ eventEndDate: e.target.value })}
              className="w-full text-sm"
            />
            <Input
              type="time"
              value={formData.eventEndTime || ''}
              onChange={(e) => onChange({ eventEndTime: e.target.value })}
              className="w-full text-sm mt-1.5"
            />
            <FieldError field="eventEndDate" errors={validationErrors} />
          </div>
        </div>

        {/* Timezone Selector */}
        <div className="mt-3">
          <Label className="text-xs text-muted-foreground mb-1 block">Timezone</Label>
          <Select
            value={formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            onValueChange={(value) => onChange({ timezone: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {/* Africa - prioritized */}
              <SelectItem value="Africa/Lagos">Lagos, Nigeria (WAT)</SelectItem>
              <SelectItem value="Africa/Nairobi">Nairobi, Kenya (EAT)</SelectItem>
              <SelectItem value="Africa/Johannesburg">Johannesburg, South Africa (SAST)</SelectItem>
              <SelectItem value="Africa/Cairo">Cairo, Egypt (EET)</SelectItem>
              <SelectItem value="Africa/Accra">Accra, Ghana (GMT)</SelectItem>
              <SelectItem value="Africa/Casablanca">Casablanca, Morocco (WET)</SelectItem>
              <SelectItem value="Africa/Addis_Ababa">Addis Ababa, Ethiopia (EAT)</SelectItem>
              <SelectItem value="Africa/Dakar">Dakar, Senegal (GMT)</SelectItem>
              <SelectItem value="Africa/Kigali">Kigali, Rwanda (CAT)</SelectItem>
              <SelectItem value="Africa/Kinshasa">Kinshasa, DRC (WAT)</SelectItem>
              {/* Americas */}
              <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
              <SelectItem value="America/Chicago">Chicago (CST/CDT)</SelectItem>
              <SelectItem value="America/Denver">Denver (MST/MDT)</SelectItem>
              <SelectItem value="America/Los_Angeles">Los Angeles (PST/PDT)</SelectItem>
              <SelectItem value="America/Toronto">Toronto (EST/EDT)</SelectItem>
              <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
              <SelectItem value="America/Mexico_City">Mexico City (CST)</SelectItem>
              {/* Europe */}
              <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
              <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Amsterdam">Amsterdam (CET/CEST)</SelectItem>
              {/* Middle East / Asia */}
              <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
              <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              {/* Caribbean */}
              <SelectItem value="America/Jamaica">Jamaica (EST)</SelectItem>
              <SelectItem value="America/Port_of_Spain">Trinidad & Tobago (AST)</SelectItem>
              <SelectItem value="America/Barbados">Barbados (AST)</SelectItem>
              {/* UTC */}
              <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event Format */}
      <div>
        <Label className="text-sm font-medium">Event Type *</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {formatOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ format: option.value as ComposerFormData['format'] })}
              className={cn(
                'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                formData.format === option.value
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <span className="text-xl mb-1">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location (for in-person/hybrid) */}
      {(formData.format === 'in_person' || formData.format === 'hybrid') && (
        <div>
          <Label className="text-sm font-medium">Location *</Label>
          <Input
            placeholder="Lagos Continental Hotel, Lagos, Nigeria"
            value={formData.location || ''}
            onChange={(e) => onChange({ location: e.target.value })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span>ℹ️</span> Format: Venue, City, Country
          </p>
          <FieldError field="location" errors={validationErrors} />
        </div>
      )}

      {/* Meeting Link (for virtual/hybrid) */}
      {(formData.format === 'virtual' || formData.format === 'hybrid') && (
        <div>
          <Label className="text-sm font-medium">Meeting Link *</Label>
          <Input
            placeholder="https://zoom.us/j/123456789"
            value={formData.meetingUrl || ''}
            onChange={(e) => onChange({ meetingUrl: e.target.value })}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span>ℹ️</span> Zoom, Google Meet, Teams, or any URL
          </p>
          <FieldError field="meetingUrl" errors={validationErrors} />
        </div>
      )}

      {/* Section Divider */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Event Details</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* What to Expect (replaces Description) */}
      <div>
        <Label className="text-sm font-medium">What to Expect *</Label>
        <Textarea
          placeholder="What will attendees experience? What will they learn? Why should they attend?"
          value={formData.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className="min-h-[100px] resize-none mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.content.length < 50
            ? `${formData.content.length}/50 characters minimum`
            : `${formData.content.length} characters`
          }
        </p>
        <FieldError field="content" errors={validationErrors} />
      </div>

      {/* Agenda Builder */}
      <div>
        <Label className="text-sm font-medium">Agenda (optional)</Label>
        <div className="space-y-2 mt-2">
          {agendaItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Input
                type="text"
                placeholder="6:00 PM"
                value={item.time}
                onChange={(e) => updateAgendaItem(index, 'time', e.target.value)}
                className="w-24 flex-shrink-0"
              />
              <Input
                placeholder="Registration & Networking"
                value={item.title}
                onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAgendaItem(index)}
                className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAgendaItem}
            className="w-full border-dashed"
          >
            + Add agenda item
          </Button>
        </div>
        {agendaItems.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Example: 6:00 PM - Registration, 6:30 PM - Keynote, 7:30 PM - Q&A
          </p>
        )}
      </div>

      {/* Dress Code & Capacity Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Dress Code (optional)</Label>
          <Select
            value={formData.dressCode || ''}
            onValueChange={(value) => onChange({ dressCode: value })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {dressCodeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Capacity (optional)</Label>
          <Input
            type="number"
            placeholder="Unlimited"
            value={formData.maxAttendees || ''}
            onChange={(e) => onChange({ maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}
            className="mt-1.5"
            min={1}
          />
          <FieldError field="maxAttendees" errors={validationErrors} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label className="text-sm font-medium">Tags (optional)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-amber-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex gap-1">
            <Input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="h-8 w-28 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addTag}
              className="h-8 px-2"
            >
              +
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
