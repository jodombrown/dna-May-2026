
import React from "react";

const ProfileStatsSection = ({ profile }: any) => (
  <div className="grid grid-cols-3 gap-6 text-center mb-8">
    <div className="bg-white/10 rounded-lg p-6">
      <div className="text-2xl font-bold text-dna-emerald">{profile?.connections_count || 0}</div>
      <div className="text-sm text-dna-forest">Connections</div>
    </div>
    <div className="bg-white/10 rounded-lg p-6">
      <div className="text-2xl font-bold text-dna-copper">{profile?.projects_count || 0}</div>
      <div className="text-sm text-dna-forest">Projects</div>
    </div>
    <div className="bg-white/10 rounded-lg p-6">
      <div className="text-2xl font-bold text-dna-gold">{profile?.years_experience || 0}</div>
      <div className="text-sm text-dna-forest">Years Experience</div>
    </div>
  </div>
);
export default ProfileStatsSection;
