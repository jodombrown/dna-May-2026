
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, Video, Users, Calendar, Globe } from 'lucide-react';

interface CollaborationsDialogsProps {
  isStartProjectDialogOpen: boolean;
  setIsStartProjectDialogOpen: (open: boolean) => void;
  isJoinProjectDialogOpen: boolean;
  setIsJoinProjectDialogOpen: (open: boolean) => void;
  isDiscussionDialogOpen?: boolean;
  setIsDiscussionDialogOpen?: (open: boolean) => void;
  isDocumentsDialogOpen?: boolean;
  setIsDocumentsDialogOpen?: (open: boolean) => void;
  isMeetingDialogOpen?: boolean;
  setIsMeetingDialogOpen?: (open: boolean) => void;
}

const CollaborationsDialogs: React.FC<CollaborationsDialogsProps> = ({
  isStartProjectDialogOpen,
  setIsStartProjectDialogOpen,
  isJoinProjectDialogOpen,
  setIsJoinProjectDialogOpen,
  isDiscussionDialogOpen = false,
  setIsDiscussionDialogOpen = () => {},
  isDocumentsDialogOpen = false,
  setIsDocumentsDialogOpen = () => {},
  isMeetingDialogOpen = false,
  setIsMeetingDialogOpen = () => {}
}) => {
  return (
    <>
      {/* Start Project Dialog */}
      <Dialog open={isStartProjectDialogOpen} onOpenChange={setIsStartProjectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-dna-copper" />
              Start a New Project
            </DialogTitle>
            <DialogDescription>
              Launch your collaborative initiative and connect with diaspora professionals worldwide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              This feature will allow you to create and manage collaborative projects with other diaspora professionals. 
              You'll be able to define project goals, recruit team members, and track progress together.
            </p>
            <div className="bg-dna-emerald/10 p-4 rounded-lg border border-dna-emerald/20">
              <p className="text-sm font-medium text-dna-forest mb-2">Coming in MVP Phase:</p>
              <ul className="text-xs text-neutral-700 space-y-1">
                <li>• Project creation workflow</li>
                <li>• Team member recruitment</li>
                <li>• Resource allocation tools</li>
                <li>• Progress tracking dashboard</li>
              </ul>
            </div>
            <Button 
              onClick={() => setIsStartProjectDialogOpen(false)}
              className="w-full bg-dna-copper hover:bg-dna-gold text-white"
            >
              Got it, I'll wait for the MVP!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Project Dialog */}
      <Dialog open={isJoinProjectDialogOpen} onOpenChange={setIsJoinProjectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-dna-emerald" />
              Join Existing Projects
            </DialogTitle>
            <DialogDescription>
              Discover and join ongoing collaborative initiatives that match your skills and interests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Browse active projects from diaspora professionals and contribute your expertise to meaningful initiatives 
              across Africa and the diaspora community.
            </p>
            <div className="bg-dna-emerald/10 p-4 rounded-lg border border-dna-emerald/20">
              <p className="text-sm font-medium text-dna-forest mb-2">Features in Development:</p>
              <ul className="text-xs text-neutral-700 space-y-1">
                <li>• Project discovery dashboard</li>
                <li>• Skill-based matching</li>
                <li>• Application and vetting process</li>
                <li>• Collaborative workspace access</li>
              </ul>
            </div>
            <Button 
              onClick={() => setIsJoinProjectDialogOpen(false)}
              className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
            >
              Understood, notify me when ready!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discussion Dialog */}
      <Dialog open={isDiscussionDialogOpen} onOpenChange={setIsDiscussionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-dna-copper" />
              Join Discussion
            </DialogTitle>
            <DialogDescription>
              Participate in real-time conversations with your project team members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Access team discussions, share updates, brainstorm ideas, and coordinate project activities 
              with your collaborative partners in dedicated chat rooms.
            </p>
            <div className="bg-dna-copper/10 p-4 rounded-lg border border-dna-copper/20">
              <p className="text-sm font-medium text-dna-copper mb-2">Discussion Features:</p>
              <ul className="text-xs text-neutral-700 space-y-1">
                <li>• Real-time messaging</li>
                <li>• File sharing capabilities</li>
                <li>• Voice and video calls</li>
                <li>• Discussion threads by topic</li>
              </ul>
            </div>
            <Button 
              onClick={() => setIsDiscussionDialogOpen(false)}
              className="w-full bg-dna-copper hover:bg-dna-gold text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={isDocumentsDialogOpen} onOpenChange={setIsDocumentsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-dna-emerald" />
              View Documents
            </DialogTitle>
            <DialogDescription>
              Access shared project documents, plans, and collaborative resources.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Browse project documentation, shared resources, meeting notes, and collaborative files 
              organized by your team in a centralized document library.
            </p>
            <div className="bg-dna-emerald/10 p-4 rounded-lg border border-dna-emerald/20">
              <p className="text-sm font-medium text-dna-forest mb-2">Document Management:</p>
              <ul className="text-xs text-neutral-700 space-y-1">
                <li>• Centralized file storage</li>
                <li>• Version control system</li>
                <li>• Collaborative editing tools</li>
                <li>• Document templates library</li>
              </ul>
            </div>
            <Button 
              onClick={() => setIsDocumentsDialogOpen(false)}
              className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Room Dialog */}
      <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-dna-gold" />
              Meeting Room
            </DialogTitle>
            <DialogDescription>
              Join virtual meetings and collaborative sessions with your project team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Participate in scheduled team meetings, impromptu calls, and collaborative work sessions 
              through integrated video conferencing and screen sharing tools.
            </p>
            <div className="bg-dna-gold/10 p-4 rounded-lg border border-dna-gold/20">
              <p className="text-sm font-medium text-dna-gold mb-2">Meeting Features:</p>
              <ul className="text-xs text-neutral-700 space-y-1">
                <li>• HD video conferencing</li>
                <li>• Screen sharing capabilities</li>
                <li>• Meeting recording</li>
                <li>• Calendar integration</li>
              </ul>
            </div>
            <Button 
              onClick={() => setIsMeetingDialogOpen(false)}
              className="w-full bg-dna-gold hover:bg-yellow-600 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CollaborationsDialogs;
