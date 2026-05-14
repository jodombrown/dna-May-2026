
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface TimelineMilestone {
  quarter: string;
  title: string;
  items: string[];
  status?: "active" | "upcoming" | "complete";
}

interface PhaseTimelineProps {
  milestones: TimelineMilestone[];
  color?: string;
}

const PhaseTimeline: React.FC<PhaseTimelineProps> = ({ milestones, color = "dna-copper" }) => (
  <section className="py-16 bg-white">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">Phase Timeline</h2>
        <p className="text-lg text-neutral-600">
          Major milestones and deliverables for this phase
        </p>
      </div>
      <div className="space-y-8">
        {milestones.map((milestone, idx) => (
          <Card key={idx} className={`
            hover:shadow-xl transition-all hover:-translate-y-2 border-l-4 
            ${milestone.status === "active" ? `border-l-${color} bg-${color}/5` : "border-l-neutral-300"}
          `}>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={milestone.status === "active" ? `bg-${color}` : "bg-neutral-500"}>
                      {milestone.quarter}
                    </Badge>
                    {milestone.status === "active" && (
                      <Badge variant="outline" className={`border-${color} text-${color}`}>
                        Current Phase
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">{milestone.title}</h3>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  {milestone.status === "active" && (
                    <div className={`w-3 h-3 bg-${color} rounded-full animate-pulse`} />
                  )}
                  <span className="text-sm font-medium text-neutral-600 capitalize">
                    {milestone.status === "active" ? "In Progress" : milestone.status === "complete" ? "Complete" : "Upcoming"}
                  </span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {milestone.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow">
                    <CheckCircle className={`w-5 h-5 ${milestone.status === "active" ? `text-${color}` : "text-neutral-400"}`}/>
                    <span className="text-neutral-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default PhaseTimeline;
