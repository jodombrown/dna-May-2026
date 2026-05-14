
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import ProfessionalsTab from './tabs/ProfessionalsTab';
import CommunitiesTab from './tabs/CommunitiesTab';
import OrganizationsTab from './tabs/OrganizationsTab';
import EventsTab from './tabs/EventsTab';

const NetworkingTabs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('professionals');

  const handleSearch = () => {
    // Search logic will be implemented
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Your Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input 
              placeholder="Search professionals, communities, organizations, events..." 
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              className="bg-dna-emerald hover:bg-dna-forest text-white"
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced
            </Button>
          </div>
          <p className="text-sm text-neutral-600">
            Discover diaspora professionals, join purpose-driven communities, and connect with organizations making impact
          </p>
        </CardContent>
      </Card>

      {/* Networking Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="professionals">Professionals</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="professionals">
          <ProfessionalsTab searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="communities">
          <CommunitiesTab searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationsTab searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkingTabs;
