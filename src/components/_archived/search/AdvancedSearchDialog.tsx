
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchFeaturePreview from './SearchFeaturePreview';
import SearchFeedbackForm from './SearchFeedbackForm';

interface AdvancedSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvancedSearchDialog: React.FC<AdvancedSearchDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-[500px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-dna-emerald" />
              Advanced Search Features
            </SheetTitle>
            <SheetDescription>
              Discover how our advanced search will help you find the perfect connections in the African diaspora network.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-6">
              <SearchFeaturePreview />
              <SearchFeedbackForm onClose={onClose} />

              <div className="bg-neutral-50 p-4 rounded-lg text-center">
                <p className="text-sm text-neutral-600">
                  Want to try the current search functionality?
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2 w-full"
                  onClick={() => {
                    onClose();
                    navigate('/search');
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Go to Search Page
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedSearchDialog;
