import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { ManifestoSection } from '@/components/manifesto/ManifestoSection';
import { ManifestoLine } from '@/components/manifesto/ManifestoLine';
import { ManifestoLink } from '@/components/manifesto/ManifestoLink';
import { ManifestoCTA } from '@/components/manifesto/ManifestoCTA';

const Manifesto = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <PageSEO
        title="The DNA Manifesto | We Are the Code That Survived"
        description="They scattered us across oceans. But you cannot erase what is written in the body. We are 200 million strong. We are DNA."
        canonicalPath="/manifesto"
        keywords={['manifesto', 'african diaspora', 'DNA movement', 'collective power', 'africa rising']}
      />

      {/* Section I */}
      <ManifestoSection number="I">
        <ManifestoLine>They scattered us across oceans.</ManifestoLine>
        <ManifestoLine delay={0.1}>Stripped our names. Silenced our tongues.</ManifestoLine>
        <ManifestoLine delay={0.2}>Drew borders through our bloodlines and called it history.</ManifestoLine>
        <ManifestoLine delay={0.4}>But they forgot one thing:</ManifestoLine>
        <ManifestoLine bold delay={0.5}>You cannot erase what is written in the body.</ManifestoLine>
      </ManifestoSection>

      {/* Section II */}
      <ManifestoSection number="II">
        <ManifestoLine>For four hundred years, the strand stretched.</ManifestoLine>
        <ManifestoLine delay={0.1}>Across the Atlantic. Through the Caribbean. Into the Americas, Europe, and beyond.</ManifestoLine>
        <ManifestoLine delay={0.2}>It bent. It strained. It was tested by every cruelty human beings can invent.</ManifestoLine>
        <ManifestoLine bold delay={0.3}>It never broke.</ManifestoLine>
      </ManifestoSection>

      {/* Section III */}
      <ManifestoSection number="III">
        <ManifestoLine>
          We are <ManifestoLink to="/about" variant="subtle">200 million</ManifestoLink> strong now.
        </ManifestoLine>
        <ManifestoLine delay={0.1}>Scattered, yes, but not separated.</ManifestoLine>
        <ManifestoLine delay={0.2}>In Brooklyn bodegas and London flats.</ManifestoLine>
        <ManifestoLine delay={0.3}>In São Paulo favelas and Toronto high-rises.</ManifestoLine>
        <ManifestoLine delay={0.4}>In Accra markets and Nairobi startups.</ManifestoLine>
        <ManifestoLine delay={0.5}>In Dubai offices and Paris studios.</ManifestoLine>
        <ManifestoLine delay={0.6}>In Mumbai tech hubs and Beijing trading floors.</ManifestoLine>
        <ManifestoLine delay={0.7}>
          Wherever we are, we carry her with us. <span className="font-bold text-[#2D5A4A]">Mother Africa's instructions are in our cells.</span>
        </ManifestoLine>
      </ManifestoSection>

      {/* Section IV */}
      <ManifestoSection number="IV">
        <ManifestoLine>We are doctors healing communities and drivers navigating new cities.</ManifestoLine>
        <ManifestoLine delay={0.1}>Engineers building the future and entrepreneurs taking risks.</ManifestoLine>
        <ManifestoLine delay={0.2}>Artists capturing our truth and activists demanding justice.</ManifestoLine>
        <ManifestoLine delay={0.3}>Teachers shaping minds and traders moving markets.</ManifestoLine>
        <ManifestoLine delay={0.4}>Students dreaming of tomorrow and elders carrying yesterday.</ManifestoLine>
        <ManifestoLine delay={0.5}>First-generation finding footing and second-generation finding roots.</ManifestoLine>
        <ManifestoLine delay={0.6}>Those who left last year and those whose families left generations ago.</ManifestoLine>
        <ManifestoLine bold delay={0.7}>All of us. Dreamers who never stopped dreaming of home.</ManifestoLine>
      </ManifestoSection>

      {/* Section V */}
      <ManifestoSection number="V">
        <ManifestoLine>
          We send <ManifestoLink to="/fact-sheet" variant="subtle">$100 billion</ManifestoLink> back each year, more than all foreign aid combined.
        </ManifestoLine>
        <ManifestoLine delay={0.1}>We build schools we'll never sit in. Fund hospitals we'll never visit.</ManifestoLine>
        <ManifestoLine delay={0.2}>Support families we haven't hugged in years.</ManifestoLine>
        <ManifestoLine bold delay={0.3}>We have always been the largest investor in Africa's future.</ManifestoLine>
        <ManifestoLine delay={0.5}>But we've been doing it alone.</ManifestoLine>
        <ManifestoLine delay={0.6}>Fragmented. Uncoordinated. Invisible to each other.</ManifestoLine>
      </ManifestoSection>

      {/* Section VI */}
      <ManifestoSection number="VI">
        <ManifestoLine bold>What if we could see ourselves?</ManifestoLine>
        <ManifestoLine delay={0.1}>What if the nurse in Houston knew the tech founder in Lagos was building exactly what her community needs?</ManifestoLine>
        <ManifestoLine delay={0.2}>What if the teacher in London could find the youth program in Dakar that's been waiting for her expertise?</ManifestoLine>
        <ManifestoLine delay={0.3}>What if the investor in Atlanta could discover the social enterprise in Kigali that turns $10,000 into 100 jobs?</ManifestoLine>
        <ManifestoLine delay={0.4}>What if the student in Berlin could mentor with the executive in Johannesburg who walked her same path twenty years ago?</ManifestoLine>
        <ManifestoLine delay={0.5}>What if the grandmother in Kingston could finally teach the recipes she's been saving for family she's never met?</ManifestoLine>
        <ManifestoLine bold delay={0.6}>What if the diaspora could finally operate as one?</ManifestoLine>
      </ManifestoSection>

      {/* Section VII */}
      <ManifestoSection number="VII">
        <ManifestoLine bold>This is why we built DNA.</ManifestoLine>
        <ManifestoLine delay={0.1}>Not an app. Not a directory. Infrastructure for collective power.</ManifestoLine>
        <ManifestoLine delay={0.2}>
          A place to <ManifestoLink to="/connect" variant="five-c">CONNECT</ManifestoLink>. To find your people across borders and generations.
        </ManifestoLine>
        <ManifestoLine delay={0.3}>
          A place to <ManifestoLink to="/convene" variant="five-c">CONVENE</ManifestoLink>. To gather, celebrate, strategize, and remember together.
        </ManifestoLine>
        <ManifestoLine delay={0.4}>
          A place to <ManifestoLink to="/collaborate" variant="five-c">COLLABORATE</ManifestoLink>. To build together what none of us could build alone.
        </ManifestoLine>
        <ManifestoLine delay={0.5}>
          A place to <ManifestoLink to="/contribute" variant="five-c">CONTRIBUTE</ManifestoLink>. To give not just money, but time, knowledge, networks, and love.
        </ManifestoLine>
        <ManifestoLine delay={0.6}>
          A place to <ManifestoLink to="/convey" variant="five-c">CONVEY</ManifestoLink>. To amplify the stories that have been whispered for too long.
        </ManifestoLine>
      </ManifestoSection>

      {/* Section VIII */}
      <ManifestoSection number="VIII">
        <ManifestoLine>We named it DNA for a reason.</ManifestoLine>
        <ManifestoLine delay={0.1}>Because this network is not optional. It is not a nice-to-have.</ManifestoLine>
        <ManifestoLine bold delay={0.2}>It is who we are.</ManifestoLine>
        <ManifestoLine delay={0.4}>The same code that kept our ancestors alive is the code that will transform our continent.</ManifestoLine>
        <ManifestoLine delay={0.5}>DNA replicates. It passes itself forward. It carries instructions across generations.</ManifestoLine>
        <ManifestoLine bold delay={0.6}>So will we.</ManifestoLine>
      </ManifestoSection>

      {/* Section IX */}
      <ManifestoSection number="IX">
        <ManifestoLine bold>The strand was never broken.</ManifestoLine>
        <ManifestoLine delay={0.1}>We are simply making it visible again.</ManifestoLine>
        <ManifestoLine delay={0.2}>giving it structure,</ManifestoLine>
        <ManifestoLine delay={0.3}>giving it pathways,</ManifestoLine>
        <ManifestoLine delay={0.4}>giving it purpose.</ManifestoLine>
      </ManifestoSection>

      {/* Section X */}
      <ManifestoSection number="X" isLast>
        <ManifestoLine>
          <ManifestoLink to="/africa/west-africa" variant="subtle">Africa is rising.</ManifestoLink>
        </ManifestoLine>
        <ManifestoLine delay={0.1}>And her children, all of us, everywhere, are part of that rise.</ManifestoLine>
        <ManifestoLine delay={0.2}>Not as outsiders looking in.</ManifestoLine>
        <ManifestoLine delay={0.3}>Not as donors with conditions.</ManifestoLine>
        <ManifestoLine bold delay={0.4}>As family. Coming home. Building together.</ManifestoLine>
        <ManifestoLine delay={0.6}>This is the moment.</ManifestoLine>
        <ManifestoLine delay={0.7}>This is the movement.</ManifestoLine>
        <ManifestoLine delay={0.8}>This is the mission.</ManifestoLine>
        <ManifestoLine bold delay={1.0} className="!text-4xl md:!text-6xl !mb-6 md:!mb-8">
          We are DNA.
        </ManifestoLine>
        <ManifestoLine delay={1.2}>And we've been waiting for you.</ManifestoLine>
        <ManifestoCTA />
      </ManifestoSection>
    </div>
  );
};

export default Manifesto;
