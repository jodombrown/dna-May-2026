
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

const CommunityGroups = () => {
  const groups = [
    {
      name: "African Tech Innovators",
      description: "Connecting technology leaders building solutions for Africa",
      members: 12500,
      category: "Technology",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop",
      trending: true
    },
    {
      name: "Diaspora Investment Circle",
      description: "Investment opportunities and financial literacy for African development",
      members: 8300,
      category: "Finance",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop",
      trending: false
    },
    {
      name: "Women in African Business",
      description: "Empowering women entrepreneurs across the continent and diaspora",
      members: 15600,
      category: "Entrepreneurship",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop",
      trending: true
    },
    {
      name: "Healthcare Innovation Africa",
      description: "Advancing healthcare solutions and medical technology in Africa",
      members: 6800,
      category: "Healthcare",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
      trending: false
    },
    {
      name: "Sustainable Development Goals",
      description: "Collaborative projects addressing Africa's most pressing challenges",
      members: 11200,
      category: "Impact",
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=250&fit=crop",
      trending: true
    },
    {
      name: "African Arts & Culture",
      description: "Celebrating and preserving African heritage through creative industries",
      members: 9400,
      category: "Culture",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
      trending: false
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Join Professional <span className="text-dna-copper">Communities</span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Connect with like-minded professionals in specialized groups focused on Africa's development
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {groups.map((group, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="relative">
                <img
                  src={group.image}
                  alt={group.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {group.trending && (
                  <Badge className="absolute top-3 left-3 bg-dna-copper text-white">
                    Trending
                  </Badge>
                )}
                <Badge 
                  variant="secondary" 
                  className="absolute top-3 right-3 bg-white/90 text-neutral-700"
                >
                  {group.category}
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 text-neutral-900 group-hover:text-dna-copper transition-colors">
                  {group.name}
                </h3>
                <p className="text-neutral-600 mb-4 text-sm leading-relaxed">
                  {group.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-neutral-500">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{group.members.toLocaleString()} members</span>
                  </div>
                </div>
                
                <Button 
                  variant="default"
                  className="w-full"
                >
                  Join Group
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            variant="secondary"
          >
            Explore All Communities
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunityGroups;
