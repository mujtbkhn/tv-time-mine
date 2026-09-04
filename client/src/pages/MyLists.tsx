import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl, fetchGenres } from '../services/tmdb';
import { Trash2, Filter, ListPlus } from 'lucide-react';
import { ListContext } from '../context/ListContext';

const MyLists = () => {
  const { listType } = useParams<{ listType: string }>();
  const { user } = useContext(AuthContext);
  const { customListNames, isInList, toggleListItem } = useContext(ListContext);
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [activeCustomList, setActiveCustomList] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  useEffect(() => {
    fetchGenres().then(map => setGenreMap(map));
  }, []);

  useEffect(() => {
    setSelectedGenre(null);
  }, [listType, activeCustomList]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchLists = async () => {
      try {
        setLoading(true);
        if (listType === 'custom') {
          const { data: names } = await api.get('/lists/custom/names');
          const validNames = Array.isArray(names) ? names : [];
          setCustomLists(validNames);
          if (validNames.length > 0) {
            setActiveCustomList(validNames[0]);
          } else {
            setItems([]);
            setLoading(false);
          }
        } else {
          const { data } = await api.get(`/lists/${listType}`);
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch lists", error);
      } finally {
        if (listType !== 'custom') setLoading(false);
      }
    };
    
    fetchLists();
  }, [listType, user, navigate]);

  useEffect(() => {
    if (listType === 'custom' && activeCustomList) {
      const fetchCustomListItems = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/lists/${activeCustomList}`);
          setItems(Array.isArray(data) ? data : []);
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
    if (type === 'watched') return 'Watched';
    return type;
  };

  const availableGenres = useMemo(() => {
    const ids = new Set<number>();
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item.genreIds && Array.isArray(item.genreIds)) {
          item.genreIds.forEach((id: number) => ids.add(id));
        }
      });
    }
    return Array.from(ids)
      .map(id => ({ id, name: genreMap[id] || 'Unknown' }))
      .filter(g => g.name !== 'Unknown')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, genreMap]);

  if (loading && items.length === 0) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  const filteredItems = selectedGenre && Array.isArray(items)
    ? items.filter(item => item.genreIds && Array.isArray(item.genreIds) && item.genreIds.includes(selectedGenre)) 
    : (Array.isArray(items) ? items : []);

  const sortedItems = [...filteredItems];
  if (listType === 'my_movies' || listType === 'my_shows' || listType === 'watched') {
    sortedItems.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      return dateB - dateA;
    });
  }

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

      {(!loading && items.length > 0 && availableGenres.length > 0) && (
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
          <Filter size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <button
            className={`btn ${selectedGenre === null ? 'btn-primary' : 'btn-glass'}`}
            style={{ padding: '6px 12px', fontSize: '0.85rem', flexShrink: 0 }}
            onClick={() => setSelectedGenre(null)}
          >
            All
          </button>
          {availableGenres.map(g => (
            <button
              key={g.id}
              className={`btn ${selectedGenre === g.id ? 'btn-primary' : 'btn-glass'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => setSelectedGenre(g.id)}
            >
              {g.name}
            </button>
          ))}
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
              {sortedItems.map(item => (
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
                  onClick={() => window.open(`/detail/${item.mediaType}/${item.tmdbId}`, '_blank')}
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="icon-btn glass" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === item._id ? null : item._id);
                          }}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeDropdown === item._id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                          title="Add to Custom List"
                        >
                          <ListPlus size={16} />
                        </button>
                        {activeDropdown === item._id && (
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
                              const inList = isInList(item.tmdbId, name);
                              return (
                                <button
                                  key={name}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await toggleListItem({
                                      tmdbId: item.tmdbId,
                                      mediaType: item.mediaType,
                                      title: item.title,
                                      posterPath: item.posterPath,
                                      releaseDate: item.releaseDate,
                                      genreIds: item.genreIds,
                                      listType: name
                                    }, name);
                                    setActiveDropdown(null);
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const name = window.prompt('Enter new custom list name:');
                                  if (name && name.trim()) {
                                    await toggleListItem({
                                      tmdbId: item.tmdbId,
                                      mediaType: item.mediaType,
                                      title: item.title,
                                      posterPath: item.posterPath,
                                      releaseDate: item.releaseDate,
                                      genreIds: item.genreIds,
                                      listType: name.trim()
                                    }, name.trim());
                                  }
                                  setActiveDropdown(null);
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
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                        {item.releaseDate && ` • ${item.releaseDate.split('-')[0]}`}
                      </span>
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
