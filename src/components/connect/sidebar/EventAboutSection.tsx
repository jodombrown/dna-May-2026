
import React from 'react';
import { Event } from '@/types/search';

interface EventAboutSectionProps {
  event: Event;
}

const EventAboutSection: React.FC<EventAboutSectionProps> = ({ event }) => {
  const getEnhancedDescription = (eventTitle: string) => {
    if (eventTitle === "African Tech Summit 2025") {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Experience three days of inspiring keynotes, interactive workshops, and unparalleled networking opportunities 
            that bring together the brightest minds in African technology innovation.
          </p>
          <p>
            Whether you're a startup founder, seasoned tech executive, or aspiring innovator, this summit offers valuable insights 
            into the latest trends, emerging technologies, and investment opportunities across the African tech ecosystem.
          </p>
          <p>
            Join industry leaders, venture capitalists, and government officials as they discuss the future of digital transformation, 
            fintech innovations, AI applications, and sustainable technology solutions for Africa's development.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('investment') || eventTitle.toLowerCase().includes('diaspora')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Discover high-impact investment opportunities across African markets while connecting with fellow diaspora investors 
            and successful entrepreneurs who are driving economic growth on the continent.
          </p>
          <p>
            Learn about due diligence best practices, market entry strategies, and portfolio diversification techniques 
            specifically tailored for the African investment landscape.
          </p>
          <p>
            Network with fund managers, angel investors, and family offices who share your commitment to supporting 
            Africa's entrepreneurial ecosystem and sustainable development goals.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('women')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Empower your leadership journey through intensive workshops focused on executive presence, strategic thinking, 
            and navigating complex organizational dynamics in technology and business environments.
          </p>
          <p>
            Connect with successful African women leaders who will share their experiences overcoming challenges, 
            building inclusive teams, and creating opportunities for the next generation.
          </p>
          <p>
            Gain access to exclusive mentorship programs, peer support networks, and career advancement resources 
            designed specifically for African women in STEM and leadership roles.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('health') || eventTitle.toLowerCase().includes('medical')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Explore cutting-edge digital health solutions, telemedicine platforms, and medical device innovations 
            that are revolutionizing healthcare delivery across African communities.
          </p>
          <p>
            Learn from healthcare entrepreneurs, medical professionals, and technology innovators who are addressing 
            critical health challenges through scalable, affordable solutions.
          </p>
          <p>
            Discover funding opportunities, regulatory pathways, and partnership models for bringing health technologies 
            to underserved populations across the continent.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('energy') || eventTitle.toLowerCase().includes('climate')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Dive deep into renewable energy projects, sustainable development initiatives, and climate adaptation strategies 
            that are creating economic opportunities while addressing environmental challenges.
          </p>
          <p>
            Network with clean energy entrepreneurs, impact investors, and policy makers who are driving the transition 
            to sustainable energy systems across African markets.
          </p>
          <p>
            Explore innovative financing mechanisms, technology partnerships, and community engagement models 
            for scaling clean energy solutions in rural and urban settings.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('agri') || eventTitle.toLowerCase().includes('food')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Discover precision agriculture technologies, supply chain innovations, and digital platforms that are 
            transforming food systems and improving livelihoods for smallholder farmers.
          </p>
          <p>
            Learn about climate-smart farming practices, market access solutions, and financial inclusion tools 
            that are increasing productivity and resilience in agricultural communities.
          </p>
          <p>
            Connect with agtech entrepreneurs, development organizations, and investors who are building 
            sustainable food security solutions for Africa's growing population.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('creative') || eventTitle.toLowerCase().includes('art')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Celebrate the vibrant creativity of the African diaspora through networking opportunities with artists, 
            designers, filmmakers, and cultural entrepreneurs who are shaping global narratives.
          </p>
          <p>
            Explore monetization strategies, digital platforms, and international market opportunities 
            for creative professionals looking to expand their reach and impact.
          </p>
          <p>
            Connect with galleries, production companies, and cultural institutions that support 
            African creative talent and promote authentic storytelling on the global stage.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('youth') || eventTitle.toLowerCase().includes('leadership')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Develop essential leadership skills through interactive workshops focused on communication, 
            strategic thinking, and building high-performance teams in diverse environments.
          </p>
          <p>
            Learn from accomplished African leaders who will share insights on navigating career challenges, 
            building professional networks, and creating positive impact in your communities.
          </p>
          <p>
            Access mentorship opportunities, leadership development programs, and peer networks 
            that will support your growth as a change-maker and innovator.
          </p>
        </div>
      );
    }
    
    if (eventTitle.toLowerCase().includes('financial') || eventTitle.toLowerCase().includes('fintech')) {
      return (
        <div className="space-y-3 text-neutral-600">
          <p>
            Explore groundbreaking fintech solutions, digital payment systems, and mobile banking innovations 
            that are driving financial inclusion across African markets.
          </p>
          <p>
            Learn about regulatory frameworks, partnership opportunities, and scaling strategies 
            for financial technology companies operating in diverse African economies.
          </p>
          <p>
            Network with fintech founders, financial services executives, and investors who are 
            building the future of digital finance on the continent.
          </p>
        </div>
      );
    }
    
    // Default enhanced description
    return (
      <div className="space-y-3 text-neutral-600">
        <p>
          Join us for an incredible event that brings together the best minds in the African diaspora. 
          This is your opportunity to network, learn, and contribute to meaningful conversations that shape our future.
        </p>
        <p>
          Connect with like-minded professionals, discover new opportunities, and be part of a community 
          that's driving positive change across Africa and the diaspora.
        </p>
        <p>
          Whether you're looking to expand your network, learn from industry experts, or explore collaboration opportunities, 
          this event offers valuable insights and connections for your professional journey.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">About Event</h3>
      {getEnhancedDescription(event.title)}
    </div>
  );
};

export default EventAboutSection;
