import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeableCardStackProps {
  cards: React.ReactNode[];
  onCardClick?: (index: number) => void;
}

const SwipeableCardStack = ({ cards, onCardClick }: SwipeableCardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
    // Prevent page scroll when interacting with cards
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Only prevent default if there's horizontal movement to allow vertical scroll
    if (Math.abs(diff) > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Swipe threshold: 50px (lower for smoother experience)
    if (dragOffset > 50 && currentIndex > 0) {
      handlePrevious();
    } else if (dragOffset < -50 && currentIndex < cards.length - 1) {
      handleNext();
    }
    
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (dragOffset > 50 && currentIndex > 0) {
      handlePrevious();
    } else if (dragOffset < -50 && currentIndex < cards.length - 1) {
      handleNext();
    }
    
    setDragOffset(0);
  };

  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Only trigger click if it wasn't a drag
    if (Math.abs(dragOffset) < 5 && onCardClick) {
      e.stopPropagation();
      onCardClick(currentIndex);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Card Stack Container - Cascading Layout */}
      <div 
        ref={containerRef}
        className="relative h-[480px] sm:h-[520px]"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging) {
            setIsDragging(false);
            setDragOffset(0);
          }
        }}
      >
        {cards.map((card, index) => {
          const offset = index - currentIndex;
          const isActive = index === currentIndex;
          
          // Calculate cascading transform based on position - inspired by coffee shop layered cards
          let transform = '';
          let zIndex = cards.length - offset;
          let opacity = 1;
          
          if (offset < 0) {
            // Cards before current (hidden to the left with rotation)
            transform = `translateX(-120%) rotate(-8deg) scale(0.9)`;
            opacity = 0;
            zIndex = 0;
          } else if (offset === 0) {
            // Current active card - centered with subtle tilt
            const dragTransform = isDragging ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.02}deg)` : '';
            transform = `translateX(0) translateY(0) rotate(1deg) scale(1) ${dragTransform}`;
            opacity = 1;
            zIndex = 30;
          } else {
            // Cards after current - cascading with varied rotations like scattered papers
            const cardRotations = ['-3deg', '2deg', '-4deg', '3deg', '-2deg'];
            const rotation = cardRotations[(offset - 1) % cardRotations.length] || '0deg';
            
            // Create layered cascade effect
            const xOffset = offset * 12; // Horizontal spread
            const yOffset = offset * -8; // Vertical lift (negative for upward cascade)
            const scale = 1 - (offset * 0.03); // Slight size reduction
            
            transform = `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${rotation}) scale(${scale})`;
            opacity = Math.max(0.6, 1 - offset * 0.15);
            zIndex = 30 - offset;
          }

          return (
            <div
              key={index}
              className={`absolute inset-0 cursor-pointer select-none ${
                isActive ? 'pointer-events-auto' : 'pointer-events-none'
              } ${isDragging && isActive ? '' : 'transition-all duration-500 ease-out'}`}
              style={{
                transform,
                zIndex,
                opacity,
              }}
              onClick={handleCardClick}
            >
              {card}
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`p-3 rounded-full bg-white shadow-lg transition-all ${
            currentIndex === 0 
              ? 'opacity-30 cursor-not-allowed' 
              : 'hover:bg-neutral-50 active:scale-95'
          }`}
          aria-label="Previous card"
        >
          <ChevronLeft className="w-6 h-6 text-neutral-700" />
        </button>

        {/* Indicator Dots */}
        <div className="flex items-center gap-2">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-dna-emerald'
                  : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className={`p-3 rounded-full bg-white shadow-lg transition-all ${
            currentIndex === cards.length - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-neutral-50 active:scale-95'
          }`}
          aria-label="Next card"
        >
          <ChevronRight className="w-6 h-6 text-neutral-700" />
        </button>
      </div>

      {/* Swipe Hint */}
      <div className="text-center mt-4">
        <p className="text-sm text-neutral-500">← Swipe to explore →</p>
      </div>
    </div>
  );
};

export default SwipeableCardStack;
