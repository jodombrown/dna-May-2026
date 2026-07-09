import { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, description?: string) => void;
  type: 'post' | 'comment';
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech or discrimination' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'False information' },
  { value: 'other', label: 'Other' },
];

export function ReportDialog({ open, onOpenChange, onSubmit, type }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason, description || undefined);
      onOpenChange(false);
      setReason('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-md">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Report {type}</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Help us understand what's wrong with this {type}. Your report is anonymous.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="px-4 py-4 space-y-4">
        <RadioGroup value={reason} onValueChange={setReason}>
          {REPORT_REASONS.map((r) => (
            <div key={r.value} className="flex items-center space-x-2">
              <RadioGroupItem value={r.value} id={r.value} />
              <Label htmlFor={r.value} className="cursor-pointer">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div>
          <Label htmlFor="description" className="text-sm text-muted-foreground">
            Additional details (optional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide any additional context..."
            rows={3}
            className="mt-2 w-full resize-none"
          />
        </div>
      </div>

      <ResponsiveModalFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !reason}
          variant="destructive"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Submitting...' : 'Submit report'}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
