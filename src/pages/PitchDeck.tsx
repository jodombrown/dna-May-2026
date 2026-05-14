import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { FlipCard } from '@/components/FlipCard';
import dnaLogo from '@/assets/dna-logo.png';

const PitchDeck = () => {
  const { toast } = useToast();
  const { isMobile } = useMobile();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      id: 1,
      title: "DNA Platform",
      subtitle: "Diaspora Network of Africa",
      showHeader: false,
      sources: [],
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in">
          <img 
            src={dnaLogo}
            alt="DNA Logo" 
            className="h-32 md:h-48 w-auto mb-4 animate-scale-in"
          />
          <div className="text-xl md:text-2xl font-semibold text-muted-foreground tracking-widest animate-fade-in" style={{ animationDelay: '0.2s' }}>
            DIASPORA NETWORK OF AFRICA
          </div>
          <p className="text-3xl md:text-5xl font-bold text-foreground max-w-4xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Mobilizing the African Diaspora to drive systemic change through innovation and entrepreneurship
          </p>
        </div>
      )
    },
    {
      id: 2,
      title: "The Problem",
      subtitle: "Untapped potential across 200M+ diaspora members worldwide",
      showHeader: true,
      sources: [
        { text: "World Bank, Migration and Remittances Data", url: "https://www.worldbank.org/en/topic/migrationremittancesdiasporaissues" }
      ],
      content: (
        <div className="flex flex-col justify-center h-full space-y-8 animate-fade-in">
          <div className="space-y-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <p className="text-2xl md:text-4xl leading-relaxed text-foreground/90">
                <AnimatedNumber value={200} suffix="+ million" className="text-dna-copper font-bold" /> African diaspora members worldwide possess extraordinary power, skills, networks, knowledge, and <AnimatedNumber value={200} prefix="$" suffix="B+" className="text-dna-emerald font-bold" /> in annual remittances.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 p-8 md:p-10 rounded-xl border-2 border-destructive/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <p className="text-2xl md:text-4xl font-bold text-destructive mb-6">
                But there's a critical disconnect:
              </p>
              <ul className="space-y-5 text-xl md:text-2xl text-foreground/90">
                <li className="flex items-start gap-4">
                  <span className="text-destructive text-3xl flex-shrink-0">✗</span>
                  <span>No unified platform to channel this collective power</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-destructive text-3xl flex-shrink-0">✗</span>
                  <span>Individual efforts remain fragmented and inefficient</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-destructive text-3xl flex-shrink-0">✗</span>
                  <span>Massive potential goes untapped while Africa faces urgent challenges</span>
                </li>
              </ul>
            </div>
            
            <p className="text-xl md:text-3xl font-semibold text-foreground italic animate-fade-in" style={{ animationDelay: '0.5s' }}>
              Without infrastructure for coordination, diaspora strength remains scattered, unable to create the systemic change Africa needs.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "The Solution",
      subtitle: "A digital mobilization engine for collective impact",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col h-full justify-center px-4 md:px-8 animate-fade-in">
          {/* Top Tagline */}
          <div className="text-center mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs md:text-sm font-semibold tracking-widest uppercase text-dna-copper mb-2">
              The Solution
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              A digital mobilization engine for collective impact
            </p>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8 md:mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-5xl mx-auto leading-tight">
              The first digital mobilization engine for the African Diaspora
            </h2>
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-px bg-border w-12 md:w-16" />
              <p className="text-lg md:text-2xl font-semibold text-dna-copper">
                Built on the 5C Framework
              </p>
              <div className="h-px bg-border w-12 md:w-16" />
            </div>
          </div>

          {/* 5 Cs - Responsive Layout */}
          <div className="max-w-6xl mx-auto w-full mb-8 md:mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {/* Mobile & Tablet: Vertical Stack */}
            <div className="flex flex-col gap-6 lg:hidden">
              {[
                { num: 1, title: 'Connect', desc: 'Unite verified diaspora profiles by skills and heritage' },
                { num: 2, title: 'Convene', desc: 'Host gatherings that build trust and shared knowledge' },
                { num: 3, title: 'Collaborate', desc: 'Turn ideas into ventures through smart-matched teams' },
                { num: 4, title: 'Contribute', desc: 'Channel capital and expertise toward impactful projects' },
                { num: 5, title: 'Convey', desc: 'Amplify stories that inspire and shift narratives' }
              ].map((item, idx) => (
                <div key={item.num} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${0.1 * idx}s` }}>
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-dna-copper/10 flex items-center justify-center hover:bg-dna-copper/20 transition-all duration-300">
                      <span className="text-2xl font-bold text-dna-copper">{item.num}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-snug">{item.desc}</p>
                  </div>
                  {idx < 4 && (
                    <div className="hidden sm:block w-8 h-px bg-dna-copper/20 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Horizontal Flow with Stagger */}
            <div className="hidden lg:block">
              {/* Top Row: Connect → Convene → Collaborate */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                {/* Connect */}
                <div className="text-center group">
                  <div className="mb-3 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-dna-copper/10 flex items-center justify-center group-hover:bg-dna-copper/20 transition-all duration-300">
                      <span className="text-2xl font-bold text-dna-copper">1</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-2">Connect</h4>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Unite verified diaspora profiles by skills and heritage
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center pt-12">
                  <div className="w-full h-px bg-dna-copper/20" />
                </div>

                {/* Convene */}
                <div className="text-center group">
                  <div className="mb-3 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-dna-copper/10 flex items-center justify-center group-hover:bg-dna-copper/20 transition-all duration-300">
                      <span className="text-2xl font-bold text-dna-copper">2</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-2">Convene</h4>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Host gatherings that build trust and shared knowledge
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center pt-12">
                  <div className="w-full h-px bg-dna-copper/20" />
                </div>

                {/* Collaborate */}
                <div className="text-center group">
                  <div className="mb-3 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-dna-copper/10 flex items-center justify-center group-hover:bg-dna-copper/20 transition-all duration-300">
                      <span className="text-2xl font-bold text-dna-copper">3</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-2">Collaborate</h4>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Turn ideas into ventures through smart-matched teams
                  </p>
                </div>
              </div>

              {/* Bottom Row: Contribute → Convey */}
              <div className="flex items-start justify-center gap-4">
                <div className="w-1/5" />
                
                {/* Contribute */}
                <div className="w-1/5 text-center group">
                  <div className="mb-3 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-dna-copper/10 flex items-center justify-center group-hover:bg-dna-copper/20 transition-all duration-300">
                      <span className="text-2xl font-bold text-dna-copper">4</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-2">Contribute</h4>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Channel capital and expertise toward impactful projects
                  </p>
                </div>

                {/* Arrow */}
                <div className="w-1/5 flex items-center justify-center pt-12">
                  <div className="w-full h-px bg-dna-copper/20" />
                </div>

                {/* Convey */}
                <div className="w-1/5 text-center group">
                  <div className="mb-3 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-dna-copper/10 flex items-center justify-center group-hover:bg-dna-copper/20 transition-all duration-300">
                      <span className="text-2xl font-bold text-dna-copper">5</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-2">Convey</h4>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Amplify stories that inspire and shift narratives
                  </p>
                </div>
                
                <div className="w-1/5" />
              </div>
            </div>
          </div>

          {/* Bottom Tagline */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-xl md:text-3xl font-normal italic text-foreground">
              Transforming scattered strength into collective power
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Market Opportunity",
      subtitle: "Riding Africa's economic boom and diaspora awakening",
      showHeader: true,
      sources: [
        { text: "African Development Bank, African Economic Outlook 2024", url: "https://www.afdb.org/en/knowledge/publications/african-economic-outlook" }
      ],
      content: (
        <div className="flex flex-col justify-center h-full space-y-6 animate-fade-in">
          <div className="grid grid-cols-3 gap-8 mt-4">
            {[
              { value: 200, label: 'African Diasporans Worldwide', suffix: 'M+', color: 'dna-copper', delay: '0.1s' },
              { value: 200, label: 'Annual Diaspora Remittances', prefix: '$', suffix: 'B+', color: 'dna-emerald', delay: '0.2s' },
              { value: 3.4, label: "Africa's GDP by 2030", prefix: '$', suffix: 'T', decimals: 1, color: 'dna-gold', delay: '0.3s' }
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br from-${stat.color}/10 to-${stat.color}/5 p-8 rounded-xl border-2 border-${stat.color}/30 text-center hover-scale animate-fade-in`} style={{ animationDelay: stat.delay }}>
                <div className={`text-6xl md:text-7xl font-bold text-${stat.color} mb-4`}>
                  <AnimatedNumber 
                    value={stat.value} 
                    prefix={stat.prefix} 
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                  />
                </div>
                <div className="text-lg md:text-xl font-semibold text-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-5 text-foreground/90 mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-xl md:text-3xl">✦ Africa is the world's <strong>fastest-growing economic region</strong></p>
            <p className="text-xl md:text-3xl">✦ The diaspora is <strong>massively underutilized</strong> as a development resource</p>
            <p className="text-xl md:text-3xl">✦ DNA positions diaspora members as <strong>architects of Africa's future</strong></p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Platform Features",
      subtitle: "Built for impact, designed for diaspora",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col justify-center h-full space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Verified Profiles', desc: 'Cultural and professional identity system with skills, regions, and diaspora connections', color: 'dna-emerald', delay: '0.1s' },
              { title: 'Smart Matching', desc: 'AI-powered connections based on expertise, interests, and impact goals', color: 'dna-copper', delay: '0.2s' },
              { title: 'Collaboration Spaces', desc: 'Project hubs, events, and opportunities for coordinated action', color: 'dna-gold', delay: '0.3s' },
              { title: 'Impact Tracking', desc: 'Measure contributions, showcase outcomes, amplify success stories', color: 'dna-forest', delay: '0.4s' }
            ].map((feature) => (
              <div key={feature.title} className={`bg-card p-6 md:p-8 rounded-xl border-2 border-${feature.color}/30 hover-scale animate-fade-in`} style={{ animationDelay: feature.delay }}>
                <h3 className={`text-2xl md:text-4xl font-bold text-${feature.color} mb-4`}>{feature.title}</h3>
                <p className="text-base md:text-xl text-foreground/80">{feature.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-dna-copper/10 to-dna-gold/10 p-6 md:p-8 rounded-xl border-2 border-dna-copper/30 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-xl md:text-3xl font-semibold text-foreground">
              Currently in private beta with <strong><AnimatedNumber value={500} suffix="+" /> early adopters</strong> from <AnimatedNumber value={40} suffix="+" /> countries
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Traction & Validation",
      subtitle: "Early momentum proves the market is ready",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col justify-center h-full space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              {[
                { value: 500, label: 'Beta Users in 3 Months', color: 'dna-emerald', delay: '0.1s' },
                { value: 40, label: 'Countries Represented', color: 'dna-copper', delay: '0.2s' },
                { value: 15, label: 'Active Partnerships', color: 'dna-gold', delay: '0.3s' }
              ].map((stat) => (
                <div key={stat.label} className={`bg-gradient-to-br from-${stat.color}/10 to-${stat.color}/5 p-6 md:p-8 rounded-xl border-2 border-${stat.color}/30 hover-scale animate-fade-in`} style={{ animationDelay: stat.delay }}>
                  <div className={`text-5xl md:text-7xl font-bold text-${stat.color} mb-3`}>
                    <AnimatedNumber value={stat.value} suffix="+" />
                  </div>
                  <div className="text-lg md:text-2xl font-semibold text-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-card p-6 md:p-8 rounded-xl border-2 border-dna-forest/30 flex flex-col justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-2xl md:text-4xl font-bold text-dna-forest mb-6">Early Feedback</h3>
              <div className="space-y-6 text-base md:text-xl text-foreground/80">
                <div>
                  <p className="italic leading-relaxed">"Finally, a platform that understands the diaspora experience and makes it easy to give back meaningfully."</p>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">Tech entrepreneur, San Francisco</p>
                </div>
                <div>
                  <p className="italic leading-relaxed">"This is the missing infrastructure we've been waiting for to coordinate diaspora impact."</p>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">Impact investor, London</p>
                </div>
                <div>
                  <p className="italic leading-relaxed">"DNA is bridging the gap between diaspora aspirations and actionable pathways to contribute to Africa's growth."</p>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">Startup founder, Lagos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Business Model",
      subtitle: "Multiple revenue streams for sustainable growth",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col justify-center h-full space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Premium Memberships', price: '$29/mo or $290/yr', features: ['Advanced matching and analytics', 'Priority event access', 'Enhanced visibility'], color: 'dna-emerald', delay: '0.1s' },
              { title: 'Enterprise Solutions', price: '$500-5000/mo', features: ['Corporate talent pipelines', 'Diaspora engagement programs', 'White-label solutions'], color: 'dna-copper', delay: '0.2s' },
              { title: 'Platform Fees', price: '5-10% transaction fee', features: ['Investment facilitation', 'Event ticketing', 'Service marketplace'], color: 'dna-gold', delay: '0.3s' },
              { title: 'Data and Insights', price: 'Custom pricing', features: ['Diaspora trend reports', 'Market intelligence', 'Research partnerships'], color: 'dna-forest', delay: '0.4s' }
            ].map((stream) => (
              <div key={stream.title} className={`bg-gradient-to-br from-${stream.color}/10 to-${stream.color}/5 p-6 md:p-8 rounded-xl border-2 border-${stream.color}/30 hover-scale animate-fade-in`} style={{ animationDelay: stream.delay }}>
                <h3 className={`text-xl md:text-3xl font-bold text-${stream.color} mb-3`}>{stream.title}</h3>
                <p className="text-base md:text-xl text-foreground/80 mb-4 font-semibold">{stream.price}</p>
                <ul className="space-y-2 text-sm md:text-lg text-foreground/70">
                  {stream.features.map((f) => <li key={f}>• {f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: "Go-to-Market Strategy",
      subtitle: "Phased growth from community to enterprise",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col justify-center h-full space-y-5 animate-fade-in">
          {[
            { phase: 'Phase 1: Community Seeding', timeline: 'Now, Month 6', desc: 'Target diaspora hubs: Lagos, London, New York, Atlanta. Partner with diaspora organizations and thought leaders.', color: 'dna-emerald', delay: '0.1s' },
            { phase: 'Phase 2: Viral Growth', timeline: 'Months 7-12', desc: 'Leverage success stories, referral programs, and content marketing. Launch in 10+ major diaspora cities.', color: 'dna-copper', delay: '0.2s' },
            { phase: 'Phase 3: Enterprise Expansion', timeline: 'Year 2+', desc: 'Partner with governments, corporations, and NGOs. Scale to 100K+ users across 50+ countries.', color: 'dna-gold', delay: '0.3s' }
          ].map((phase) => (
            <div key={phase.phase} className={`bg-gradient-to-r from-${phase.color}/10 to-${phase.color}/5 p-6 md:p-8 rounded-xl border-l-4 border-l-${phase.color} hover-scale animate-fade-in`} style={{ animationDelay: phase.delay }}>
              <h3 className={`text-2xl md:text-4xl font-bold text-${phase.color} mb-3`}>{phase.phase}</h3>
              <p className="text-base md:text-xl text-muted-foreground mb-4">{phase.timeline}</p>
              <p className="text-lg md:text-2xl text-foreground/80">{phase.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 9,
      title: "Competition & Differentiation",
      subtitle: "Why DNA wins in the diaspora engagement space",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col justify-center h-full space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-6">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-2xl md:text-3xl font-bold text-dna-copper mb-4">The Competition</h3>
              <div className="space-y-4 text-lg md:text-2xl text-foreground/80">
                <p>❌ LinkedIn: Generic networking, no diaspora focus</p>
                <p>❌ Facebook Groups: Fragmented, no action tools</p>
                <p>❌ Remittance Apps: Transactional, no community</p>
                <p>❌ Diaspora Orgs: Limited reach, offline-first</p>
              </div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-2xl md:text-3xl font-bold text-dna-emerald mb-4">DNA Advantage</h3>
              <div className="space-y-4 text-lg md:text-2xl text-foreground/80">
                <p>✓ <strong>Diaspora-First Design:</strong> Built for our unique needs</p>
                <p>✓ <strong>Systems-Change Focus:</strong> Coordinated action, not just networking</p>
                <p>✓ <strong>Cultural Intelligence:</strong> Rooted in Ubuntu and Sankofa</p>
                <p>✓ <strong>Action-Oriented:</strong> Real opportunities, tangible outcomes</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-dna-copper/10 to-dna-gold/10 p-6 rounded-xl border-2 border-dna-copper/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              Why we win: <span className="text-dna-copper">Founder-market fit + First-mover advantage + Community-led growth</span>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 10,
      title: "Team",
      subtitle: "Founder-market fit rooted in diaspora experience",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col justify-center h-full space-y-5 animate-fade-in">
          <div className="bg-gradient-to-br from-dna-forest/10 to-dna-emerald/10 p-8 rounded-xl border-2 border-dna-emerald/30 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-3xl md:text-4xl font-bold text-dna-copper mb-2">Jaûne Odombrown</h3>
            <p className="text-xl md:text-2xl font-semibold text-dna-emerald mb-4">Founder & CEO</p>
            <div className="space-y-4 text-base md:text-xl text-foreground/80">
              <p>• <AnimatedNumber value={10} suffix="+" /> years building ecosystems and launching startups</p>
              <p>• Deep diaspora network across <AnimatedNumber value={3} /> continents</p>
              <p>• Previous: Ecosystem development, venture building</p>
              <p>• Mission-driven entrepreneur with lived diaspora experience</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl border-2 border-dna-copper/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl md:text-2xl font-bold text-dna-copper mb-3">Advisors</h3>
              <p className="text-base md:text-lg text-foreground/80">Diaspora thought leaders, tech entrepreneurs, impact investors</p>
            </div>
            <div className="bg-card p-6 rounded-xl border-2 border-dna-gold/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl md:text-2xl font-bold text-dna-gold mb-3">Building</h3>
              <p className="text-base md:text-lg text-foreground/80">Strategic partnerships with diaspora organizations, universities, and tech platforms</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 11,
      title: "Financials & Roadmap",
      subtitle: "Clear path to $1M ARR and beyond",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col justify-center h-full space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {[
              { quarter: 'Q1-Q2: Foundation', goals: ['Complete MVP with core features', 'Reach 2,500 beta users', 'Launch in 5 diaspora hubs', '$50K MRR from premium memberships'], color: 'dna-emerald', delay: '0.1s' },
              { quarter: 'Q3-Q4: Acceleration', goals: ['Scale to 10,000 active users', 'Launch enterprise solutions', 'Expand to 15+ cities', '$200K MRR, path to $1M ARR'], color: 'dna-copper', delay: '0.2s' }
            ].map((roadmap) => (
              <div key={roadmap.quarter} className={`bg-gradient-to-r from-${roadmap.color}/10 to-${roadmap.color}/5 p-6 md:p-8 rounded-xl border-l-4 border-l-${roadmap.color} hover-scale animate-fade-in`} style={{ animationDelay: roadmap.delay }}>
                <h3 className={`text-2xl md:text-3xl font-bold text-${roadmap.color} mb-4`}>{roadmap.quarter}</h3>
                <ul className="space-y-3 text-base md:text-xl text-foreground/80">
                  {roadmap.goals.map((g) => <li key={g}>• {g}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-dna-gold/10 to-dna-emerald/10 p-6 md:p-10 rounded-xl border-2 border-dna-gold/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-2xl md:text-4xl font-bold text-dna-gold mb-6">Use of Funds</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-dna-copper mb-2">
                  <AnimatedNumber value={40} suffix="%" />
                </div>
                <div className="text-lg md:text-2xl text-foreground/90">Product Development</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-dna-emerald mb-2">
                  <AnimatedNumber value={35} suffix="%" />
                </div>
                <div className="text-lg md:text-2xl text-foreground/90">Marketing & Growth</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-dna-gold mb-2">
                  <AnimatedNumber value={25} suffix="%" />
                </div>
                <div className="text-lg md:text-2xl text-foreground/90">Operations & Team</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 12,
      title: "The Ask",
      subtitle: "Join us in mobilizing Africa's greatest asset",
      showHeader: true,
      sources: [],
      content: (
        <div className="flex flex-col items-center justify-center h-full space-y-8 text-center animate-fade-in">
          <div className="bg-gradient-to-br from-dna-copper/10 to-dna-gold/10 p-12 rounded-xl border-2 border-dna-copper/30 max-w-5xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-4xl md:text-5xl font-bold text-dna-copper mb-6">
              Raising $<AnimatedNumber value={500} />K Seed Round
            </p>
            <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed">
              To scale product development, onboard <AnimatedNumber value={10} suffix="K+" /> users, and establish DNA as the premier diaspora mobilization platform
            </p>
          </div>
          <div className="space-y-4 max-w-4xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              Join us in mobilizing the world's most powerful distributed asset
            </p>
            <p className="text-xl md:text-2xl text-dna-emerald">
              Together, we transform scattered strength into collective power
            </p>
          </div>
          <div className="mt-10 pt-8 border-t-2 border-border w-full max-w-3xl animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-xl md:text-2xl font-semibold text-foreground mb-4">Contact</p>
            <p className="text-lg md:text-xl text-foreground/80 mb-2">Jaûne Odombrown</p>
            <a 
              href="mailto:jaune@diasporanetwork.africa" 
              className="text-lg md:text-xl text-dna-copper font-semibold hover:text-dna-gold transition-colors underline"
            >
              jaune@diasporanetwork.africa
            </a>
            <br />
            <a 
              href={config.APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg md:text-xl text-foreground/80 mt-3 inline-block hover:text-dna-emerald transition-colors underline"
            >
              www.diasporanetwork.africa
            </a>
          </div>
        </div>
      )
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DNA Platform - Pitch Deck',
          text: 'Discover the Diaspora Network of Africa - mobilizing the African Diaspora for systemic change.',
          url: window.location.href,
        });
        toast({
          title: "Shared successfully!",
          description: "Thank you for sharing the DNA pitch deck",
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Share failed
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Pitch deck link copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Could not copy",
          description: "Please copy the URL manually",
          variant: "destructive",
        });
      }
    }
  };

  const scrollToSlide = (index: number) => {
    setCurrentSlide(index);
    if (!isMobile && scrollContainerRef.current) {
      const slideWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      scrollToSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      scrollToSlide(currentSlide - 1);
    }
  };

  return (
    <div id="pitch-deck-print-root" className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <UnifiedHeader />
      
      {/* Header Actions */}
      <div className="fixed top-20 right-4 z-50 flex gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-background/95 backdrop-blur">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-background/95 backdrop-blur">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Navigation Controls - Desktop */}
      {!isMobile && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-background/95 backdrop-blur print:hidden"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 bg-background/95 backdrop-blur print:hidden"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 print:hidden">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentSlide === index 
                ? "bg-dna-copper w-8" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slides Container */}
      <div className="pt-20">
        {isMobile ? (
          // Mobile: Vertical scroll
          <div className="space-y-4 px-4 pb-20">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="deck-slide aspect-video bg-card rounded-lg shadow-lg p-6 md:p-8 flex flex-col relative"
              >
                {slide.showHeader && (
                  <div className="flex items-start justify-between mb-6 animate-fade-in">
                    <div className="flex-1">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{slide.title}</h2>
                      <p className="text-sm md:text-base text-muted-foreground">{slide.subtitle}</p>
                    </div>
                    <img 
                      src={dnaLogo}
                      alt="DNA Logo" 
                      className="h-8 md:h-12 w-auto ml-3 flex-shrink-0"
                    />
                  </div>
                )}
                <div className="flex-1 overflow-auto mb-6">
                  {slide.content}
                </div>
                {/* Footer with sources and page number */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <div className="flex-1">
                    {slide.sources && slide.sources.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {slide.sources.map((source, idx) => (
                          <div key={idx}>
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-dna-copper transition-colors underline"
                            >
                              {source.text}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground font-medium">
                    {index + 1} / {slides.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop: Horizontal scroll with native scroll support
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-scroll snap-x snap-mandatory h-[calc(100dvh-5rem)] scroll-smooth"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--muted-foreground)) transparent',
            }}
            onScroll={(e) => {
              const slideWidth = e.currentTarget.offsetWidth;
              const scrollLeft = e.currentTarget.scrollLeft;
              const newSlide = Math.round(scrollLeft / slideWidth);
              if (newSlide !== currentSlide) {
                setCurrentSlide(newSlide);
              }
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="min-w-full h-full snap-center flex items-center justify-center px-8 py-4"
              >
                <div className="w-full aspect-video max-h-full bg-card rounded-lg shadow-2xl p-8 md:p-12 flex flex-col overflow-hidden relative">
                  {slide.showHeader && (
                    <div className="flex items-start justify-between mb-8 animate-fade-in">
                      <div className="flex-1">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{slide.title}</h2>
                        <p className="text-base md:text-lg text-muted-foreground">{slide.subtitle}</p>
                      </div>
                      <img 
                        src={dnaLogo} 
                        alt="DNA Logo" 
                        className="h-12 md:h-16 w-auto ml-4 flex-shrink-0"
                      />
                    </div>
                  )}
                  <div className="flex-1 overflow-auto mb-8">
                    {slide.content}
                  </div>
                  {/* Footer with sources and page number */}
                  <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="flex-1">
                      {slide.sources && slide.sources.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {slide.sources.map((source, idx) => (
                            <div key={idx}>
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-dna-copper transition-colors underline"
                              >
                                {source.text}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {index + 1} / {slides.length}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page {
            size: 11in 8.5in landscape;
            margin: 0.5in;
          }
          
          body, html {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Hide navigation and controls */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Make container block for printing */
          .overflow-x-scroll {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
          }
          
          /* Each slide becomes a page */
          .snap-center {
            page-break-after: always;
            page-break-inside: avoid;
            min-width: 100% !important;
            height: 7.5in !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          /* Last slide shouldn't force a blank page */
          .snap-center:last-child {
            page-break-after: auto;
          }
          
          /* Slide content should fill the page properly */
          .snap-center > div {
            width: 10in !important;
            height: 7in !important;
            max-height: none !important;
            aspect-ratio: auto !important;
          }
        }
        
        /* Scrollbar styling */
        .overflow-x-scroll::-webkit-scrollbar {
          height: 8px;
        }
        
        .overflow-x-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-x-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        
        .overflow-x-scroll::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default PitchDeck;
