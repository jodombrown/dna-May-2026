import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, MapPin, Briefcase, Globe, Target, Calendar, Clock, Users2, Ticket, Handshake, DollarSign, Award, BookOpen, Heart, TrendingUp, MessageSquare, Eye, Share2, Bookmark } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

interface FiveCsCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: string;
  cardData: any;
}

const FiveCsCardModal = ({ isOpen, onClose, cardType, cardData }: FiveCsCardModalProps) => {
  if (!cardData) return null;
  
  const renderConnectContent = () => {
    if (cardData.type === 'professionals') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-dna-emerald to-dna-forest text-white p-6 rounded-lg -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Suggested Connections</h2>
                <p className="text-white/80">People in your network</p>
              </div>
              <Users className="w-8 h-8" />
            </div>
          </div>

          {/* Professional Cards */}
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-r from-dna-emerald/10 to-transparent rounded-xl border-2 border-dna-emerald/30">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-dna-ochre to-dna-gold rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  AO
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1">Dr. Amara Okafor</h3>
                  <p className="text-neutral-600 flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4" /> FinTech Entrepreneur
                  </p>
                  <p className="text-sm text-dna-emerald flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4" /> Lagos → London
                  </p>
                  <p className="text-sm text-neutral-600 mb-4">
                    Building payment infrastructure for Africa. 15+ years in fintech. Stanford MBA. 
                    Previous exits: $45M, $12M. Angel investor in 20+ African startups.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-dna-emerald/20 text-dna-forest text-xs rounded-full">FinTech</span>
                    <span className="px-3 py-1 bg-dna-copper/20 text-dna-copper text-xs rounded-full">Investment</span>
                    <span className="px-3 py-1 bg-dna-gold/20 text-dna-ochre text-xs rounded-full">Mentorship</span>
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-dna-emerald hover:bg-dna-forest">Connect</Button>
                    <Button variant="outline" className="flex-1">View Profile</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-dna-mint/10 to-transparent rounded-xl border-2 border-dna-mint/30">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-dna-sunset to-dna-copper rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  KA
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1">Prof. Kwame Asante</h3>
                  <p className="text-neutral-600 flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4" /> AgriTech Innovator
                  </p>
                  <p className="text-sm text-dna-emerald flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4" /> Accra → Toronto
                  </p>
                  <p className="text-sm text-neutral-600 mb-4">
                    PhD in Agricultural Innovation. Building sustainable farming solutions. 
                    Impacted 50,000+ farmers across West Africa. MIT researcher. TEDx speaker.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-dna-emerald/20 text-dna-forest text-xs rounded-full">AgriTech</span>
                    <span className="px-3 py-1 bg-dna-mint/20 text-dna-forest text-xs rounded-full">Research</span>
                    <span className="px-3 py-1 bg-dna-copper/20 text-dna-copper text-xs rounded-full">Impact</span>
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-dna-emerald hover:bg-dna-forest">Connect</Button>
                    <Button variant="outline" className="flex-1">View Profile</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center p-4 bg-dna-forest/5 rounded-xl">
            <p className="font-semibold text-dna-forest mb-1">50+ professionals in your network</p>
            <Button variant="link" className="text-dna-emerald">View All Connections →</Button>
          </div>
        </div>
      );
    } else if (cardData.type === 'communities') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-dna-forest to-dna-emerald text-white p-6 rounded-lg -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your Communities</h2>
                <p className="text-white/80">Groups you might like</p>
              </div>
              <Globe className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-dna-emerald/10 to-dna-mint/10 rounded-xl border-2 border-dna-emerald/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-dna-emerald to-dna-forest rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2">African Tech Founders</h3>
                  <p className="text-sm text-neutral-600 mb-3">Connect with fellow tech entrepreneurs building the future of Africa</p>
                  <p className="text-sm text-neutral-500">2,847 members • 156 online now</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-dna-emerald/20 text-dna-forest text-sm rounded-full">Technology</span>
                <span className="px-3 py-1 bg-dna-mint/20 text-dna-forest text-sm rounded-full">Startups</span>
                <span className="px-3 py-1 bg-dna-copper/20 text-dna-copper text-sm rounded-full">Innovation</span>
              </div>
              <Button className="w-full bg-dna-emerald hover:bg-dna-forest">Join Community</Button>
            </div>

            <div className="p-6 bg-gradient-to-br from-dna-mint/10 to-dna-emerald/10 rounded-xl border-2 border-dna-mint/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-dna-mint to-dna-emerald rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2">Diaspora Investors Network</h3>
                  <p className="text-sm text-neutral-600 mb-3">Network with investors funding African development and innovation</p>
                  <p className="text-sm text-neutral-500">1,523 members • 89 online now</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-dna-copper/20 text-dna-copper text-sm rounded-full">Investment</span>
                <span className="px-3 py-1 bg-dna-gold/20 text-dna-ochre text-sm rounded-full">Finance</span>
                <span className="px-3 py-1 bg-dna-emerald/20 text-dna-forest text-sm rounded-full">Impact</span>
              </div>
              <Button className="w-full bg-dna-mint hover:bg-dna-emerald">Join Community</Button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-dna-mint to-dna-emerald text-white p-6 rounded-lg -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Opportunities For You</h2>
                <p className="text-white/80">Matched to your profile</p>
              </div>
              <Target className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-dna-gold/10 to-dna-copper/10 rounded-xl border-2 border-dna-gold/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-xl mb-1">Senior Product Designer</h3>
                  <p className="text-neutral-600">Flutterwave • Remote</p>
                </div>
                <span className="px-3 py-1.5 bg-dna-emerald/20 text-dna-forest text-sm font-semibold rounded-full">95% Match</span>
              </div>
              <p className="text-neutral-600 mb-4">
                Join Flutterwave, Africa's leading payment infrastructure company. We're building the future of commerce across the continent. 
                Work with a world-class team on products used by millions.
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded">$120K-$150K</span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded">Full-time</span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded">Health Benefits</span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded">Equity</span>
              </div>
              <Button className="w-full bg-dna-gold hover:bg-dna-copper">Apply Now</Button>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderConveneContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-dna-sunset to-dna-copper text-white p-6 rounded-lg -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{cardData.title}</h2>
            <p className="text-white/80">{cardData.subtitle}</p>
          </div>
          <Calendar className="w-8 h-8" />
        </div>
      </div>

      <div className="h-48 bg-gradient-to-br from-dna-sunset via-dna-copper to-dna-gold rounded-lg relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-4 right-4">
          <span className="px-4 py-2 bg-white/90 backdrop-blur text-dna-sunset font-semibold rounded-full">Featured Event</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-dna-copper mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold">Lagos, Nigeria</p>
            <p className="text-sm text-neutral-600">Eko Convention Center, Victoria Island</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-dna-copper mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold">March 15-17, 2025</p>
            <p className="text-sm text-neutral-600">9:00 AM - 6:00 PM WAT (All three days)</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Users2 className="w-5 h-5 text-dna-copper mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold">250+ attendees registered</p>
            <p className="text-sm text-neutral-600">150 spots remaining</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-dna-sunset/10 rounded-xl">
        <h4 className="font-bold mb-3">About This Event</h4>
        <p className="text-sm text-neutral-700 mb-4">
          Africa's premier technology conference bringing together founders, investors, and innovators. 
          Three days of keynotes, workshops, networking, and deal-making. Featured speakers include 
          top tech leaders and investors shaping Africa's digital economy.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-dna-sunset/20 text-dna-sunset text-sm rounded-full">Conference</span>
          <span className="px-3 py-1 bg-dna-copper/20 text-dna-copper text-sm rounded-full">Technology</span>
          <span className="px-3 py-1 bg-dna-gold/20 text-dna-ochre text-sm rounded-full">Networking</span>
        </div>
      </div>

      <Button className="w-full bg-dna-sunset hover:bg-dna-copper text-white py-6">
        <Ticket className="w-5 h-5 mr-2" />
        Register Now - $199
      </Button>
    </div>
  );

  const renderCollaborateContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-dna-copper to-dna-gold text-white p-6 rounded-lg -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Active Projects</h2>
            <p className="text-white/80">Live collaborations</p>
          </div>
          <Handshake className="w-8 h-8" />
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-dna-emerald/10 to-dna-copper/10 rounded-xl border-2 border-dna-emerald/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-2xl">Solar Education Initiative</h3>
              <span className="px-3 py-1 bg-dna-emerald text-white text-sm rounded-full">Active</span>
            </div>
            <p className="text-neutral-600 mb-4">
              Bringing sustainable solar energy to rural schools across East Africa. 
              Empowering education through clean power.
            </p>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-600">Overall Progress</span>
              <span className="font-bold text-dna-copper">68%</span>
            </div>
            <Progress value={68} className="h-3" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-dna-copper/10 rounded-xl">
            <Users className="w-6 h-6 mx-auto mb-2 text-dna-copper" />
            <p className="text-2xl font-bold mb-1">12</p>
            <p className="text-xs text-neutral-600">Team Members</p>
          </div>
          <div className="text-center p-4 bg-dna-gold/10 rounded-xl">
            <Target className="w-6 h-6 mx-auto mb-2 text-dna-ochre" />
            <p className="text-2xl font-bold mb-1">6</p>
            <p className="text-xs text-neutral-600">Countries</p>
          </div>
          <div className="text-center p-4 bg-dna-emerald/10 rounded-xl">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-dna-emerald" />
            <p className="text-2xl font-bold mb-1">$2.3M</p>
            <p className="text-xs text-neutral-600">Pooled</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border mb-6">
          <h4 className="font-bold mb-3">Impact Metrics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Schools Powered</span>
              <span className="font-semibold">24 / 35</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Students Impacted</span>
              <span className="font-semibold">8,400+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">CO₂ Saved (tons)</span>
              <span className="font-semibold">145</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-dna-emerald to-dna-forest rounded-full border-2 border-white"></div>
          <div className="w-10 h-10 bg-gradient-to-br from-dna-copper to-dna-gold rounded-full border-2 border-white -ml-3"></div>
          <div className="w-10 h-10 bg-gradient-to-br from-dna-sunset to-dna-copper rounded-full border-2 border-white -ml-3"></div>
          <span className="text-sm text-neutral-600 ml-1">+9 collaborators</span>
        </div>
        
        <Button className="w-full bg-dna-copper hover:bg-dna-gold py-6">View Full Project Details</Button>
      </div>
    </div>
  );

  const renderContributeContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-dna-emerald to-dna-forest text-white p-6 rounded-lg -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Your Impact Summary</h2>
            <p className="text-white/80">Total contribution overview</p>
          </div>
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      <div className="text-center p-8 bg-gradient-to-br from-dna-emerald/10 to-dna-mint/10 rounded-lg border-2 border-dna-emerald/30">
        <p className="text-neutral-600 mb-3">Total Contributions</p>
        <p className="text-5xl font-bold text-dna-emerald mb-2">$127,500</p>
        <p className="text-sm text-dna-forest">+$15,000 this month</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-gradient-to-br from-dna-mint/20 to-dna-emerald/20 rounded-xl text-center border-2 border-dna-mint/30">
          <p className="text-4xl font-bold text-dna-emerald mb-2">8,847</p>
          <p className="text-sm text-neutral-600">Lives Impacted</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-dna-copper/20 to-dna-gold/20 rounded-xl text-center border-2 border-dna-copper/30">
          <p className="text-4xl font-bold text-dna-copper mb-2">23</p>
          <p className="text-sm text-neutral-600">Projects Funded</p>
        </div>
      </div>

      <div className="p-6 bg-dna-gold/10 rounded-xl border border-dna-gold/30">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-lg">Contribution Breakdown</h4>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Financial</span>
              <span className="font-semibold text-dna-emerald">65%</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Skills/Time</span>
              <span className="font-semibold text-dna-copper">25%</span>
            </div>
            <Progress value={25} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Advocacy</span>
              <span className="font-semibold text-dna-ochre">10%</span>
            </div>
            <Progress value={10} className="h-2" />
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-r from-dna-sunset/10 to-dna-copper/10 rounded-xl border border-dna-sunset/30">
        <div className="flex items-start gap-3">
          <Award className="w-6 h-6 text-dna-sunset flex-shrink-0 mt-1" />
          <div>
            <p className="font-bold text-lg mb-1">Recent Milestone Achieved!</p>
            <p className="text-base font-semibold text-dna-sunset mb-2">Solar Education Launch Complete</p>
            <p className="text-sm text-neutral-600">Your $15,000 contribution helped power 12 schools in rural Kenya, impacting 3,200 students.</p>
          </div>
        </div>
      </div>

      <Button className="w-full bg-dna-emerald hover:bg-dna-forest py-6">Explore More Pathways</Button>
    </div>
  );

  const renderConveyContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-dna-ochre to-dna-gold text-white p-6 rounded-lg -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{cardData.title}</h2>
            <p className="text-white/80">{cardData.category} • {cardData.readTime}</p>
          </div>
          <Award className="w-8 h-8" />
        </div>
      </div>

      <div className="h-56 bg-gradient-to-br from-dna-emerald via-dna-mint to-dna-forest rounded-lg mb-6"></div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 bg-dna-emerald/10 text-dna-emerald text-sm rounded-full">Tech & Innovation</span>
          <span className="text-sm text-neutral-500">• 5 min read</span>
        </div>

        <h3 className="text-3xl font-bold">{cardData.title}</h3>
        
        <p className="text-neutral-700 leading-relaxed">
          In a remarkable achievement for the African diaspora community, a new innovation hub has successfully 
          empowered over 500 entrepreneurs across West Africa. The hub, funded primarily by diaspora investors, 
          provides mentorship, capital access, and networking opportunities to early-stage startups.
        </p>

        <p className="text-neutral-700 leading-relaxed">
          "This is exactly what the ecosystem needed," says founder Adaeze Nwosu. "By connecting diaspora 
          expertise with local talent, we're creating a multiplier effect that transforms communities."
        </p>

        <div className="p-5 bg-dna-emerald/10 rounded-xl border-l-4 border-dna-emerald">
          <p className="italic text-neutral-700">
            "The diaspora isn't just sending money home anymore. We're building institutions, transferring knowledge, 
            and creating sustainable impact that will benefit generations to come."
          </p>
          <p className="text-sm text-neutral-600 mt-2">Dr. Kwame Mensah, Program Director</p>
        </div>

        <p className="text-neutral-700 leading-relaxed">
          The initiative has attracted $12M in funding and created partnerships with 15 international tech companies. 
          Success stories include a fintech startup that recently raised $2M and an agritech platform serving 
          10,000+ farmers.
        </p>

        <div className="flex items-center gap-6 py-6 border-y">
          <button className="flex items-center gap-2 text-neutral-700 hover:text-dna-sunset transition-colors">
            <Heart className="w-5 h-5" />
            <span className="font-semibold">1.2K</span>
          </button>
          <button className="flex items-center gap-2 text-neutral-700 hover:text-dna-copper transition-colors">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold">340</span>
          </button>
          <button className="flex items-center gap-2 text-neutral-700 hover:text-dna-ochre transition-colors">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">15.3K</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-dna-ochre to-dna-gold rounded-full"></div>
            <div>
              <p className="font-semibold">Adaeze Nwosu</p>
              <p className="text-sm text-neutral-500">Tech Reporter • DNA Network</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const getModalContent = () => {
    switch (cardType) {
      case 'connect':
        return renderConnectContent();
      case 'convene':
        return renderConveneContent();
      case 'collaborate':
        return renderCollaborateContent();
      case 'contribute':
        return renderContributeContent();
      case 'convey':
        return renderConveyContent();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {getModalContent()}
      </DialogContent>
    </Dialog>
  );
};

export default FiveCsCardModal;
