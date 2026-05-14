// Token exception: arbitrary radius retained for phone mockup geometry.
// Reviewed Phase 5. Do not normalize without design review.
import { useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Share, PlusSquare, CheckCircle2, Globe2, Users, MessageCircle, Heart, ArrowRight, Apple, MonitorSmartphone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { MateMasie } from '@/components/icons/adinkra';

const Install = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ios");

  const betaFeatures = [
    {
      icon: Globe2,
      title: "Feed",
      description: "Share updates and insights with the Sixth Region community"
    },
    {
      icon: Users,
      title: "Connect",
      description: "Build bridges with fellow diaspora members across continents"
    },
    {
      icon: Heart,
      title: "Convey",
      description: "Share your diaspora journey and inspire collective action"
    },
    {
      icon: MessageCircle,
      title: "Messaging",
      description: "Collaborate directly with diaspora professionals worldwide"
    }
  ];

  const iosSteps = [
    {
      step: 1,
      title: "Open in Safari",
      description: "Make sure you're viewing this page in Safari browser"
    },
    {
      step: 2,
      title: "Tap the Share Button",
      description: "Look for the share icon at the bottom of Safari"
    },
    {
      step: 3,
      title: "Add to Home Screen",
      description: "Scroll down and tap 'Add to Home Screen'"
    },
    {
      step: 4,
      title: "Confirm & Launch",
      description: "Tap 'Add' and find DNA on your home screen"
    }
  ];

  const androidSteps = [
    {
      step: 1,
      title: "Open in Chrome",
      description: "View this page in Chrome for the best experience"
    },
    {
      step: 2,
      title: "Tap the Menu",
      description: "Tap the three dots (⋮) in the top right corner"
    },
    {
      step: 3,
      title: "Install App",
      description: "Look for 'Install app' or 'Add to Home screen'"
    },
    {
      step: 4,
      title: "Confirm & Launch",
      description: "Tap 'Install' and find DNA on your home screen"
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative bg-background py-16 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-medium text-primary mb-4 tracking-wide uppercase">
              Beta Now Live
            </p>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Welcome to Africa's
              <br />
              <span className="text-primary">Sixth Region</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join the global African diaspora, descendants, migrants, and allies united 
              to build Africa's future. Add DNA to your home screen and be part of the movement.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button 
                size="lg"
                onClick={() => document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-foreground text-background hover:bg-foreground/90 gap-2 px-6"
              >
                <Apple className="w-5 h-5" />
                Add to Home Screen
              </Button>
            </div>
          </motion.div>

          {/* Phone Mockups */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="flex items-end justify-center gap-4 sm:gap-8">
              {/* Left Phone */}
              <div className="hidden sm:block w-40 lg:w-52 transform -rotate-6 translate-y-8">
                <div className="bg-foreground rounded-[2rem] p-2 shadow-2xl">
                  <div className="bg-background rounded-[1.5rem] overflow-hidden aspect-[9/19]">
                    <div className="h-full bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center p-4">
                      <Users className="w-12 h-12 text-primary mb-3" />
                      <p className="text-xs text-center text-muted-foreground">Discover your network</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Center Phone (Main) */}
              <div className="w-56 sm:w-64 lg:w-72 z-10">
                <div className="bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
                  <div className="bg-background rounded-[2rem] overflow-hidden aspect-[9/19]">
                    <div className="h-full bg-gradient-to-br from-primary/10 to-amber-500/10 flex flex-col items-center justify-center p-6">
                      <img 
                        src="/icons/icon-192.png" 
                        alt="DNA" 
                        className="w-16 h-16 rounded-lg mb-4"
                      />
                      <p className="text-sm font-semibold text-foreground mb-1">DNA</p>
                      <p className="text-xs text-muted-foreground text-center">Diaspora Network of Africa</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Phone */}
              <div className="hidden sm:block w-40 lg:w-52 transform rotate-6 translate-y-8">
                <div className="bg-foreground rounded-[2rem] p-2 shadow-2xl">
                  <div className="bg-background rounded-[1.5rem] overflow-hidden aspect-[9/19]">
                    <div className="h-full bg-gradient-to-br from-amber-500/10 to-primary/5 flex flex-col items-center justify-center p-4">
                      <MessageCircle className="w-12 h-12 text-primary mb-3" />
                      <p className="text-xs text-center text-muted-foreground">Stay connected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Dark Background */}
      <section id="features" className="bg-[hsl(var(--primary))] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary-foreground/70 mb-3 tracking-wide uppercase">
              Features
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary-foreground">
              Explore the DNA Platform
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {betaFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-primary-foreground/15 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary-foreground/20 mb-4">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-primary-foreground/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Install Instructions Section */}
      <section id="install" className="bg-background py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MonitorSmartphone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Install on Your Device
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Get the full app experience. Add DNA to your home screen in just a few taps.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12">
              <TabsTrigger 
                value="ios" 
                className="gap-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Apple className="w-5 h-5" />
                iPhone / iPad
              </TabsTrigger>
              <TabsTrigger 
                value="android" 
                className="gap-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Smartphone className="w-5 h-5" />
                Android
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="space-y-4">
              {iosSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="android" className="space-y-4">
              {androidSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-muted/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">
                About DNA
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Building Africa's Sixth Region
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The African Union recognizes the <strong className="text-foreground">Sixth Region</strong>:
                  all people of African origin living outside the continent who are willing to contribute
                  to Africa's development.
                </p>
                <p>
                  <strong className="text-foreground">Diaspora Network of Africa (DNA)</strong> is the 
                  infrastructure for this global community. We connect descendants of enslaved Africans, 
                  first and second-generation migrants, and all who identify with Africa's future.
                </p>
                <p>
                  Through <span className="text-primary font-medium">connection</span>, 
                  <span className="text-primary font-medium"> collaboration</span>, and 
                  <span className="text-primary font-medium"> contribution</span>, we're mobilizing 
                  talent, capital, and expertise for Africa's transformation.
                </p>
              </div>
              <Button 
                className="mt-6 bg-primary hover:bg-primary/90 gap-2"
                onClick={() => navigate("/auth")}
              >
                Join the Sixth Region
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* About Image/Graphic */}
            <div className="relative">
              <div className="bg-primary/5 rounded-xl p-8 border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-6 shadow-sm text-center">
                    <Globe2 className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">6 Continents</p>
                  </div>
                  <div className="bg-background rounded-lg p-6 shadow-sm text-center">
                    <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">Diaspora United</p>
                  </div>
                  <div className="bg-background rounded-lg p-6 shadow-sm text-center">
                    <Heart className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">Shared Heritage</p>
                  </div>
                  <div className="bg-background rounded-lg p-6 shadow-sm text-center">
                    <MateMasie className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">Collective Impact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Dark */}
      <section className="bg-foreground py-12 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-background mb-4">
            Join Africa's Sixth Region
          </h2>
          <p className="text-background/70 mb-8 max-w-lg mx-auto">
            Whether you're born on the continent or in the diaspora, your contribution matters. 
            Install DNA and become part of Africa's global movement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full sm:w-auto border-background/30 text-background hover:bg-background/10 gap-2 px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground border-t border-background/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/icons/icon-192.png" 
                alt="DNA Logo" 
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-sm text-background/60">
                Diaspora Network of Africa
              </span>
            </div>
            <p className="text-sm text-background/40">
              © {new Date().getFullYear()} DNA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Install;
