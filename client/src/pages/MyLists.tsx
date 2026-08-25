import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../services/tmdb';
import { Trash2 } from 'lucide-react';

const MyLists = () => {
  const { listType } = useParams<{ listType: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [activeCustomList, setActiveCustomList] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchLists = async () => {
      try {
        setLoading(true);
        if (listType === 'custom') {
          // Fetch custom list names
          const { data: names } = await api.get('/lists/custom/names');
          setCustomLists(names);
          if (names.length > 0) {
            setActiveCustomList(names[0]);
          } else {
            setItems([]);
            setLoading(false);
          }
        } else {
          // Fetch standard list
          const { data } = await api.get(`/lists/${listType}`);
          setItems(data);
        }
      } catch (error) {
        console.error("Failed to fetch lists", error);
      } finally {
        if (listType !== 'custom') setLoading(false);
      }
    };
    
    fetchLists();
  }, [listType, user, navigate]);

  // Fetch items for specific custom list when activeCustomList changes
  useEffect(() => {
    if (listType === 'custom' && activeCustomList) {
      const fetchCustomListItems = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/lists/${activeCustomList}`);
          setItems(data);
        } catch (error) {
          console.error("Failed to fetch custom list items", error);
        } finally {
          setLoading(false);
        }
      };
      fetchCustomListItems();
    }
  }, [activeCustomList, listType]);

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/lists/remove/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      console.error("Failed to remove item", error);
    }
  };

  const formatListTypeTitle = (type: string | undefined) => {
    if (!type) return '';
    if (type === 'my_movies') return 'My Movies';
    if (type === 'my_shows') return 'My Shows';
    if (type === 'favourites') return 'Favourites';
    return type;
  };

  if (loading && items.length === 0) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>
          {listType === 'custom' ? 'Custom Lists' : formatListTypeTitle(listType)}
        </h1>
      </div>

      {listType === 'custom' && customLists.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
          {customLists.map(name => (
            <button 
              key={name}
              className={`btn ${activeCustomList === name ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => setActiveCustomList(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {listType === 'custom' && customLists.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          <h3>You don't have any custom lists yet.</h3>
          <p>Add a movie or show to a new custom list to see it here.</p>
        </div>
      )}

      {(!loading || items.length > 0) && (
        <>
          {items.length === 0 && listType !== 'custom' ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
              <h3>This list is empty.</h3>
              <p>Explore movies and shows and add them to your {formatListTypeTitle(listType)} list.</p>
            </div>
          ) : (
            <div className="grid-cards" style={{ paddingBottom: '50px' }}>
              {items.map(item => (
                <div 
                  key={item._id} 
                  className="movie-card"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '2/3',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onClick={() => navigate(`/detail/${item.mediaType}/${item.tmdbId}`)}
                >
                  <img 
                    src={getImageUrl(item.posterPath, 'w342')} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300?text=No+Image'}
                  />
                  
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '15px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="icon-btn glass"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(229,9,20,0.8)', color: 'white', border: 'none', cursor: 'pointer' }}
                        onClick={(e) => handleRemove(item._id, e)}
                        title="Remove from list"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{item.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.mediaType === 'movie' ? 'Movie' : 'TV Show'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyLists;
