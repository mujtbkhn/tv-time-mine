import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDetails, getImageUrl, fetchSeasonDetails } from '../services/tmdb';
import HorizontalScroll from '../components/HorizontalScroll';
import { AuthContext } from '../context/AuthContext';
import { ListContext } from '../context/ListContext';
import { ShimmerDetail } from '../components/Shimmer';

import { Heart, Plus, Minus, Eye, ListPlus } from 'lucide-react';

const DetailPage = () => {
  const { mediaType, id } = useParams<{ mediaType: 'movie' | 'tv' | 'person', id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const { isInList, toggleListItem, customListNames } = useContext(ListContext);
  const navigate = useNavigate();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonDetails, setSeasonDetails] = useState<any>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

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

  useEffect(() => {
    const getSeasonDetails = async () => {
      if (mediaType === 'tv' && id) {
        try {
          setLoadingSeason(true);
          const details = await fetchSeasonDetails(id, selectedSeason);
          setSeasonDetails(details);
        } catch (error) {
          console.error("Failed to fetch season details", error);
        } finally {
          setLoadingSeason(false);
        }
      }
    };
    if (data && mediaType === 'tv') {
      getSeasonDetails();
    }
  }, [selectedSeason, data, id, mediaType]);

  const handleToggleList = async (listType: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleListItem({
      tmdbId: id,
      mediaType,
      listType,
      title: data.title || data.name,
      posterPath: data.poster_path,
      releaseDate: data.release_date || data.first_air_date,
      genreIds: data.genres ? data.genres.map((g: any) => g.id) : []
    }, listType);
  };

  if (loading) return <ShimmerDetail />;
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
  
  const isFavourite = isInList(id || '', 'favourites');
  const isAdded = isInList(id || '', mediaType === 'movie' ? 'my_movies' : 'my_shows');
  const isWatched = isInList(id || '', 'watched');

  const averageEpisodeLength = data.episode_run_time?.length > 0 
    ? Math.round(data.episode_run_time.reduce((a: number, b: number) => a + b, 0) / data.episode_run_time.length) 
    : data.runtime;

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
            // background: 'linear-gradient(to top, var(--bg-color) 0%, rgba(15,16,20,0.8) 100%)',
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
            <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              {data.title || data.name}
              {mediaType === 'tv' && data.status && (
                <span style={{ 
                  background: data.status === 'Ended' || data.status === 'Canceled' ? 'rgba(255,0,0,0.2)' : 'rgba(16, 185, 129, 0.2)', 
                  color: data.status === 'Ended' || data.status === 'Canceled' ? '#ff4d4d' : '#10b981',
                  padding: '4px 10px', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {data.status === 'Returning Series' ? 'Airing' : data.status}
                </span>
              )}
            </h1>
            <div style={{ display: 'flex', gap: '15px', color: 'var(--text-secondary)', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'white' }}>
                {mediaType === 'movie' 
                  ? (data.release_date?.split('-')[0] || '') 
                  : `${data.first_air_date?.split('-')[0] || ''}–${(data.status === 'Ended' || data.status === 'Canceled') ? (data.last_air_date?.split('-')[0] || '') : ''}`
                }
              </span>
              <span>•</span>
              {averageEpisodeLength && <span>{Math.floor(averageEpisodeLength / 60)}h {averageEpisodeLength % 60}m {mediaType === 'tv' ? '/ ep' : ''}</span>}
              {data.number_of_seasons && <span>{data.number_of_seasons} Seasons</span>}
              <span>•</span>
              <span style={{ display: 'flex', gap: '5px' }}>
                {data.genres?.map((g: any) => (
                  <span key={g.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {g.name}
                  </span>
                ))}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'gold' }}>★</span> {data.vote_average?.toFixed(1)}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-glass"
                onClick={() => handleToggleList('favourites')}
                style={{ color: isFavourite ? 'var(--primary-color)' : 'white' }}
              >
                <Heart size={20} fill={isFavourite ? 'var(--primary-color)' : 'none'} /> 
                {isFavourite ? 'Favorited' : 'Favorite'}
              </button>
              
              <button 
                className="btn btn-glass"
                onClick={() => handleToggleList('watched')}
                style={{ color: isWatched ? '#10b981' : 'white' }}
              >
                <Eye size={20} /> 
                {isWatched ? 'Watched' : 'Mark Watched'}
              </button>
              
              <button 
                className="btn btn-glass"
                onClick={() => handleToggleList(mediaType === 'movie' ? 'my_movies' : 'my_shows')}
                style={{ background: isAdded ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
              >
                {isAdded ? <Minus size={20} /> : <Plus size={20} />} 
                {isAdded ? 'Remove' : (mediaType === 'movie' ? 'Add to Movies' : 'Add to Shows')}
              </button>

              <div style={{ position: 'relative' }}>
                <button 
                  className="btn btn-glass"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ background: showDropdown ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
                >
                  <ListPlus size={20} /> 
                  Custom List
                </button>
                {showDropdown && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '8px',
                      background: 'rgba(20,20,20,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      zIndex: 20,
                      minWidth: '200px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    }}
                  >
                    {customListNames.map(name => {
                      const inList = isInList(id || '', name);
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            handleToggleList(name);
                            setShowDropdown(false);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: inList ? 'var(--primary-color)' : 'white',
                            textAlign: 'left',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontWeight: inList ? 600 : 400
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {name}
                          {inList && <span>✓</span>}
                        </button>
                      );
                    })}
                    <button
                        onClick={() => {
                          const name = window.prompt('Enter new custom list name:');
                          if (name && name.trim()) {
                            handleToggleList(name.trim());
                          }
                          setShowDropdown(false);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: 'white',
                          textAlign: 'center',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          marginTop: '4px',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      >
                        + Create New List
                      </button>
                  </div>
                )}
              </div>
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
            
            {/* TV Show Seasons & Episodes */}
            {mediaType === 'tv' && data.seasons && data.seasons.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Episodes</h3>
                  <select 
                    className="input-base" 
                    style={{ width: 'auto', padding: '8px 12px' }}
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  >
                    {data.seasons.filter((s:any) => s.season_number > 0).map((season: any) => (
                      <option key={season.id} value={season.season_number}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {loadingSeason ? (
                  <div>Loading episodes...</div>
                ) : seasonDetails && seasonDetails.episodes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {seasonDetails.episodes.map((ep: any) => (
                      <div key={ep.id} className="glass" style={{ display: 'flex', gap: '15px', padding: '15px', borderRadius: 'var(--radius-md)' }}>
                        <img 
                          src={getImageUrl(ep.still_path, 'w300')} 
                          alt={ep.name}
                          style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                          onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x90?text=No+Image'}
                        />
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{ep.episode_number}. {ep.name}</h4>
                            <span style={{ color: 'gold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              ★ {ep.vote_average?.toFixed(1)}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                            {ep.air_date} {ep.runtime ? `• ${ep.runtime}m` : ''}
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {ep.overview || 'No overview available.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>No episodes found.</div>
                )}
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
