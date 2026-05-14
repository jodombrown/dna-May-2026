
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Plus } from 'lucide-react';

interface CommunitiesTabProps {
  searchTerm: string;
}

const CommunitiesTab: React.FC<CommunitiesTabProps> = ({ searchTerm }) => {
  // Mock data for communities with diverse African representation
  const allCommunities = [
    {
      id: '1',
      name: 'African Tech Leaders',
      description: 'A community of senior technology leaders from across the African diaspora sharing insights and opportunities.',
      category: 'Technology',
      memberCount: 450,
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '2',
      name: 'Climate Solutions Africa',
      description: 'Professionals working on climate change solutions and environmental sustainability across Africa.',
      category: 'Environment',
      memberCount: 280,
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '3',
      name: 'African Women in Finance',
      description: 'Empowering African women in financial services through mentorship and professional development.',
      category: 'Finance',
      memberCount: 320,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=150&h=150&fit=crop&crop=face'
    },
    // Additional communities (shown when "View More" is clicked)
    {
      id: '4',
      name: 'Diaspora Investment Circle',
      description: 'Connecting African diaspora investors with high-impact investment opportunities across Africa.',
      category: 'Business',
      memberCount: 890,
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '5',
      name: 'Women in African Tech',
      description: 'Empowering African women in technology through mentorship and networking.',
      category: 'Technology',
      memberCount: 650,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '6',
      name: 'African Healthcare Innovation',
      description: 'Advancing healthcare solutions and medical innovation across Africa.',
      category: 'Healthcare',
      memberCount: 420,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '7',
      name: 'Sustainable Energy Africa',
      description: 'Promoting renewable energy and sustainable development across African communities.',
      category: 'Energy',
      memberCount: 380,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '8',
      name: 'African Creative Industries',
      description: 'Supporting artists, designers, and creative professionals in the diaspora.',
      category: 'Creative',
      memberCount: 720,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '9',
      name: 'Financial Inclusion Africa',
      description: 'Driving financial technology and inclusion initiatives across African markets.',
      category: 'Finance',
      memberCount: 540,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '10',
      name: 'African Agriculture Tech',
      description: 'Modernizing agriculture through technology and sustainable farming practices.',
      category: 'Agriculture',
      memberCount: 310,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '11',
      name: 'African Youth Development',
      description: 'Mentoring and supporting the next generation of African leaders.',
      category: 'Education',
      memberCount: 950,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '12',
      name: 'Pan-African Legal Network',
      description: 'Connecting legal professionals working on African development and policy.',
      category: 'Legal',
      memberCount: 260,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '13',
      name: 'African Media & Communications',
      description: 'Journalists, content creators, and media professionals telling African stories.',
      category: 'Media',
      memberCount: 480,
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face'
    }
  ];

  const [showAll, setShowAll] = React.useState(false);
  const communities = showAll ? allCommunities : allCommunities.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-neutral-600">
          Showing {communities.length} communities {searchTerm && `matching "${searchTerm}"`}
        </p>
        <Button variant="default">
          <Plus className="w-4 h-4 mr-2" />
          Create Community
        </Button>
      </div>

      <div className="grid gap-6">
        {communities.map((community) => (
          <Card key={community.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <img
                  src={community.image}
                  alt={community.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-1">{community.name}</CardTitle>
                      <Badge variant="outline" className="mb-2">
                        {community.category}
                      </Badge>
                      {community.isFeatured && (
                        <Badge className="bg-dna-gold text-white ml-2">Featured</Badge>
                      )}
                    </div>
                    <Button variant="default">
                      Join Community
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-neutral-700">{community.description}</p>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Users className="w-4 h-4" />
                  <span>{community.memberCount.toLocaleString()} members</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Discussions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!showAll && allCommunities.length > 3 && (
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            className="border-dna-emerald text-dna-emerald hover:bg-dna-emerald hover:text-white"
            onClick={() => setShowAll(true)}
          >
            View More Communities ({allCommunities.length - 3} more)
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunitiesTab;
