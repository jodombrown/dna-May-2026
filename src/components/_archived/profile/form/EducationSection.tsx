
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, GraduationCap } from 'lucide-react';

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  description?: string;
}

interface EducationSectionProps {
  education: Education[];
  onEducationChange: (education: Education[]) => void;
}

const DEGREE_TYPES = [
  'High School Diploma',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'PhD/Doctorate',
  'Professional Certificate',
  'Trade Certificate',
  'Other'
];

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1960; year--) {
    years.push(year.toString());
  }
  return years;
};

const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  onEducationChange
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field_of_study: '',
      start_year: '',
      end_year: '',
      description: ''
    };
    onEducationChange([...education, newEducation]);
    setExpandedId(newEducation.id);
  };

  const removeEducation = (id: string) => {
    onEducationChange(education.filter(edu => edu.id !== id));
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onEducationChange(
      education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dna-forest flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-dna-emerald" />
          Education
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {education.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p>No education added yet</p>
            <p className="text-sm">Add your educational background to showcase your qualifications</p>
          </div>
        )}

        {education.map((edu) => (
          <div key={edu.id} className="border rounded-lg p-4 bg-neutral-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 cursor-pointer" onClick={() => toggleExpanded(edu.id)}>
                <h4 className="font-medium text-neutral-900">
                  {edu.institution || 'New Education Entry'}
                </h4>
                {edu.degree && (
                  <p className="text-sm text-neutral-600">
                    {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                    {edu.start_year && edu.end_year && ` (${edu.start_year} - ${edu.end_year})`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(edu.id)}
                >
                  {expandedId === edu.id ? 'Collapse' : 'Edit'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(edu.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {expandedId === edu.id && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">
                      Institution *
                    </Label>
                    <Input
                      placeholder="e.g., Harvard University"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-neutral-700">
                      Degree Type *
                    </Label>
                    <Select
                      value={edu.degree}
                      onValueChange={(value) => updateEducation(edu.id, 'degree', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select degree type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEGREE_TYPES.map((degree) => (
                          <SelectItem key={degree} value={degree}>
                            {degree}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-neutral-700">
                    Field of Study
                  </Label>
                  <Input
                    placeholder="e.g., Computer Science, Business Administration"
                    value={edu.field_of_study}
                    onChange={(e) => updateEducation(edu.id, 'field_of_study', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">
                      Start Year
                    </Label>
                    <Select
                      value={edu.start_year}
                      onValueChange={(value) => updateEducation(edu.id, 'start_year', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select start year" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateYears().map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-neutral-700">
                      End Year
                    </Label>
                    <Select
                      value={edu.end_year}
                      onValueChange={(value) => updateEducation(edu.id, 'end_year', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select end year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        {generateYears().map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-neutral-700">
                    Description (Optional)
                  </Label>
                  <Textarea
                    placeholder="Notable achievements, coursework, or activities..."
                    value={edu.description || ''}
                    onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <Button
          type="button"
          onClick={addEducation}
          variant="outline"
          className="w-full border-dashed border-dna-emerald text-dna-emerald hover:bg-dna-emerald hover:text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </CardContent>
    </Card>
  );
};

export default EducationSection;
