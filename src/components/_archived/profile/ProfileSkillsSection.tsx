
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sankofa } from '@/components/icons/adinkra';

const ProfileSkillsSection = ({ profile }: any) => (
  <Card className="border-2 border-dna-emerald/20 hover:border-dna-emerald/40 transition-colors">
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sankofa className="w-5 h-5 text-dna-emerald" />
        <h3 className="text-lg font-semibold text-dna-forest">Skills & Impact</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {profile?.skills?.length
          ? profile.skills.map((skill: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="bg-dna-emerald/10 text-dna-forest">{skill}</Badge>
          ))
          : <span className="text-sm text-neutral-500">No skills yet</span>}
      </div>
    </CardContent>
  </Card>
);
export default ProfileSkillsSection;
