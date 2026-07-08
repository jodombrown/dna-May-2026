import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, Users, MessageSquare, Lightbulb, Briefcase, MessageCircle } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PageSEO } from '@/components/seo/PageSEO';
import { config } from '@/lib/config';
import { MateMasie } from '@/components/icons/adinkra';

const Contact = () => {
  useScrollToTop();
  const navigate = useNavigate();
  
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: ''
  });

  const inquiryTypes = [
    { id: 'general', label: 'General Inquiry', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'partnership', label: 'Partnership', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'feedback', label: 'Platform Feedback', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'community', label: 'Community Building', icon: <Users className="w-4 h-4" /> }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Let's Connect on WhatsApp",
      detail: "Join our community chat",
      description: "Have a question or ready to get involved? Chat with our team directly.",
      onClick: () => setShowWhatsAppModal(true)
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Us",
      detail: "aweh@diasporanetwork.africa",
      description: "For general inquiries and support"
    },
    {
      icon: <MateMasie className="w-6 h-6" />,
      title: "Join the DNA Community",
      detail: "Be the first to connect",
      description: "Get early access to our platform and exclusive community events",
      component: 'waitlist'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInquiryTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, inquiryType: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        description: "Name, email, and message are required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        inquiryType: ''
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact DNA',
    description: 'Get in touch with the Diaspora Network of Africa team.',
    mainEntity: {
      '@type': 'Organization',
      name: 'Diaspora Network of Africa',
      email: config.emails.support,
      url: config.APP_URL,
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title="Contact DNA: Partner With the African Diaspora Network"
        description="Connect with DNA for partnerships, community building, or platform feedback. Join our WhatsApp community or email us to advance Africa's development together."
        keywords={[
          'contact diaspora network',
          'DNA partnership',
          'african diaspora contact',
          'collaborate with DNA',
        ]}
        canonicalPath="/contact"
        structuredData={contactSchema}
      />
      <UnifiedHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dna-mint/20 via-white to-dna-emerald/10 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="bg-dna-copper/10 text-dna-copper border-dna-copper/20 mb-6">
              Get in Touch
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-dna-forest mb-6">
              Let's Build Together
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Whether you have questions, ideas, or want to partner with us, we'd love to hear from you. 
              Let's explore how we can work together to advance Africa's development.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${method.onClick || method.component ? 'cursor-pointer' : ''} ${method.component === 'waitlist' ? 'bg-gradient-to-br from-dna-mint/30 via-dna-mint/20 to-dna-emerald/15' : 'bg-white'}`}
                onClick={method.onClick}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${method.component === 'waitlist' ? 'bg-gradient-to-br from-dna-emerald to-dna-copper text-white animate-pulse' : 'bg-dna-emerald/10 text-dna-emerald'}`}>
                    {method.icon}
                  </div>
                  <h3 className="text-lg font-bold text-dna-forest mb-2">{method.title}</h3>
                  {method.component === 'waitlist' ? (
                    <p className="text-dna-copper font-semibold mb-2">{method.detail}</p>
                  ) : (
                    <p className="text-dna-copper font-semibold mb-2">{method.detail}</p>
                  )}
                  <p className="text-neutral-600 text-sm mb-4">{method.description}</p>
                  {method.onClick && (
                    <Button 
                      onClick={method.onClick}
                      className="bg-dna-copper hover:bg-dna-gold text-white"
                    >
                      Join Our Community
                    </Button>
                  )}
                  {method.component === 'waitlist' && (
                    <Button 
                      className="bg-gradient-to-r from-dna-emerald to-dna-copper hover:from-dna-forest hover:to-dna-gold text-white w-full"
                      onClick={() => navigate('/auth?mode=signup')}
                    >
                      <MateMasie className="w-4 h-4 mr-2" />
                      Join Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Modal */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <MessageCircle className="w-5 h-5 text-dna-copper" />
              Join Our WhatsApp Group
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <img 
                src="/lovable-uploads/dea2fe8e-c718-403d-b6be-24cd5152c4a4.png" 
                alt="WhatsApp QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600 font-medium">
                📱 <strong>On Mobile:</strong> Click the button below to join directly
              </p>
              <p className="text-sm text-neutral-600 font-medium">
                💻 <strong>On Desktop:</strong> Scan the QR code above with your phone's camera or WhatsApp app
              </p>
            </div>
            <Button 
              asChild
              className="bg-dna-copper hover:bg-dna-gold text-white w-full"
            >
              <a 
                href="https://chat.whatsapp.com/GXZrIElj1gY2UZYVm6J8zh" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Click Here to Join WhatsApp Group
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Contact;