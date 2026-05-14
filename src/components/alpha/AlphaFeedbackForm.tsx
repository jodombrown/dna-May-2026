import React, { useState } from 'react';
import { X, Bug, Lightbulb, HelpCircle, Heart, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  alphaFeedbackService,
  type FeedbackCategory,
  type FeedbackArea,
} from '@/services/alphaFeedbackService';

interface AlphaFeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: Array<{ value: FeedbackCategory; label: string; icon: React.ReactNode }> = [
  { value: 'bug', label: 'Bug', icon: <Bug className="h-4 w-4" /> },
  { value: 'feature_idea', label: 'Feature Idea', icon: <Lightbulb className="h-4 w-4" /> },
  { value: 'confusion', label: 'Confusion', icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'love', label: 'Love', icon: <Heart className="h-4 w-4" /> },
];

const AREAS: Array<{ value: FeedbackArea; label: string }> = [
  { value: 'feed', label: 'Feed' },
  { value: 'composer', label: 'Composer' },
  { value: 'events', label: 'Events' },
  { value: 'spaces', label: 'Spaces' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'messages', label: 'Messages' },
  { value: 'dia', label: 'DIA' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'other', label: 'Other' },
];

function getDeviceType(): 'mobile' | 'desktop' {
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

function getViewport(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

export function AlphaFeedbackForm({ isOpen, onClose, onSuccess }: AlphaFeedbackFormProps) {
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [area, setArea] = useState<FeedbackArea | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = category !== null && content.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid || !category) return;

    setIsSubmitting(true);
    const success = await alphaFeedbackService.submitFeedback({
      category,
      area: area ?? undefined,
      content: content.trim(),
      pageUrl: window.location.href,
      viewport: getViewport(),
      deviceType: getDeviceType(),
    });

    setIsSubmitting(false);

    if (success) {
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      onSuccess?.();
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } else {
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  const resetForm = () => {
    setCategory(null);
    setArea(null);
    setContent('');
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
        onClick={handleClose}
      />

      {/* Form Panel */}
      <div
        className={cn(
          'fixed z-[61]',
          'bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2',
          'w-full sm:w-[420px] max-h-[85vh]',
          'bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-lg',
          'shadow-2xl border border-neutral-200 dark:border-neutral-700',
          'flex flex-col overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-foreground">Share Your Feedback</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close feedback form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 px-5">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-3">
              <Heart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-foreground">Thank you for your feedback!</p>
            <p className="text-xs text-muted-foreground mt-1">It helps us build a better platform.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
            {/* Category Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                What are you giving feedback on?
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      category === cat.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    )}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Which area? <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AREAS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setArea(area === a.value ? null : a.value)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                      area === a.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tell us more:
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your experience... (at least 10 characters)"
                className={cn(
                  'w-full h-28 px-3 py-2 rounded-lg text-sm resize-none',
                  'border border-neutral-200 dark:border-neutral-700',
                  'bg-white dark:bg-neutral-800',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
                )}
              />
              {content.length > 0 && content.trim().length < 10 && (
                <p className="text-xs text-amber-600 mt-1">
                  Please write at least 10 characters ({10 - content.trim().length} more needed)
                </p>
              )}
            </div>

            {/* Context info */}
            <div className="text-xs text-muted-foreground bg-neutral-50 dark:bg-neutral-800/50 rounded-lg px-3 py-2">
              <p>Page: {window.location.pathname}</p>
              <p>
                {getDeviceType() === 'mobile' ? 'Mobile' : 'Desktop'} ({getViewport()})
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {!submitted && (
          <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isValid && !isSubmitting
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
