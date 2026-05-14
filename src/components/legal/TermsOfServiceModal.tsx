import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-dna-forest">
              Terms of Service
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full hover:bg-dna-emerald/10"
            >
              <X className="h-4 w-4 text-neutral-500 hover:text-dna-emerald" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="p-6 max-h-[70vh]">
          <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">1. Acceptance of Terms</h3>
              <p>
                By accessing and using the Diaspora Network of Africa (DNA) platform, you accept and 
                agree to be bound by the terms and provision of this agreement.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">2. Platform Purpose</h3>
              <p>
                DNA is a platform designed to connect, collaborate, and contribute to Africa&apos;s development 
                by empowering the global African diaspora and its allies through professional networking, 
                project collaboration, and knowledge sharing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">3. User Responsibilities</h3>
              <p className="mb-3">As a user of DNA, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the platform for lawful purposes only</li>
                <li>Respect other users and maintain professional conduct</li>
                <li>Not engage in spam, harassment, or fraudulent activities</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">4. Intellectual Property</h3>
              <p>
                The DNA platform and its original content, features, and functionality are owned by 
                Diaspora Network of Africa and are protected by international copyright, trademark, 
                patent, trade secret, and other intellectual property laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">5. User Content</h3>
              <p className="mb-3">
                You retain ownership of content you post on DNA, but grant us a license to use, 
                display, and distribute your content on the platform. You represent that:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You own or have necessary rights to the content you post</li>
                <li>Your content does not violate any third-party rights</li>
                <li>Your content complies with these Terms of Service</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">6. Privacy and Data Protection</h3>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs 
                your use of the platform, to understand our practices.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">7. Limitation of Liability</h3>
              <p>
                DNA shall not be liable for any indirect, incidental, special, consequential, or 
                punitive damages resulting from your use of the platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">8. Termination</h3>
              <p>
                We may terminate or suspend your account and access to the platform immediately, 
                without prior notice, for conduct that we believe violates these Terms of Service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">9. Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of 
                any material changes via email or platform notification.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">10. Contact Information</h3>
              <p>
                Questions about the Terms of Service should be sent to us at:{' '}
                <a href="mailto:legal@diasporanetwork.africa" className="text-dna-emerald hover:underline">
                  legal@diasporanetwork.africa
                </a>
              </p>
            </div>

            <div className="border-t pt-4 mt-6">
              <p className="text-xs text-neutral-500">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceModal;