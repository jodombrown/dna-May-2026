
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, ExternalLink } from 'lucide-react';

interface OrganizationsTabProps {
  searchTerm: string;
}

const OrganizationsTab: React.FC<OrganizationsTabProps> = ({ searchTerm }) => {
  // Mock data for organizations
  const organizations = [
    {
      id: '1',
      name: 'African Development Bank',
      type: 'Financial Institution',
      description: 'Promoting sustainable economic development and social progress across Africa.',
      location: 'Abidjan, Côte d\'Ivoire',
      website: 'https://afdb.org',
      focusAreas: ['Infrastructure', 'Financial Inclusion', 'Agriculture'],
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '2',
      name: 'Flutterwave',
      type: 'Technology Company',
      description: 'Building payment infrastructure for Africa and enabling global commerce.',
      location: 'Lagos, Nigeria',
      website: 'https://flutterwave.com',
      focusAreas: ['Fintech', 'Digital Payments', 'E-commerce'],
      image: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '3',
      name: 'Tony Elumelu Foundation',
      type: 'NGO',
      description: 'Empowering African entrepreneurs through mentorship, funding, and business support.',
      location: 'Lagos, Nigeria',
      website: 'https://tonyelumelufoundation.org',
      focusAreas: ['Entrepreneurship', 'Youth Development', 'Economic Empowerment'],
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=150&h=150&fit=crop&crop=face'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-neutral-600">
          Showing {organizations.length} organizations {searchTerm && `matching "${searchTerm}"`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">NGOs</Button>
          <Button variant="outline" size="sm">Startups</Button>
          <Button variant="outline" size="sm">Corporates</Button>
        </div>
      </div>

      <div className="grid gap-6">
        {organizations.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <img
                  src={org.image}
                  alt={org.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-1">{org.name}</CardTitle>
                      <Badge variant="outline" className="mb-2">
                        {org.type}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-neutral-600">
                        <MapPin className="w-4 h-4" />
                        <span>{org.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit
                      </Button>
                      <Button className="bg-dna-emerald hover:bg-dna-forest text-white">
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-neutral-700">{org.description}</p>
              
              <div>
                <div className="text-sm font-medium text-neutral-700 mb-2">Focus Areas</div>
                <div className="flex flex-wrap gap-2">
                  {org.focusAreas.map((area, index) => (
                    <Badge key={index} className="bg-dna-emerald/20 text-dna-emerald">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrganizationsTab;
