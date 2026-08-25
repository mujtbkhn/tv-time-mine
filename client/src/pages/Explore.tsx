import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchDiscover } from '../services/tmdb';
import MovieCard from '../components/MovieCard';

interface ExploreProps {
  type: 'movie' | 'tv';
}

const Explore: React.FC<ExploreProps> = ({ type }) => {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Reset when type changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [type]);

  useEffect(() => {
    const loadMore = async () => {
      try {
        setLoading(true);
        const data = await fetchDiscover(type, page);
        setItems(prev => {
          // Filter duplicates just in case
          const newItems = data.results.filter((i: any) => !prev.some(p => p.id === i.id));
          return [...prev, ...newItems];
        });
        setHasMore(data.page < data.total_pages);
      } catch (error) {
        console.error("Failed to load explore data", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMore();
  }, [type, page]);

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <h1 className="section-title">Explore {type === 'movie' ? 'Movies' : 'TV Series'}</h1>
      
      <div className="grid-cards" style={{ paddingBottom: '50px' }}>
        {items.map((item, index) => {
          if (items.length === index + 1) {
            return (
              <div ref={lastElementRef} key={`${item.id}-${index}`}>
                <MovieCard item={item} mediaType={type} />
              </div>
            );
          } else {
            return (
              <div key={`${item.id}-${index}`}>
                <MovieCard item={item} mediaType={type} />
              </div>
            );
          }
        })}
      </div>
      
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading more...</div>}
    </div>
  );
};

export default Explore;
