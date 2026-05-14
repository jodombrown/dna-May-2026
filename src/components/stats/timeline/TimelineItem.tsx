import React from 'react';
import { ChevronRight, Calendar, MousePointer2 } from 'lucide-react';

interface TimelineItemProps {
  year: string;
  events: string[];
  isActive: boolean;
  onClick: () => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ year, events, isActive, onClick }) => (
  <div 
    className={`cursor-pointer p-6 rounded-lg transition-all duration-300 relative group shadow-md ${
      isActive ? 'bg-dna-emerald text-white shadow-lg transform scale-105' : 'bg-white/50 hover:bg-white/70 hover:shadow-lg hover:scale-102'
    }`}
    onClick={onClick}
  >
    {/* Click indicator */}
    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="flex items-center gap-1 text-xs">
        <MousePointer2 className="w-3 h-3" />
        <span className={isActive ? 'text-white/70' : 'text-neutral-500'}>Click to explore</span>
      </div>
    </div>
    
    {/* Hover effect border */}
    <div className={`absolute inset-0 rounded-lg border-2 transition-all duration-300 ${
      isActive ? 'border-white/30' : 'border-transparent group-hover:border-dna-emerald/50'
    }`} />
    
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5" />
        <div className="font-bold text-xl">{year}</div>
        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
          isActive ? 'rotate-90' : 'group-hover:translate-x-1'
        }`} />
      </div>
      
      {events.map((event, idx) => (
        <div key={idx} className="text-sm mb-2 flex items-start gap-2">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
            isActive ? 'bg-white' : 'bg-dna-emerald'
          }`} />
          <span>{event}</span>
        </div>
      ))}
      
      {/* Interactive hint */}
      <div className={`mt-3 text-xs opacity-70 flex items-center gap-1 ${
        isActive ? 'text-white' : 'text-neutral-600'
      }`}>
        <span>📖</span>
        <span>Click to read the full story</span>
      </div>
    </div>
  </div>
);

export default TimelineItem;