import React, { useContext, useState } from 'react';
import { Heart, Plus, Minus, ListPlus } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ListContext } from '../context/ListContext';

interface MovieCardProps {
  item: any;
  mediaType?: 'movie' | 'tv';
}

const MovieCard: React.FC<MovieCardProps> = ({ item, mediaType }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isInList, toggleListItem, customListNames } = useContext(ListContext);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const type = item.media_type || mediaType || 'movie';
  const title = item.title || item.name;
  
  const handleCardClick = () => {
    window.open(`/detail/${type}/${item.id}`, '_blank');
  };

  const handleToggleList = async (e: React.MouseEvent, listType: string) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleListItem({
      tmdbId: item.id.toString(),
      mediaType: type,
      listType,
      title,
      posterPath: item.poster_path,
      releaseDate: item.release_date || item.first_air_date,
      genreIds: item.genre_ids || []
    }, listType);
  };
  
  const isLiked = isInList(item.id.toString(), 'favourites');
  const isAdded = isInList(item.id.toString(), type === 'movie' ? 'my_movies' : 'my_shows');

  return (
    <div 
      className="movie-card" 
      onClick={handleCardClick}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '2/3',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
        (e.currentTarget as HTMLDivElement).style.zIndex = '10';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.zIndex = '1';
      }}
    >
      <img 
        src={getImageUrl(item.poster_path, 'w342')} 
        alt={title} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300?text=No+Image';
        }}
      />
      
      <div 
        className="card-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '15px'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            className="icon-btn glass" 
            onClick={(e) => handleToggleList(e, 'favourites')}
            style={{ ...iconBtnStyle, color: isLiked ? 'var(--primary-color)' : 'white' }}
            title={isLiked ? 'Remove from Favourites' : 'Add to Favourites'}
          >
            <Heart size={18} fill={isLiked ? 'var(--primary-color)' : 'none'} />
          </button>
          
          <button 
            className="icon-btn glass" 
            onClick={(e) => handleToggleList(e, type === 'movie' ? 'my_movies' : 'my_shows')}
            style={{ ...iconBtnStyle, background: isAdded ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)' }}
            title={isAdded ? 'Remove from list' : (type === 'movie' ? 'Add to Movies' : 'Add to Shows')}
          >
            {isAdded ? <Minus size={18} /> : <Plus size={18} />}
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              className="icon-btn glass" 
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              style={{ ...iconBtnStyle, background: showDropdown ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)' }}
              title="Add to Custom List"
            >
              <ListPlus size={18} />
            </button>
            {showDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'rgba(20,20,20,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 20,
                  minWidth: '150px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {customListNames.map(name => {
                  const inList = isInList(item.id.toString(), name);
                  return (
                    <button
                      key={name}
                      onClick={(e) => {
                        handleToggleList(e, name);
                        setShowDropdown(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: inList ? 'var(--primary-color)' : 'white',
                        textAlign: 'left',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
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
                    onClick={(e) => {
                      e.stopPropagation();
                      const name = window.prompt('Enter new custom list name:');
                      if (name && name.trim()) {
                        handleToggleList(e, name.trim());
                      }
                      setShowDropdown(false);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      textAlign: 'center',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
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
        
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{title}</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {item.release_date ? item.release_date.split('-')[0] : item.first_air_date ? item.first_air_date.split('-')[0] : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

const iconBtnStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'white',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

export default MovieCard;
