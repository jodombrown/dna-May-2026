import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Professional } from '@/types/search';
import ProfessionalProfilePreview from './ProfessionalProfilePreview';

interface ConnectDialogsManagerProps {
  // Professional Profile Dialog
  professionalDialogOpen: boolean;
  selectedProfessional: Professional | null;
  onProfessionalDialogChange: (open: boolean) => void;
  onConnect: (professionalId: string) => void;
  onMessage: (professionalId: string, professionalName: string) => void;
  
  // Demo Explanation Dialog
  demoExplanationOpen: boolean;
  onDemoExplanationChange: (open: boolean) => void;
}

const ConnectDialogsManager: React.FC<ConnectDialogsManagerProps> = ({
  professionalDialogOpen,
  selectedProfessional,
  onProfessionalDialogChange,
  onConnect,
  onMessage,
  demoExplanationOpen,
  onDemoExplanationChange
}) => {
  return (
    <>
      {/* Professional Profile Dialog - Enhanced Preview */}
      <Dialog open={professionalDialogOpen} onOpenChange={onProfessionalDialogChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Professional Profile</DialogTitle>
          </DialogHeader>
          {selectedProfessional && (
            <ProfessionalProfilePreview 
              professional={selectedProfessional}
              onConnect={(id) => {
                onConnect(id);
                onProfessionalDialogChange(false);
              }}
              onMessage={(id, name) => {
                onMessage(id, name);
                onProfessionalDialogChange(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Demo Explanation Dialog */}
      <Dialog open={demoExplanationOpen} onOpenChange={onDemoExplanationChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>DNA Platform Demo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-neutral-600">
              Welcome to the DNA platform demo! This prototype showcases our core Connect pillar functionality.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-neutral-900">What you're seeing:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Sample professionals from the African diaspora</li>
                  <li>• Community groups focused on impact areas</li>
                  <li>• Events created by diaspora leaders</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900">In our MVP, you'll have:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Real user profiles with verified credentials</li>
                  <li>• Advanced matching algorithms</li>
                  <li>• Live event registration and management</li>
                  <li>• Direct messaging and video calls</li>
                  <li>• Impact tracking and collaboration tools</li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={() => onDemoExplanationChange(false)}
              className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConnectDialogsManager;
