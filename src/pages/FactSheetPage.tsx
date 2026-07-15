import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Share2, Users, Target, TrendingUp, Globe, Heart, MapPin, Landmark, Building2, ArrowUpRight, ExternalLink } from 'lucide-react';
import { config } from '@/lib/config';
import UnifiedHeader from '@/components/UnifiedHeader';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MateMasie } from '@/components/icons/adinkra';

const FactSheetPage = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stakeholderType, setStakeholderType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    message: ''
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DNA Platform - Fact Sheet',
          text: 'Discover the Diaspora Network of Africa - mobilizing talent, capital, and expertise for systemic change.',
          url: window.location.href,
        });
      } catch (err) {
        // Share failed
      }
    }
  };

  const openStakeholderDialog = (type: string) => {
    setStakeholderType(type);
    setDialogOpen(true);
    setFormData({ name: '', email: '', organization: '', message: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'fact-sheet-stakeholder',
          formData: {
            stakeholderType,
            ...formData
          },
          userEmail: formData.email
        }
      });

      if (error) throw error;

      toast({
        title: "Message sent successfully!",
        description: "We'll be in touch soon.",
      });
      setDialogOpen(false);
      setFormData({ name: '', email: '', organization: '', message: '' });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="fact-sheet-print-root" className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <UnifiedHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl pt-24">
        {/* Header Actions */}
        <div className="flex justify-end gap-3 mb-6 print:hidden">
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Platform Fact Sheet
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Mobilizing the African Diaspora to drive systemic change through innovation and entrepreneurship
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-dna-emerald/10 text-dna-forest rounded-full text-sm font-medium">
              350M+ Diasporans
            </span>
            <span className="px-4 py-2 bg-dna-copper/10 text-dna-copper rounded-full text-sm font-medium">
              $100B+ Annual Remittances
            </span>
            <span className="px-4 py-2 bg-dna-gold/10 text-dna-gold rounded-full text-sm font-medium">
              1 Platform
            </span>
          </div>
        </div>

        <Separator className="mb-12" />

        {/* Executive Summary */}
        <Card className="fact-sheet-section p-8 mb-8 bg-card border-2">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <MateMasie className="h-8 w-8 text-dna-copper" />
            Executive Summary
          </h2>
          <div className="space-y-4 text-lg text-foreground/90">
            <p>
              The Global African Diaspora holds extraordinary power - skills honed across continents, networks spanning the globe, knowledge bridging cultures, resources waiting to be channeled, and capital seeking meaningful impact. Yet this power remains <strong>scattered, underutilized, disconnected</strong> from the continent's urgent needs and boundless potential.
            </p>
            <p>
              The <strong>Diaspora Network of Africa (DNA)</strong> exists to change this. We are building the digital mobilization engine that transforms scattered strength into collective power.
            </p>
          </div>
        </Card>

        {/* Founder Section */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-dna-copper/5 via-transparent to-dna-gold/5 border-2 border-dna-copper/20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-dna-forest to-dna-emerald flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                JO
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-dna-forest mb-2">Founded by Jaune Odombrown</h3>
              <p className="text-muted-foreground mb-4">Ecosystem Builder | Entrepreneur | Diaspora Advocate</p>
              <p className="text-foreground/80 leading-relaxed">
                Jaune Odombrown is an ecosystem builder and entrepreneur passionate about leveraging technology and community to drive systemic change. With deep roots in both the diaspora and the continent, Jaune founded DNA to bridge the gap between scattered diaspora efforts and Africa's transformative potential.
              </p>
              <div className="mt-4">
                <a
                  href="https://www.linkedin.com/in/jaunelamarr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-dna-forest text-white rounded-lg hover:bg-dna-forest/90 transition-colors text-sm font-medium"
                >
                  Connect on LinkedIn <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </Card>

        <Separator className="mb-12 print:hidden" />

        {/* Who We Are */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-dna-emerald" />
            Who We Are
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-3 text-dna-forest">Our Mission</h3>
              <p className="text-foreground/80">
                To mobilize the Global African Diaspora's collective power (skills, networks, knowledge, resources, and capital) into coordinated action that accelerates Africa's progress and prosperity.
              </p>
            </Card>
            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-3 text-dna-forest">Our Vision</h3>
              <p className="text-foreground/80">
                A world where the African Diaspora operates as Africa's most powerful distributed asset, seamlessly connected, purposefully convened, actively collaborating, meaningfully contributing, and amplifying impact that transforms the continent and uplifts our global community.
              </p>
            </Card>
          </div>
          
          <Card className="p-6 mt-6 bg-gradient-to-br from-dna-forest/5 to-dna-emerald/5 border-2 border-dna-emerald/20">
            <h3 className="text-xl font-bold mb-3 text-dna-forest">Our Values</h3>
            <div className="grid md:grid-cols-3 gap-4 text-foreground/80">
              <div>
                <strong className="text-dna-copper">Ubuntu:</strong> We believe in collective humanity and interconnectedness
              </div>
              <div>
                <strong className="text-dna-copper">Sankofa:</strong> We honor our past while building our future
              </div>
              <div>
                <strong className="text-dna-copper">Excellence:</strong> We pursue entrepreneurial excellence grounded in cultural authenticity
              </div>
            </div>
          </Card>
        </section>

        <Separator className="mb-12 print:hidden" />

        {/* What We Do - The 5 Cs */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Target className="h-8 w-8 text-dna-copper" />
            Our Methodology: The 5 Cs Cycle
          </h2>
          <p className="text-lg text-foreground/90 mb-8">
            This is not a linear process. It's a <strong>living, breathing ecosystem</strong> where each action amplifies the next, creating an upward spiral of impact:
          </p>
          
          <div className="space-y-6">
            <Card className="p-6 border-l-4 border-l-dna-emerald bg-gradient-to-r from-dna-emerald/5 to-transparent">
              <h3 className="text-2xl font-bold mb-3 text-dna-forest">1. CONNECT - Building the Network of Possibility</h3>
              <p className="text-foreground/80 leading-relaxed">
                We start by linking diaspora members to each other and to opportunities across Africa. Every entrepreneur in Atlanta is connected to an innovator in Lagos. Every investor in London is linked to a project in Accra. Every technologist in Toronto finds their counterpart in Nairobi. <strong>Connection is our foundation</strong> - the threads that weave our scattered strength into collective power.
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-l-dna-copper bg-gradient-to-r from-dna-copper/5 to-transparent">
              <h3 className="text-2xl font-bold mb-3 text-dna-forest">2. CONVENE - Gathering Around Shared Purpose</h3>
              <p className="text-foreground/80 leading-relaxed">
                From individual connections, we create intentional gatherings - digital and physical spaces where the diaspora comes together around Africa's priorities. We convene around sectors (tech, agriculture, healthcare), around challenges (infrastructure, education, climate), and around opportunities (market entry, investment, innovation). <strong>Purpose transforms strangers into collaborators.</strong>
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-l-dna-gold bg-gradient-to-r from-dna-gold/5 to-transparent">
              <h3 className="text-2xl font-bold mb-3 text-dna-forest">3. COLLABORATE - Co-Creating Solutions</h3>
              <p className="text-foreground/80 leading-relaxed">
                When we gather with purpose, collaboration ignites. Diaspora expertise merges with continental insight. Resources meet needs. Ideas become strategies. This is where the architect in Canada designs with the builder in Rwanda. Where the investor in Dubai funds the entrepreneur in Kampala. <strong>Where collective intelligence surpasses what any individual could achieve alone.</strong>
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-l-dna-emerald bg-gradient-to-r from-dna-emerald/5 to-transparent">
              <h3 className="text-2xl font-bold mb-3 text-dna-forest">4. CONTRIBUTE - Mobilizing Our Assets</h3>
              <p className="text-foreground/80 leading-relaxed">
                Collaboration unlocks contribution. Each person brings their unique value - a skill shared, knowledge transferred, a network opened, capital deployed, time invested. <strong>Contributions aren't charity; they're investments in our collective future.</strong> Every contribution strengthens the whole, proving that Africa's progress is the diaspora's progress.
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-l-dna-copper bg-gradient-to-r from-dna-copper/5 to-transparent">
              <h3 className="text-2xl font-bold mb-3 text-dna-forest">5. CONVEY - Amplifying Impact and Inspiring Action</h3>
              <p className="text-foreground/80 leading-relaxed">
                We share our stories, broadcast our successes, communicate our learnings, and showcase our impact. When we convey what we've built together, we inspire others to join. Each story shared creates new connections. Every success broadcast brings new collaborators. <strong>The cycle begins again - stronger, wider, deeper.</strong>
              </p>
            </Card>
          </div>

          {/* The Spiral Effect */}
          <Card className="p-8 mt-8 bg-gradient-to-br from-dna-forest/10 via-dna-emerald/10 to-dna-copper/10 border-2 border-dna-copper/30">
            <h3 className="text-2xl font-bold mb-4 text-dna-forest flex items-center gap-2">
              <MateMasie className="h-7 w-7 text-dna-copper" />
              The Spiral Effect
            </h3>
            <p className="text-lg text-foreground/90 mb-4">
              This isn't a one-time journey from Connect to Convey. It's a <strong>perpetual spiral</strong>:
            </p>
            <ul className="space-y-2 text-foreground/80 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-dna-copper mt-1">•</span>
                <span>Every story conveyed creates new connections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dna-copper mt-1">•</span>
                <span>Every contribution strengthens collaboration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dna-copper mt-1">•</span>
                <span>Every collaboration makes convenings more powerful</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dna-copper mt-1">•</span>
                <span>Every convening deepens our connections</span>
              </li>
            </ul>
            <p className="text-lg text-foreground/90 mt-6 font-semibold">
              With each revolution, we grow stronger. More connected. More capable. More impactful.
            </p>
          </Card>
        </section>

        <Separator className="mb-12 print:hidden" />

        {/* Why It Matters */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Globe className="h-8 w-8 text-dna-gold" />
            Why It Matters: The Opportunity
          </h2>

          <Card className="p-8 bg-gradient-to-br from-dna-forest/10 to-dna-emerald/10 border-2 border-dna-forest/20 mb-6">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-dna-copper mb-2">350M+</div>
                <div className="text-sm font-semibold text-muted-foreground">African Diasporans Worldwide</div>
                <div className="text-xs text-muted-foreground/70 mt-1">The "3rd Largest Country" after China & India</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-dna-emerald mb-2">$100B+</div>
                <div className="text-sm font-semibold text-muted-foreground">Annual Diaspora Remittances</div>
                <div className="text-xs text-muted-foreground/70 mt-1">2x more than all international aid combined</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-dna-gold mb-2">$500B</div>
                <div className="text-sm font-semibold text-muted-foreground">Projected Remittances by 2035</div>
                <div className="text-xs text-muted-foreground/70 mt-1">World Bank projection</div>
              </div>
            </div>
          </Card>

          <div className="space-y-4 text-lg text-foreground/90">
            <p>
              The African diaspora represents one of the world's most underutilized resources for development. With nearly <strong>350 million people</strong> globally, if the diaspora were a country, it would be the <strong>third-largest in the world</strong> - larger than the United States, Indonesia, or Brazil.
            </p>
            <p>
              In 2024, over <strong>$96 billion</strong> flowed into Africa through remittances alone - approximately twice the level of overseas development assistance. This figure is projected to exceed <strong>$100 billion annually</strong>, with potential to reach <strong>$500 billion by 2035</strong> if transfer costs are reduced.
            </p>
            <p>
              However, this immense potential remains <strong>fragmented and uncoordinated</strong>. DNA solves this by creating the first comprehensive platform that turns individual efforts into collective impact, transforming scattered contributions into systemic change.
            </p>
          </div>
        </section>

        <Separator className="mb-12 print:hidden" />

        {/* Geographic Distribution */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-dna-copper" />
            Where the Diaspora Lives
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-4 text-dna-forest">Regional Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/80">Latin America & Caribbean</span>
                  <span className="font-bold text-dna-copper">~127 million</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-dna-copper h-2 rounded-full" style={{ width: '36%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/80">North America</span>
                  <span className="font-bold text-dna-emerald">~39 million</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-dna-emerald h-2 rounded-full" style={{ width: '11%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/80">Europe</span>
                  <span className="font-bold text-dna-gold">~4 million</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-dna-gold h-2 rounded-full" style={{ width: '1%' }}></div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-4 text-dna-forest">Top Diaspora Populations</h3>
              <div className="space-y-2 text-foreground/80">
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span>United States</span>
                  <span className="font-semibold">#1</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span>Brazil</span>
                  <span className="font-semibold">#2</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span>Haiti</span>
                  <span className="font-semibold">#3</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <span>Dominican Republic</span>
                  <span className="font-semibold">#4</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Jamaica</span>
                  <span className="font-semibold">#5</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-gradient-to-r from-dna-emerald/10 to-dna-copper/10 border-2 border-dna-emerald/20">
            <h3 className="text-xl font-bold mb-3 text-dna-forest flex items-center gap-2">
              <Landmark className="h-5 w-5 text-dna-copper" />
              Top Remittance Recipients (2024)
            </h3>
            <div className="grid md:grid-cols-5 gap-4 text-center">
              <div className="p-3 rounded-lg bg-card/50">
                <div className="text-2xl font-bold text-dna-copper">$22.7B</div>
                <div className="text-sm text-muted-foreground">Egypt</div>
              </div>
              <div className="p-3 rounded-lg bg-card/50">
                <div className="text-2xl font-bold text-dna-emerald">$19.8B</div>
                <div className="text-sm text-muted-foreground">Nigeria</div>
              </div>
              <div className="p-3 rounded-lg bg-card/50">
                <div className="text-2xl font-bold text-dna-gold">$12B</div>
                <div className="text-sm text-muted-foreground">Morocco</div>
              </div>
              <div className="p-3 rounded-lg bg-card/50">
                <div className="text-2xl font-bold text-dna-copper">$4.6B</div>
                <div className="text-sm text-muted-foreground">Ghana</div>
              </div>
              <div className="p-3 rounded-lg bg-card/50">
                <div className="text-2xl font-bold text-dna-emerald">$4B+</div>
                <div className="text-sm text-muted-foreground">Kenya</div>
              </div>
            </div>
          </Card>
        </section>

        <Separator className="mb-12 print:hidden" />

        {/* Recent Developments */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-dna-emerald" />
            A Moment of Momentum: Recent Developments
          </h2>

          <div className="space-y-4">
            <Card className="p-6 border-l-4 border-l-dna-gold bg-gradient-to-r from-dna-gold/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-dna-forest mb-2">Ghana Opens Doors for Diaspora Investment</h3>
                  <p className="text-foreground/80">
                    President John Dramani Mahama announced landmark reform of the Ghana Investment Promotion Centre (GIPC) Act, <strong>scrapping the minimum foreign capital requirement</strong> that has long been a barrier for diaspora investment in Ghana.
                  </p>
                </div>
                <span className="text-sm font-semibold text-dna-gold bg-dna-gold/10 px-3 py-1 rounded-full">2025</span>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-dna-copper bg-gradient-to-r from-dna-copper/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-dna-forest mb-2">Benin Grants Citizenship to Diaspora Descendants</h3>
                  <p className="text-foreground/80">
                    On September 2, 2024, Benin enacted Law No. 2024-31, <strong>officially granting citizenship to individuals of sub-Saharan African descent</strong> whose ancestors were forcibly deported during the trans-Atlantic slave trade.
                  </p>
                </div>
                <span className="text-sm font-semibold text-dna-copper bg-dna-copper/10 px-3 py-1 rounded-full">2024</span>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-dna-emerald bg-gradient-to-r from-dna-emerald/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-dna-forest mb-2">African Union Recognition</h3>
                  <p className="text-foreground/80">
                    The African Union defines the diaspora as <strong>"the 6th Region"</strong> - people of African origin living outside the continent who are willing to contribute to Africa's development and the building of the African Union.
                  </p>
                </div>
                <span className="text-sm font-semibold text-dna-emerald bg-dna-emerald/10 px-3 py-1 rounded-full">Ongoing</span>
              </div>
            </Card>
          </div>

          <Card className="p-6 mt-6 bg-gradient-to-br from-dna-forest/10 via-dna-emerald/5 to-dna-gold/10 border-2 border-dna-forest/20">
            <p className="text-lg text-foreground/90 text-center italic">
              "The moment is now. African nations are opening their doors. The diaspora is ready to answer the call. <strong>DNA provides the infrastructure to turn this momentum into lasting impact.</strong>"
            </p>
          </Card>
        </section>

        <Separator className="mb-12 print:hidden" />

        {/* How We're Different */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-dna-emerald" />
            How We're Different: Our Positioning
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-3 text-dna-copper">Diaspora-First Design</h3>
              <p className="text-foreground/80">
                Built specifically for African diaspora needs, not a generic networking platform. Every feature addresses real diaspora challenges and opportunities.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-3 text-dna-copper">Systems-Change Focus</h3>
              <p className="text-foreground/80">
                We don't just connect people. We mobilize coordinated action for transformative impact, from individual connections to collective movements.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-3 text-dna-copper">Cultural Intelligence</h3>
              <p className="text-foreground/80">
                Rooted in African values (Ubuntu, Sankofa) and designed with cultural authenticity. Technology that honors heritage while embracing innovation.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-3 text-dna-copper">Action-Oriented Platform</h3>
              <p className="text-foreground/80">
                Beyond networking: real opportunities, project collaboration, impact tracking, and tangible outcomes. Connection with purpose and results.
              </p>
            </Card>
          </div>

          <Card className="p-6 mt-6 bg-gradient-to-r from-dna-copper/10 to-dna-gold/10 border-2 border-dna-copper/20">
            <h3 className="text-xl font-bold mb-3 text-dna-forest">Our Promise</h3>
            <p className="text-foreground/90 mb-3">
              We are not building a database. <strong>We are building a movement with a digital mobilization engine.</strong> We are not creating a network. We are mobilizing a force for transformation.
            </p>
            <p className="text-foreground/90">
              DNA will make connection frictionless, convening purposeful, collaboration productive, contribution meaningful, and impact visible.
            </p>
          </Card>
        </section>

        <Separator className="mb-12 print:hidden" />

        {/* Call to Action for Different Stakeholders */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Heart className="h-8 w-8 text-dna-copper" />
            Join the Movement
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center bg-gradient-to-br from-dna-emerald/5 to-dna-forest/5 border-2 hover:border-dna-emerald/50 transition-all">
              <div className="mb-4">
                <Users className="h-12 w-12 mx-auto text-dna-emerald" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-dna-forest">For Users</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join thousands of diasporans building Africa's future
              </p>
              <Button className="w-full" variant="default" onClick={() => openStakeholderDialog('User')}>
                Join the Waitlist
              </Button>
            </Card>

            <Card className="p-6 text-center bg-gradient-to-br from-dna-copper/5 to-dna-gold/5 border-2 hover:border-dna-copper/50 transition-all">
              <div className="mb-4">
                <Target className="h-12 w-12 mx-auto text-dna-copper" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-dna-forest">For Partners</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Collaborate with us to amplify your impact
              </p>
              <Button className="w-full" variant="secondary" onClick={() => openStakeholderDialog('Partner')}>
                Explore Partnership
              </Button>
            </Card>

            <Card className="p-6 text-center bg-gradient-to-br from-dna-gold/5 to-dna-copper/5 border-2 hover:border-dna-gold/50 transition-all">
              <div className="mb-4">
                <MateMasie className="h-12 w-12 mx-auto text-dna-gold" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-dna-forest">For Investors</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Support the platform enabling diaspora-driven change
              </p>
              <Button className="w-full" variant="outline" onClick={() => openStakeholderDialog('Investor')}>
                Learn More
              </Button>
            </Card>
          </div>
        </section>

        {/* Sources & References */}
        <section className="mb-12 print:hidden">
          <Card className="p-6 bg-muted/30 border border-muted">
            <h3 className="text-lg font-bold mb-4 text-foreground/80 flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Sources & References
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground/70 mb-2">Statistics & Data</p>
                <ul className="space-y-1">
                  <li>
                    <a href="https://remitscope.org/africa/" target="_blank" rel="noopener noreferrer" className="hover:text-dna-copper flex items-center gap-1">
                      World Bank Remitscope - Africa <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a href="https://gfrid.org/remittances-from-african-diaspora-grew-in-2023-set-to-exceed-100bn-in-2024/" target="_blank" rel="noopener noreferrer" className="hover:text-dna-copper flex items-center gap-1">
                      GFRID Remittances Report 2024 <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a href="https://worldpopulationreview.com/country-rankings/african-diaspora-countries" target="_blank" rel="noopener noreferrer" className="hover:text-dna-copper flex items-center gap-1">
                      World Population Review - Diaspora <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground/70 mb-2">Additional Resources</p>
                <ul className="space-y-1">
                  <li>
                    <a href="https://au.int/en/diaspora-division" target="_blank" rel="noopener noreferrer" className="hover:text-dna-copper flex items-center gap-1">
                      African Union Diaspora Division <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a href="https://thestateofafricandiaspora.com/" target="_blank" rel="noopener noreferrer" className="hover:text-dna-copper flex items-center gap-1">
                      State of African Diaspora <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a href="https://africandiasporanetwork.org/" target="_blank" rel="noopener noreferrer" className="hover:text-dna-copper flex items-center gap-1">
                      African Diaspora Network <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-4">
              Statistics updated January 2025. Data from World Bank, African Development Bank, GFRID, and other cited sources.
            </p>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center py-8 text-muted-foreground border-t border-muted/50">
          <div className="text-sm mb-4">
            Diaspora Network of Africa &copy; {new Date().getFullYear()}
          </div>
          <p className="text-sm text-foreground/60 mb-4">
            Building the infrastructure for systemic change, one connection at a time.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/contact" className="text-dna-copper hover:underline">Contact Us</a>
            <span className="text-muted-foreground/40">|</span>
            <a href="/partner-with-dna" className="text-dna-copper hover:underline">Partner With Us</a>
            <span className="text-muted-foreground/40">|</span>
            <a href="/about" className="text-dna-copper hover:underline">About DNA</a>
            <span className="text-muted-foreground/40">|</span>
            <a href={config.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-dna-copper hover:underline flex items-center gap-1">
              LinkedIn <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Stakeholder Contact Dialog */}
      <ResponsiveModal open={dialogOpen} onOpenChange={setDialogOpen} className="sm:max-w-[500px]">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-2xl font-bold text-dna-forest">
              {stakeholderType === 'User' && 'Join DNA as a User'}
              {stakeholderType === 'Partner' && 'Partner with DNA'}
              {stakeholderType === 'Investor' && 'Invest in DNA'}
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {stakeholderType === 'User' && 'Share your details and we\'ll help you get started on your diaspora journey.'}
              {stakeholderType === 'Partner' && 'Tell us about your organization and how we can collaborate.'}
              {stakeholderType === 'Investor' && 'Learn more about investment opportunities and our vision.'}
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Input
                type="text"
                name="name"
                placeholder="Your Name *"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>
            
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Your Email *"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>
            
            <div>
              <Input
                type="text"
                name="organization"
                placeholder={stakeholderType === 'User' ? 'Your Professional Background' : 'Organization Name'}
                value={formData.organization}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            
            <div>
              <Textarea
                name="message"
                placeholder="Tell us more about your interest..."
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full resize-none"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </Button>
          </form>
        </ResponsiveModal>
    </div>
  );
};

export default FactSheetPage;