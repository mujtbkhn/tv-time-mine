import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDetails, getImageUrl } from '../services/tmdb';
import HorizontalScroll from '../components/HorizontalScroll';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Heart, Plus } from 'lucide-react';

const DetailPage = () => {
  const { mediaType, id } = useParams<{ mediaType: 'movie' | 'tv' | 'person', id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const getDetails = async () => {
      try {
        setLoading(true);
        if (mediaType && id) {
          const details = await fetchDetails(mediaType, id);
          setData(details);
        }
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    getDetails();
  }, [mediaType, id]);

  const handleAddToList = async (listType: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/lists/add', {
        tmdbId: id,
        mediaType,
        listType,
        title: data.title || data.name,
        posterPath: data.poster_path,
        releaseDate: data.release_date || data.first_air_date,
        genreIds: data.genres ? data.genres.map((g: any) => g.id) : []
      });
      toast.success(`Added to ${listType.replace('_', ' ')}!`);
      if (listType === 'favourites') setIsLiked(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error adding to list');
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!data) return <div>Not found</div>;

  if (mediaType === 'person') {
    const profileImage = getImageUrl(data.profile_path, 'h632');
    return (
      <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '50px' }}>
        <div className="grid-person">
          <div>
            <img 
              src={profileImage} 
              alt={data.name} 
              style={{ width: '100%', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Image'}
            />
            <div className="glass" style={{ marginTop: '20px', padding: '20px', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Personal Info</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Known For</span>
                  <div>{data.known_for_department}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gender</span>
                  <div>{data.gender === 1 ? 'Female' : data.gender === 2 ? 'Male' : 'Other'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Birthday</span>
                  <div>{data.birthday}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Place of Birth</span>
                  <div>{data.place_of_birth}</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px' }}>{data.name}</h1>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Biography</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '40px', whiteSpace: 'pre-wrap' }}>
              {data.biography || "We don't have a biography for this person."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const bgImage = getImageUrl(data.backdrop_path, 'original');
  const posterImage = getImageUrl(data.poster_path, 'w500');

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
      {/* Detail Hero Section */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          height: '60vh',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to top, var(--bg-color) 0%, rgba(15,16,20,0.8) 100%)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        <div className="container hero-detail-content" style={{ position: 'relative', height: '100%' }}>
          <img 
            src={posterImage} 
            alt={data.title || data.name} 
            className="hero-poster"
          />
          <div style={{ paddingBottom: '20px' }}>
            <h1 className="hero-title">{data.title || data.name}</h1>
            <div style={{ display: 'flex', gap: '15px', color: 'var(--text-secondary)', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span>{data.release_date || data.first_air_date}</span>
              <span>•</span>
              {data.runtime && <span>{Math.floor(data.runtime / 60)}h {data.runtime % 60}m</span>}
              {data.number_of_seasons && <span>{data.number_of_seasons} Seasons</span>}
              <span>•</span>
              <span>{data.genres?.map((g: any) => g.name).join(', ')}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'gold' }}>★</span> {data.vote_average?.toFixed(1)}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button 
                className="btn btn-glass"
                onClick={() => handleAddToList('favourites')}
                style={{ color: isLiked ? 'var(--primary-color)' : 'white' }}
              >
                <Heart size={20} fill={isLiked ? 'var(--primary-color)' : 'none'} /> 
                {isLiked ? 'Favorited' : 'Favorite'}
              </button>
              
              {mediaType === 'movie' && (
                <button 
                  className="btn btn-glass"
                  onClick={() => handleAddToList('my_movies')}
                >
                  <Plus size={20} /> Add to Movies
                </button>
              )}
              {mediaType === 'tv' && (
                <button 
                  className="btn btn-glass"
                  onClick={() => handleAddToList('my_shows')}
                >
                  <Plus size={20} /> Add to Shows
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '80px' }}>
        <div className="grid-sidebar">
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Overview</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '40px' }}>
              {data.overview}
            </p>

            {/* Cast Horizontal Scroll */}
            {data.credits?.cast && data.credits.cast.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Top Cast</h3>
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {data.credits.cast.slice(0, 10).map((person: any) => (
                    <div key={person.id} style={{ minWidth: '120px', width: '120px', cursor: 'pointer' }} onClick={() => navigate(`/detail/person/${person.id}`)}>
                      <img 
                        src={getImageUrl(person.profile_path, 'w185')} 
                        alt={person.name}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x180?text=No+Image'}
                      />
                      <h5 style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>{person.name}</h5>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{person.character}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Images */}
            {data.images?.backdrops && data.images.backdrops.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Images</h3>
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {data.images.backdrops.slice(0, 6).map((img: any, i: number) => (
                    <div key={i} style={{ minWidth: '300px', width: '300px' }}>
                      <img 
                        src={getImageUrl(img.file_path, 'w500')} 
                        alt={`Scene ${i}`}
                        style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', alignSelf: 'start' }}>
            <h4 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Facts</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status</span>
                <div>{data.status}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Original Language</span>
                <div>{data.original_language?.toUpperCase()}</div>
              </div>
              {data.budget > 0 && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Budget</span>
                  <div>${(data.budget / 1000000).toFixed(1)}M</div>
                </div>
              )}
              {data.revenue > 0 && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Revenue</span>
                  <div>${(data.revenue / 1000000).toFixed(1)}M</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar content */}
      {data.similar?.results && data.similar.results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <HorizontalScroll 
            title={`Similar ${mediaType === 'movie' ? 'Movies' : 'Shows'}`} 
            items={data.similar.results} 
            mediaType={mediaType as any} 
          />
        </div>
      )}
    </div>
  );
};

export default DetailPage;
