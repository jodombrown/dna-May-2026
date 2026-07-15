
import React, { useState } from 'react';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Award, ArrowRight } from 'lucide-react';

const Programs = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const programs = [
    {
      id: 1,
      title: "African Innovation Accelerator",
      description: "12-week intensive program for early-stage African startups with mentorship from diaspora professionals",
      category: "accelerator",
      duration: "12 weeks",
      participants: "20 startups",
      nextCohort: "March 2024",
      applicationDeadline: "February 15, 2024",
      benefits: ["$50K funding", "Mentorship", "Network access", "Demo day"],
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop"
    },
    {
      id: 2,
      title: "Diaspora Leadership Fellowship",
      description: "6-month leadership development program for African diaspora professionals",
      category: "fellowship",
      duration: "6 months",
      participants: "50 fellows",
      nextCohort: "April 2024",
      applicationDeadline: "March 1, 2024",
      benefits: ["Leadership training", "African immersion", "Project funding", "Certificate"],
      image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=250&fit=crop"
    },
    {
      id: 3,
      title: "Tech Skills Bootcamp",
      description: "Intensive coding bootcamp focused on African market solutions",
      category: "bootcamp",
      duration: "16 weeks",
      participants: "30 students",
      nextCohort: "May 2024",
      applicationDeadline: "April 10, 2024",
      benefits: ["Job placement", "Industry projects", "Certification", "Mentorship"],
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop"
    },
    {
      id: 4,
      title: "Women in African Tech Initiative",
      description: "Empowering women entrepreneurs across African tech ecosystems",
      category: "initiative",
      duration: "9 months",
      participants: "40 women",
      nextCohort: "June 2024",
      applicationDeadline: "May 20, 2024",
      benefits: ["Funding access", "Female mentors", "Networking", "Pitch training"],
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop"
    }
  ];

  const categories = [
    { id: 'all', label: 'All Programs' },
    { id: 'accelerator', label: 'Accelerators' },
    { id: 'fellowship', label: 'Fellowships' },
    { id: 'bootcamp', label: 'Bootcamps' },
    { id: 'initiative', label: 'Initiatives' }
  ];

  const filteredPrograms = selectedCategory === 'all' 
    ? programs 
    : programs.filter(program => program.category === selectedCategory);

  const handleApply = (programId: number) => {
    // Here you would implement the application logic
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <UnifiedHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Professional Development <span className="text-dna-copper">Programs</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Accelerate your impact through world-class programs designed for African diaspora professionals and African innovators
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id ? "bg-dna-copper hover:bg-dna-gold" : ""}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-3 right-3 bg-dna-emerald text-white">
                  {program.category.charAt(0).toUpperCase() + program.category.slice(1)}
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl text-neutral-900">{program.title}</CardTitle>
                <p className="text-neutral-600">{program.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-neutral-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {program.duration}
                  </div>
                  <div className="flex items-center text-neutral-600">
                    <Users className="w-4 h-4 mr-2" />
                    {program.participants}
                  </div>
                  <div className="flex items-center text-neutral-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Starts: {program.nextCohort}
                  </div>
                  <div className="flex items-center text-dna-copper font-medium">
                    <Award className="w-4 h-4 mr-2" />
                    Apply by: {program.applicationDeadline}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Program Benefits:</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.benefits.map((benefit, index) => (
                      <Badge key={index} variant="secondary">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    className="flex-1 bg-dna-copper hover:bg-dna-gold"
                    onClick={() => handleApply(program.id)}
                  >
                    Apply Now
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-dna-forest to-dna-emerald text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Impact?</h3>
              <p className="text-lg mb-6">
                Join thousands of African diaspora professionals who are making a difference through our programs.
              </p>
              <Button size="lg" className="bg-white text-dna-forest hover:bg-neutral-100">
                Join the Waitlist
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Programs;
