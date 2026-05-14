import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import ConnectTabs from '@/components/connect/ConnectTabs';
import FeedbackPanel from '@/components/FeedbackPanel';
import PrototypeNotice from '@/components/connect/PrototypeNotice';
import SearchSection from '@/components/connect/search/SearchSection';
import { useConnectFiltering } from '@/hooks/useConnectFiltering';
import { Tabs } from '@/components/ui/tabs';
import PageSpecificSurvey from '@/components/survey/PageSpecificSurvey';
import { mockProfessionals } from '@/components/connect/tabs/ProfessionalsMockData';
import { demoCommunities, demoEvents } from '@/data/demoSearchData';
import { PageSEO } from '@/components/seo/PageSEO';
import { useToast } from '@/hooks/use-toast';

const ConnectExample = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  
  const [isFeedbackPanelOpen, setIsFeedbackPanelOpen] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('professionals');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    location: '',
    skills: [],
    isMentor: false,
    isInvestor: false,
    lookingForOpportunities: false
  });

// Handle search parameter from URL
useEffect(() => {
  const queryParam = searchParams.get('q');
  const tabParam = searchParams.get('tab');
  const locationParam = searchParams.get('location');
  if (queryParam) {
    setSearchTerm(queryParam);
  }
  if (tabParam) {
    setActiveTab(tabParam);
  }
  if (locationParam) {
    setFilters((prev) => ({ ...prev, location: locationParam }));
  }
}, [searchParams]);


  const filteredData = useConnectFiltering(searchTerm, filters);

  // Calculate filtered counts based on search results
  const getFilteredCounts = () => {
    return {
      professionals: filteredData.professionals.length,
      communities: filteredData.communities.length,
      events: filteredData.events.length
    };
  };

  // Navigate to full Connect experience for actual functionality
  const handleConnect = (professionalId: string) => {
    toast({
      title: 'Sign in required',
      description: 'Create an account to connect with professionals.',
    });
    navigate('/auth?redirect=/dna/connect/discover');
  };

  const handleMessage = (recipientId: string, recipientName: string) => {
    toast({
      title: 'Sign in required',
      description: `Create an account to message ${recipientName}.`,
    });
    navigate('/auth?redirect=/dna/messages');
  };

  const handleJoinCommunity = () => {
    toast({
      title: 'Communities coming soon',
      description: 'Community features are under development.',
    });
  };

  const handleRegisterEvent = () => {
    navigate('/dna/convene');
  };

const getConnectionStatus = (professionalId: string) => {
  return { status: 'not_connected' };
};

const handleApplyPreset = (preset: { searchTerm: string; tab?: string; filters?: any }) => {
  setSearchTerm(preset.searchTerm);
  if (preset.filters) setFilters((prev) => ({ ...prev, ...preset.filters }));
  if (preset.tab) setActiveTab(preset.tab);
  const params: Record<string, string> = { q: preset.searchTerm };
  if (preset.tab) params.tab = preset.tab;
  if (preset.filters?.location) params.location = preset.filters.location;
  setSearchParams(params, { replace: true });
};

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageSEO
        title="Connect: Network with African Diaspora Professionals"
        description="Build your professional network with 200M+ African diaspora members worldwide. Find mentors, investors, and collaborators across industries and continents."
        keywords={['african professional network', 'diaspora networking', 'african mentors', 'diaspora investors']}
        canonicalPath="/connect"
      />
      <PrototypeNotice />
      
      <main className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-6 sm:py-8 pt-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-16 z-20 bg-neutral-50 pb-4 pt-2 shadow-sm">
            <SearchSection
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={() => {}} // Search is automatic via real-time filtering
              onClearSearch={() => setSearchTerm('')}
              loading={false}
              filters={filters}
              onFiltersChange={setFilters}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              resultCounts={getFilteredCounts()}
              onApplyPreset={handleApplyPreset}
            />
          </div>
          
          <ConnectTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            professionals={filteredData.professionals}
            communities={filteredData.communities}
            events={filteredData.events}
            onConnect={handleConnect}
            onMessage={handleMessage}
            onJoinCommunity={handleJoinCommunity}
            onRegisterEvent={handleRegisterEvent}
            getConnectionStatus={getConnectionStatus}
            isLoggedIn={false}
            onRefresh={() => {}} // Remove console.log
          />
        </Tabs>
        
        {/* Page-specific Survey CTA */}
        <div className="mt-12 bg-gradient-to-r from-dna-emerald/10 via-dna-copper/10 to-dna-gold/10 rounded-xl p-8 text-center border border-dna-emerald/20">
          <h3 className="text-2xl font-bold text-dna-forest mb-4">
            Help Us Build Better Networking
          </h3>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Share your thoughts on how you connect with the diaspora community. 
            Your feedback will directly shape our networking features and user experience.
          </p>
          <button
            onClick={() => setIsSurveyOpen(true)}
            className="bg-dna-emerald hover:bg-dna-forest text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Share Your Connect Experience
          </button>
        </div>
      </main>

      {/* Mobile navigation handled by global MobileNavigation component */}
      <Footer />
      
      
      <FeedbackPanel 
        isOpen={isFeedbackPanelOpen}
        onClose={() => setIsFeedbackPanelOpen(false)}
        pageType="connect"
      />
      
      <PageSpecificSurvey
        isOpen={isSurveyOpen}
        onClose={() => setIsSurveyOpen(false)}
        pageType="connect"
      />
      
    </div>
  );
};

export default ConnectExample;