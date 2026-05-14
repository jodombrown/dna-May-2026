import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users2, Calendar, FolderKanban, Heart, MessageSquare, Brain } from "lucide-react";

const PlatformOverview = () => {
  const pillars = [
    {
      icon: Users2,
      color: "text-blue-500",
      name: "CONNECT: Find Your People",
      description: "Discover members based on heritage, identity, skills, interests, and purpose. Build meaningful relationships that unlock collaboration, opportunity, and community.",
    },
    {
      icon: Calendar,
      color: "text-copper-500",
      name: "CONVENE: Gather with Purpose",
      description: "Host or join events across the diaspora (virtual, in-person, or hybrid). Every gathering becomes a moment of connection, discovery, and movement.",
    },
    {
      icon: FolderKanban,
      color: "text-yellow-500",
      name: "COLLABORATE: Build What Matters",
      description: "Spaces and projects bring people together to do real work. Tasks, boards, events, updates: everything needed to turn ideas into progress.",
    },
    {
      icon: Heart,
      color: "text-green-500",
      name: "CONTRIBUTE: Support Each Other",
      description: "Needs and Offers match people who need help with those ready to support. Contributions become visible, validated, and celebrated.",
    },
    {
      icon: MessageSquare,
      color: "text-red-500",
      name: "CONVEY: Share Stories & Impact",
      description: "Updates and stories create a living narrative of diaspora mobilization. Your journey becomes part of our collective story.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            The DNA Platform
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            The mobilization engine for the global African diaspora.
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-lg max-w-none text-foreground/90">
          <p className="text-lg leading-relaxed">
            When millions of people across the global African world each take small actions (connect, gather, collaborate, contribute, share), something extraordinary happens. DNA exists to organize that energy into a coordinated, global force for progress.
          </p>
          <p className="text-lg leading-relaxed mt-4">
            DNA is built around the <strong>5 Pillars of Mobilization</strong>:
          </p>
        </div>

        {/* Pillars */}
        <div className="space-y-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-muted ${pillar.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {pillar.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* DIA Section */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-3 text-foreground">
                Powered by DIA
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The Diaspora Intelligence Agent personalizes everything. You see the people, spaces, events, and opportunities that matter most.
              </p>
            </div>
          </div>
        </Card>

        {/* Why DNA Exists */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-3xl font-bold text-foreground">
            💫 Why DNA Exists
          </h2>
          <div className="prose prose-lg max-w-2xl mx-auto text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Because the African diaspora is powerful, but disconnected.
            </p>
            <p className="text-lg leading-relaxed">
              DNA reconnects us.<br />
              Organizes us.<br />
              Mobilizes us.<br />
              And gives us one place to move together.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link to="/documentation/features">
            <Button size="lg" className="text-lg px-8">
              Explore All Features →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlatformOverview;
