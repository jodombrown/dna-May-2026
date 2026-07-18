import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { DemoNavDots } from '@/components/demo/DemoNavDots';
import { DemoOpening } from '@/components/demo/sections/DemoOpening';
import { DemoProblem } from '@/components/demo/sections/DemoProblem';
import { DemoSolution } from '@/components/demo/sections/DemoSolution';
import { DemoInterconnection } from '@/components/demo/sections/DemoInterconnection';
import { DemoJourneys } from '@/components/demo/sections/DemoJourneys';
import { DemoPersonas } from '@/components/demo/sections/DemoPersonas';
import { DemoDIA } from '@/components/demo/sections/DemoDIA';
import { DemoMovement } from '@/components/demo/sections/DemoMovement';

const SECTIONS = [
  { id: 'opening', label: 'The Opening' },
  { id: 'problem', label: 'The Problem' },
  { id: 'solution', label: 'The Solution' },
  { id: 'interconnection', label: 'The Interconnection' },
  { id: 'journeys', label: 'The Journeys' },
  { id: 'personas', label: 'Who We Serve' },
  { id: 'dia', label: 'Meet DIA' },
  { id: 'movement', label: 'The Movement' },
];

export default function Demo() {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    sectionRefs.current.forEach((section, index) => {
      if (!section) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(index);
            }
          });
        },
        { threshold: 0.3, rootMargin: '-10% 0px -10% 0px' }
      );
      
      observer.observe(section);
      observers.push(observer);
    });
    
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const scrollToSection = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  return (
    <>
      <Helmet>
        <title>DNA Demo | The Mobilization Infrastructure for the Global African Diaspora</title>
        <meta name="description" content="Discover how DNA's Five C's methodology transforms scattered diaspora potential into coordinated collective power for Africa's economic transformation." />
      </Helmet>

      <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] overflow-x-hidden">
        {/* Navigation Dots */}
        <DemoNavDots 
          sections={SECTIONS.map(s => s.label)} 
          activeSection={activeSection}
          onNavigate={scrollToSection}
        />

        {/* Section 1: The Opening */}
        <DemoOpening ref={setSectionRef(0)} id="section-0" />

        {/* Section 2: The Problem */}
        <DemoProblem ref={setSectionRef(1)} id="section-1" />

        {/* Section 3: The Solution */}
        <DemoSolution ref={setSectionRef(2)} id="section-2" />

        {/* Section 4: The Interconnection */}
        <DemoInterconnection ref={setSectionRef(3)} id="section-3" />

        {/* Section 5: The Journeys */}
        <DemoJourneys ref={setSectionRef(4)} id="section-4" />

        {/* Section 6: Who We Serve */}
        <DemoPersonas ref={setSectionRef(5)} id="section-5" />

        {/* Section 7: Meet DIA */}
        <DemoDIA ref={setSectionRef(6)} id="section-6" />

        {/* Section 8: The Movement */}
        <DemoMovement ref={setSectionRef(7)} id="section-7" />
      </div>
    </>
  );
}
