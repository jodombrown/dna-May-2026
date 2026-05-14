import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X, ExternalLink } from 'lucide-react';
import { TimelineDataItem } from './timelineData';

interface TimelineDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTimelineData: TimelineDataItem | undefined;
  activeTimelineYear: string;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
}

const TimelineDialog: React.FC<TimelineDialogProps> = ({
  isOpen,
  onOpenChange,
  activeTimelineData,
  activeTimelineYear,
  onNavigate,
  canNavigatePrev,
  canNavigateNext
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center">
            <DialogTitle className="text-2xl font-bold text-dna-forest">
              {activeTimelineData?.expandedContent.title}
            </DialogTitle>
            <DialogDescription className="text-lg font-semibold text-dna-emerald">
              {activeTimelineYear}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          <p className="text-neutral-700 leading-relaxed text-center">
            {activeTimelineData?.expandedContent.description}
          </p>

          {/* Sources */}
          {activeTimelineData?.expandedContent.sources && activeTimelineData.expandedContent.sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sources</p>
              <ul className="space-y-1">
                {activeTimelineData.expandedContent.sources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-dna-emerald hover:text-dna-forest hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Bottom Navigation */}
          <div className={`mt-8 flex items-center gap-8 justify-center`}>
            {canNavigatePrev && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate('prev')}
                className="flex items-center gap-2 text-dna-emerald hover:text-dna-forest transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 animate-[bounce_1s_ease-in-out_infinite]" style={{animationDirection: 'reverse'}} />
                <span>Previous</span>
              </Button>
            )}

            {canNavigateNext && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate('next')}
                className="flex items-center gap-2 text-dna-emerald hover:text-dna-forest transition-all duration-300"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5 animate-[bounce_1s_ease-in-out_infinite]" />
              </Button>
            )}

            {!canNavigateNext && (
              <Button
                variant="default"
                size="lg"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2 bg-dna-emerald hover:bg-dna-forest transition-all duration-300"
              >
                <span>Close Timeline</span>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimelineDialog;
