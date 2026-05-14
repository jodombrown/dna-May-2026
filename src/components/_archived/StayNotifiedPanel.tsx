
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import NotificationBenefits from './StayNotifiedPanel/NotificationBenefits';
import NotificationForm from './StayNotifiedPanel/NotificationForm';

interface StayNotifiedPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const StayNotifiedPanel: React.FC<StayNotifiedPanelProps> = ({ isOpen, onClose }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-2xl font-bold text-dna-forest flex items-center gap-2">
              <Bell className="h-6 w-6 text-dna-emerald" />
              Stay Notified
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-6">
              <NotificationBenefits />
              <NotificationForm onClose={onClose} />

              <p className="text-center text-sm text-neutral-500">
                We respect your privacy. Your information will only be used to notify you about our platform launch. 
                During the Prototyping and Building Phase, emails will come from our mother company{' '}
                <a 
                  href="https://www.Roadmap.Africa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-dna-emerald hover:text-dna-forest underline"
                >
                  Roadmap.Africa
                </a>.
              </p>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StayNotifiedPanel;
