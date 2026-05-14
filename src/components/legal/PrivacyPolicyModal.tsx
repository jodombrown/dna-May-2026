import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-dna-forest">
              Privacy Policy
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
              <h3 className="text-lg font-semibold text-dna-forest mb-3">1. Information We Collect</h3>
              <p className="mb-3">
                We collect information you provide directly to us, such as when you create an account, 
                join our waitlist, or contact us. This may include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Name and contact information (email address, phone number)</li>
                <li>Professional information (job title, company, industry)</li>
                <li>Location information (city, country)</li>
                <li>Profile information and preferences</li>
                <li>Communication records and feedback</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">2. How We Use Your Information</h3>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and administrative messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Facilitate networking and collaboration opportunities</li>
                <li>Personalize and improve your experience</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">3. Information Sharing</h3>
              <p className="mb-3">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>With service providers who assist us in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
                <li>With your explicit consent for specific purposes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">4. Data Security</h3>
              <p>
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. However, 
                no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">5. Your Rights</h3>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access and update your personal information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Object to processing of your personal information</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-dna-forest mb-3">6. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:{' '}
                <a href="mailto:privacy@diasporanetwork.africa" className="text-dna-emerald hover:underline">
                  privacy@diasporanetwork.africa
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

export default PrivacyPolicyModal;