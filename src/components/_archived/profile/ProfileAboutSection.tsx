
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

const ProfileAboutSection = ({ profile }: any) => (
  <Card className="border-2 border-dna-mint/20 hover:border-dna-mint/40 transition-colors">
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-dna-coral" />
        <h3 className="text-xl font-semibold text-dna-forest">About</h3>
      </div>
      <p className="text-neutral-700">
        {profile?.bio || "Your biography and professional story will show here. Share your journey, values, and what drives your impact."}
      </p>
    </CardContent>
  </Card>
);
export default ProfileAboutSection;
