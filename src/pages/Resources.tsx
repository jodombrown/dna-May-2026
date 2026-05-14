
import React, { useState } from 'react';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, FileText, BookOpen, Video, Briefcase, Star } from 'lucide-react';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const resources = [
    {
      id: 1,
      title: "African Market Entry Guide 2024",
      description: "Comprehensive guide to entering African markets with regulatory insights and business strategies",
      category: "guide",
      type: "PDF",
      size: "2.5 MB",
      downloads: 1250,
      rating: 4.8,
      tags: ["Market Research", "Strategy", "Compliance"],
      featured: true,
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 2,
      title: "Investment Due Diligence Toolkit",
      description: "Essential templates and checklists for evaluating African investment opportunities",
      category: "toolkit",
      type: "ZIP",
      size: "15.2 MB",
      downloads: 890,
      rating: 4.9,
      tags: ["Investment", "Due Diligence", "Templates"],
      featured: true,
      icon: <Briefcase className="w-5 h-5" />
    },
    {
      id: 3,
      title: "Building Sustainable Businesses in Africa",
      description: "Video series on creating environmentally and socially sustainable businesses across Africa",
      category: "course",
      type: "Video Course",
      size: "3.2 GB",
      downloads: 567,
      rating: 4.7,
      tags: ["Sustainability", "Business Development", "Video"],
      featured: false,
      icon: <Video className="w-5 h-5" />
    },
    {
      id: 4,
      title: "Diaspora Remittance Optimization Handbook",
      description: "Best practices for optimizing remittance flows and reducing transaction costs",
      category: "handbook",
      type: "PDF",
      size: "1.8 MB",
      downloads: 2100,
      rating: 4.6,
      tags: ["Fintech", "Remittances", "Cost Optimization"],
      featured: false,
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 5,
      title: "African Tech Ecosystem Report",
      description: "Annual report on the state of technology innovation across African countries",
      category: "report",
      type: "PDF",
      size: "8.7 MB",
      downloads: 3400,
      rating: 4.9,
      tags: ["Technology", "Innovation", "Market Analysis"],
      featured: true,
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 6,
      title: "Cross-Border Business Legal Framework",
      description: "Legal considerations and frameworks for conducting business across African borders",
      category: "guide",
      type: "PDF",
      size: "4.1 MB",
      downloads: 756,
      rating: 4.5,
      tags: ["Legal", "Cross-border", "Compliance"],
      featured: false,
      icon: <FileText className="w-5 h-5" />
    }
  ];

  const categories = [
    { id: 'all', label: 'All Resources' },
    { id: 'guide', label: 'Guides' },
    { id: 'toolkit', label: 'Toolkits' },
    { id: 'course', label: 'Courses' },
    { id: 'handbook', label: 'Handbooks' },
    { id: 'report', label: 'Reports' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (resourceId: number) => {
    // Here you would implement the download logic
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-dna-gold fill-current' : 'text-neutral-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <UnifiedHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Knowledge <span className="text-dna-copper">Resources</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Access curated resources, guides, and tools to accelerate your African business ventures
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <Input
              placeholder="Search resources, guides, toolkits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-dna-copper hover:bg-dna-gold" : ""}
                size="sm"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Resources */}
        {selectedCategory === 'all' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Featured Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {resources.filter(r => r.featured).map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow border-dna-copper/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-dna-copper/10 rounded-lg text-dna-copper">
                          {resource.icon}
                        </div>
                        <Badge className="bg-dna-gold text-white">Featured</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 text-sm mb-4">{resource.description}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                      <span>{resource.type}</span>
                      <span>{resource.size}</span>
                      <span>{resource.downloads} downloads</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">{renderStars(resource.rating)}</div>
                      <span className="text-sm text-neutral-600">({resource.rating})</span>
                    </div>
                    <Button 
                      className="w-full bg-dna-copper hover:bg-dna-gold"
                      onClick={() => handleDownload(resource.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Resources */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            {selectedCategory === 'all' ? 'All Resources' : `${categories.find(c => c.id === selectedCategory)?.label}`}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-dna-emerald/10 rounded-lg text-dna-emerald">
                        {resource.icon}
                      </div>
                      {resource.featured && (
                        <Badge className="bg-dna-gold text-white">Featured</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 text-sm mb-4">{resource.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                    <span>{resource.type} • {resource.size}</span>
                    <span>{resource.downloads} downloads</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">{renderStars(resource.rating)}</div>
                    <span className="text-sm text-neutral-600">({resource.rating})</span>
                  </div>
                  
                  <Button 
                    className="w-full bg-dna-emerald hover:bg-dna-forest"
                    onClick={() => handleDownload(resource.id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-lg">No resources found matching your criteria.</p>
            <p className="text-neutral-400 mt-2">Try adjusting your search terms or category filter.</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-dna-forest to-dna-emerald text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Contribute a Resource</h3>
              <p className="text-lg mb-6">
                Share your expertise with the DNA community by contributing valuable resources and insights.
              </p>
              <Button size="lg" className="bg-white text-dna-forest hover:bg-neutral-100">
                Submit Resource
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Resources;
