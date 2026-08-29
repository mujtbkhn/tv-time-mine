import { useEffect, useState } from 'react';
import { fetchTrending, fetchPopular, fetchTopRated, getImageUrl } from '../services/tmdb';
import HorizontalScroll from '../components/HorizontalScroll';
import { Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShimmerDetail } from '../components/Shimmer';
const Home = () => {
  const navigate = useNavigate();
  const [heroItem, setHeroItem] = useState<any>(null);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingShows, setTrendingShows] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedShows, setTopRatedShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tMovies, tShows, pMovies, trShows] = await Promise.all([
          fetchTrending('movie'),
          fetchTrending('tv'),
          fetchPopular('movie'),
          fetchTopRated('tv')
        ]);
        
        setTrendingMovies(tMovies);
        setTrendingShows(tShows);
        setPopularMovies(pMovies);
        setTopRatedShows(trShows);
        
        // Set a random trending movie as hero
        if (tMovies.length > 0) {
          setHeroItem(tMovies[Math.floor(Math.random() * 5)]);
        }
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) return <ShimmerDetail />;

  return (
    <div>
      {/* Hero Section */}
      {heroItem && (
        <div 
          className="hero-section"
          style={{
            position: 'relative',
            height: '80vh',
            width: '100%',
            backgroundImage: `url(${getImageUrl(heroItem.backdrop_path, 'original')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to top, var(--bg-color) 0%, rgba(15,16,20,0) 50%, rgba(15,16,20,0.8) 100%), linear-gradient(to right, rgba(15,16,20,0.8) 0%, rgba(15,16,20,0) 50%)'
            }}
          />
          
          <div className="container" style={{ position: 'absolute', bottom: '15%', left: 0, right: 0 }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.5)', maxWidth: '60%' }}>
              {heroItem.title || heroItem.name}
            </h1>
            <p style={{ maxWidth: '50%', fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '20px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {heroItem.overview?.slice(0, 150)}...
            </p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/detail/${heroItem.media_type || 'movie'}/${heroItem.id}`)}
              >
                <Play size={20} /> Play
              </button>
              <button 
                className="btn btn-glass"
                onClick={() => navigate(`/detail/${heroItem.media_type || 'movie'}/${heroItem.id}`)}
              >
                <Info size={20} /> More Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div style={{ marginTop: '-50px', position: 'relative', zIndex: 10, paddingBottom: '50px' }}>
        <HorizontalScroll title="Trending Movies" items={trendingMovies} mediaType="movie" />
        <HorizontalScroll title="Trending Shows" items={trendingShows} mediaType="tv" />
        <HorizontalScroll title="Popular Movies" items={popularMovies} mediaType="movie" />
        <HorizontalScroll title="Top Rated Shows" items={topRatedShows} mediaType="tv" />
      </div>
    </div>
  );
};

export default Home;
