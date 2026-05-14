
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EventDemoDialogsProps {
  demoExplanationOpen: boolean;
  setDemoExplanationOpen: (open: boolean) => void;
  contactHostDialogOpen: boolean;
  setContactHostDialogOpen: (open: boolean) => void;
  reportEventDialogOpen: boolean;
  setReportEventDialogOpen: (open: boolean) => void;
  viewAllEventsDialogOpen: boolean;
  setViewAllEventsDialogOpen: (open: boolean) => void;
}

const EventDemoDialogs: React.FC<EventDemoDialogsProps> = ({
  demoExplanationOpen,
  setDemoExplanationOpen,
  contactHostDialogOpen,
  setContactHostDialogOpen,
  reportEventDialogOpen,
  setReportEventDialogOpen,
  viewAllEventsDialogOpen,
  setViewAllEventsDialogOpen
}) => {
  return (
    <>
      {/* Demo Explanation Dialog */}
      <Dialog open={demoExplanationOpen} onOpenChange={setDemoExplanationOpen}>
        <DialogContent className="max-w-lg [&>button]:hidden animate-fade-in">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Event Registration - DNA Platform Demo
              <button
                onClick={() => setDemoExplanationOpen(false)}
                className="bg-dna-copper text-white rounded-full p-1.5 hover:bg-dna-copper/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-neutral-600">
              Welcome to DNA's event registration experience! This demo showcases how seamless event discovery and registration will be on our platform.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-neutral-900">What you're experiencing:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Comprehensive event details and venue information</li>
                  <li>• Direct connection to event hosts and organizers</li>  
                  <li>• Integration with DNA's professional network</li>
                  <li>• Streamlined registration for diaspora-focused events</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900">In our live platform, you'll have:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Real-time event registration and payment processing</li>
                  <li>• Calendar integration and event reminders</li>
                  <li>• Networking opportunities with other attendees</li>
                  <li>• Post-event collaboration and follow-up tools</li>
                  <li>• Impact tracking for diaspora community events</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Events Dialog */}
      <Dialog open={viewAllEventsDialogOpen} onOpenChange={setViewAllEventsDialogOpen}>
        <DialogContent className="max-w-lg animate-fade-in">
          <DialogHeader>
            <DialogTitle>View All Events - Coming Soon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-neutral-600">
              The comprehensive events directory will be your gateway to discovering impactful opportunities across the African diaspora.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-neutral-900">What you'll find:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Curated events from verified community leaders</li>
                  <li>• Advanced filtering by sector, region, and impact focus</li>
                  <li>• Networking events, conferences, and workshops</li>
                  <li>• Investment opportunities and pitch competitions</li>
                  <li>• Cultural celebrations and community gatherings</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900">Enhanced features:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Personalized recommendations based on your interests</li>
                  <li>• Calendar integration and smart notifications</li>
                  <li>• Pre-event networking with other attendees</li>
                  <li>• Follow-up collaboration opportunities</li>
                  <li>• Impact measurement and community feedback</li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={() => setViewAllEventsDialogOpen(false)}
              className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Host Dialog */}
      <Dialog open={contactHostDialogOpen} onOpenChange={setContactHostDialogOpen}>
        <DialogContent className="max-w-lg animate-fade-in">
          <DialogHeader>
            <DialogTitle>Contact the Host - Demo Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-neutral-600">
              This feature allows you to reach out directly to event organizers for questions, partnership opportunities, or special requests.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-neutral-900">How it works:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Send direct messages through our secure platform</li>
                  <li>• Share your professional background and interests</li>
                  <li>• Request speaking opportunities or sponsorship info</li>
                  <li>• Ask about accessibility accommodations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900">Why contact hosts:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Network before the event begins</li>
                  <li>• Explore collaboration opportunities</li>
                  <li>• Get insider insights about the agenda</li>
                  <li>• Build meaningful professional relationships</li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={() => setContactHostDialogOpen(false)}
              className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Event Dialog */}
      <Dialog open={reportEventDialogOpen} onOpenChange={setReportEventDialogOpen}>
        <DialogContent className="max-w-lg animate-fade-in">
          <DialogHeader>
            <DialogTitle>Report Event - Community Safety</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-neutral-600">
              Help us maintain a safe and professional environment by reporting events that violate our community standards.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-neutral-900">When to report:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Misleading or fraudulent event information</li>
                  <li>• Inappropriate content or discrimination</li>
                  <li>• Spam or unrelated commercial promotion</li>
                  <li>• Safety concerns or suspicious activity</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900">What happens next:</h4>
                <ul className="text-sm text-neutral-600 space-y-1 mt-1">
                  <li>• Our team reviews all reports within 24 hours</li>
                  <li>• We investigate and take appropriate action</li>
                  <li>• You'll receive updates on the resolution</li>
                  <li>• Reporter identity remains confidential</li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={() => setReportEventDialogOpen(false)}
              className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
            >
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDemoDialogs;
