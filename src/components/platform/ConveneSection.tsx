import React, { useState } from 'react';
import { Calendar, MapPin, Users, ArrowRight, Clock, Globe, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SwipeableCardStack from './SwipeableCardStack';
import { Nkonsonkonson } from '@/components/icons/adinkra';
import PillarInfoSheet from './PillarInfoSheet';

const ConveneSection = () => {
  const [infoOpen, setInfoOpen] = useState(false);

  const events = [
    {
      title: 'African Tech Summit 2025',
      type: 'Tech Conference',
      description: "Leading innovators shaping Africa's digital transformation and future.",
      date: 'March 15',
      time: '2:00 PM WAT',
      location: 'Lagos, Nigeria',
      attendees: '250+ attendees registered',
      host: 'African Tech Leaders',
      format: 'Hybrid',
      gradient: 'from-dna-copper to-dna-gold',
      featured: true,
      categoryTitle: 'Innovation Summits',
      categorySubtitle: 'Shape the future together',
    },
    {
      title: 'Afrobeats & Innovation Festival',
      type: 'Cultural Celebration',
      description: 'Celebrating the intersection of African culture, music, and entrepreneurship.',
      date: 'March 20',
      time: '5:00 PM GMT',
      location: 'London, UK',
      attendees: '800+ attendees registered',
      host: 'UK Diaspora Cultural Alliance',
      format: 'In-Person',
      gradient: 'from-dna-gold to-dna-ochre',
      featured: true,
      categoryTitle: 'Cultural Gatherings',
      categorySubtitle: 'Connect through heritage',
    },
    {
      title: 'Startup Networking Mixer',
      type: 'Networking Mixer',
      description: 'Connect with founders, investors, and innovators building the next wave.',
      date: 'March 25',
      time: '6:30 PM EST',
      location: 'New York, USA',
      attendees: '120+ attendees registered',
      host: 'DNA NYC Chapter',
      format: 'In-Person',
      gradient: 'from-dna-ochre to-dna-emerald',
      featured: false,
      categoryTitle: 'Networking Meetups',
      categorySubtitle: 'Grow your circle',
    },
    {
      title: 'AI in Healthcare Webinar Series',
      type: 'Webinar Series',
      description: 'Expert insights on leveraging AI to transform healthcare across Africa.',
      date: 'March 28',
      time: '3:00 PM GMT',
      location: 'Virtual Event',
      attendees: '600+ attendees registered',
      host: 'HealthTech Innovators Network',
      format: 'Virtual',
      gradient: 'from-dna-emerald to-dna-forest',
      featured: false,
      categoryTitle: 'Knowledge Sessions',
      categorySubtitle: 'Learn from the best',
    },
    {
      title: 'Toronto Diaspora Meetup',
      type: 'Local Meetup',
      description: 'Monthly gathering for diaspora professionals to connect and collaborate.',
      date: 'April 2',
      time: '7:00 PM EST',
      location: 'Toronto, Canada',
      attendees: '45+ attendees registered',
      host: 'DNA Toronto Hub',
      format: 'In-Person',
      gradient: 'from-dna-forest to-dna-copper',
      featured: false,
      categoryTitle: 'Local Communities',
      categorySubtitle: 'Build local bonds',
    },
  ];

  const handleCardClick = (_index: number) => {
    setInfoOpen(true);
  };

  const renderCard = (event: typeof events[0]) => (
    <div className={`bg-gradient-to-br ${event.gradient} rounded-xl p-1.5 shadow-2xl h-full w-full`}>
      <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col">
        <div className={`bg-gradient-to-r ${event.gradient} text-white p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg font-serif">{event.categoryTitle}</h3>
            <Nkonsonkonson className="w-6 h-6" />
          </div>
          <p className="text-sm text-white/80">{event.categorySubtitle}</p>
        </div>
        
        <div className="p-6 space-y-6 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-dna-copper text-white text-xs">{event.type}</Badge>
              {event.featured && (
                <div className="flex items-center gap-1 text-dna-gold">
                  <Nkonsonkonson className="w-3 h-3" />
                  <span className="text-xs font-bold">Featured</span>
                </div>
              )}
            </div>
            <h4 className="font-bold text-xl text-neutral-900 mb-2">{event.title}</h4>
            <p className="text-xs text-neutral-600 line-clamp-2 mb-3">{event.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-neutral-700">
              <Calendar className="w-4 h-4 text-dna-copper flex-shrink-0" />
              <span className="text-sm font-medium">{event.date}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-700">
              <Clock className="w-4 h-4 text-dna-copper flex-shrink-0" />
              <span className="text-sm font-medium">{event.time}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-700">
              {event.format === 'Hybrid' ? (
                <Globe className="w-4 h-4 text-dna-copper flex-shrink-0" />
              ) : event.format === 'Virtual' ? (
                <Video className="w-4 h-4 text-dna-copper flex-shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-dna-copper flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{event.location}</span>
            </div>
          </div>

          <div className="bg-dna-copper/5 rounded-xl p-4 border-2 border-dna-copper/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-dna-copper" />
                <span className="text-sm font-semibold text-neutral-900">{event.attendees}</span>
              </div>
              <Badge variant="secondary" className="text-xs">{event.format}</Badge>
            </div>
            <p className="text-xs text-neutral-600">
              Hosted by {event.host}
            </p>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-dna-copper to-dna-gold hover:from-dna-gold hover:to-dna-copper text-white font-semibold"
          >
            RSVP Now
          </Button>

          <p className="text-xs text-center text-neutral-500">
            After RSVP, create your own event →
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section id="convene-section" className="py-16 px-12 sm:px-10 lg:px-8 bg-neutral-50">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
          {/* Left: Card Preview (Desktop) / Swipeable Cards (Mobile) */}
          <div className="order-2 lg:order-1">
            <SwipeableCardStack
              cards={events.map((event) => renderCard(event))}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Right: Text Content */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-dna-copper to-dna-gold rounded-xl flex items-center justify-center">
                <Nkonsonkonson className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-neutral-900">Convene</h2>
            </div>
            <p className="text-xl font-semibold text-neutral-900 mb-3">
              Where Strategy Meets Action
            </p>
            <p className="text-lg text-neutral-600 mb-6">
              Join convenings designed for decision-making, not just discussion. Whether virtual or in-person, intimate or large-scale, these are spaces where ideas become initiatives, conversations become commitments, and attendees leave with next steps. Your participation accelerates both your goals and the movement.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Nkonsonkonson className="w-4 h-4 text-dna-copper" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Intentional Gathering Design</h3>
                  <p className="text-sm text-neutral-600">Every convening has clear objectives, structured agendas, and tangible outcomes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-dna-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Commitment Culture</h3>
                  <p className="text-sm text-neutral-600">Attendees arrive prepared, participate actively, and leave with action items</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-dna-forest" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Momentum Through Frequency</h3>
                  <p className="text-sm text-neutral-600">Regular convenings create sustained progress, not one-time inspiration</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/convene')}
              className="bg-dna-copper hover:bg-dna-gold text-white inline-flex items-center gap-2"
            >
              Explore Events
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConveneSection;
