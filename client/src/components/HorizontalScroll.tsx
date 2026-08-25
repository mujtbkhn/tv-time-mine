import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

interface HorizontalScrollProps {
  title: string;
  items: any[];
  mediaType?: 'movie' | 'tv';
}

const HorizontalScroll: React.FC<HorizontalScrollProps> = ({ title, items, mediaType }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth + 200 : clientWidth - 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="section" style={{ position: 'relative' }}>
      <div className="container">
        <h2 className="section-title">{title}</h2>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            className="scroll-btn left glass"
            onClick={() => scroll('left')}
            style={{ ...scrollBtnStyle, left: '-20px' }}
          >
            <ChevronLeft size={24} />
          </button>
          
          <div 
            ref={scrollRef}
            className="hide-scrollbar"
            style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              padding: '20px 0', // Padding for hover effects to not get cut off
            }}
          >
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} style={{ scrollSnapAlign: 'start', width: '200px', flexShrink: 0 }}>
                <MovieCard item={item} mediaType={mediaType} />
              </div>
            ))}
          </div>

          <button 
            className="scroll-btn right glass"
            onClick={() => scroll('right')}
            style={{ ...scrollBtnStyle, right: '-20px' }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

const scrollBtnStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 20,
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
};

export default HorizontalScroll;
