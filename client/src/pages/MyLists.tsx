import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl, fetchGenres } from '../services/tmdb';
import { Trash2, Filter, ListPlus, Clock, ChevronDown } from 'lucide-react';
import { ListContext } from '../context/ListContext';
import { OPTIONS } from '../services/constants';

// Duration filter buckets (in minutes)
const DURATION_OPTIONS = [
  { label: 'All Durations', value: 'all' },
  { label: 'Under 30 min', value: 'under30', min: 0, max: 29 },
  { label: '30 – 60 min', value: '30to60', min: 30, max: 60 },
  { label: '1h – 1h 30m', value: '1hto1h30', min: 61, max: 90 },
  { label: '1h 30m – 2h', value: '1h30to2h', min: 91, max: 120 },
  { label: 'Over 2 hours', value: 'over2h', min: 121, max: Infinity },
];

type DurationValue = string;

// In-memory runtime cache keyed by `mediaType-tmdbId`
const runtimeCache: Record<string, number | null> = {};

const fetchRuntimeFromTMDB = async (mediaType: string, tmdbId: string): Promise<number | null> => {
  const cacheKey = `${mediaType}-${tmdbId}`;
  if (cacheKey in runtimeCache) return runtimeCache[cacheKey];
  try {
    const BASE_URL = 'https://api.themoviedb.org/3';
    const res = await fetch(`${BASE_URL}/${mediaType}/${tmdbId}`, OPTIONS);
    const data = await res.json();
    let runtime: number | null = null;
    if (mediaType === 'movie') {
      runtime = data.runtime ?? null;
    } else {
      const arr: number[] = data.episode_run_time ?? [];
      runtime = arr.length > 0
        ? Math.round(arr.reduce((a: number, b: number) => a + b, 0) / arr.length)
        : null;
    }
    runtimeCache[cacheKey] = runtime;
    return runtime;
  } catch {
    runtimeCache[cacheKey] = null;
    return null;
  }
};

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

  // Duration filter state
  const [selectedDuration, setSelectedDuration] = useState<DurationValue>('all');
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [itemRuntimes, setItemRuntimes] = useState<Record<string, number | null>>({});
  const durationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGenres().then(map => setGenreMap(map));
  }, []);

  useEffect(() => {
    setSelectedGenre(null);
    setSelectedDuration('all');
  }, [listType, activeCustomList]);

  // Close duration dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(e.target as Node)) {
        setIsDurationOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  // Fetch runtimes from TMDB for items that don't have one cached in DB
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;
    const missingRuntime = items.filter(
      item => item.runtime == null && item.tmdbId && item.mediaType
    );
    if (missingRuntime.length === 0) return;
    let cancelled = false;
    const fetchAll = async () => {
      const results: Record<string, number | null> = {};
      await Promise.all(
        missingRuntime.map(async item => {
          const rt = await fetchRuntimeFromTMDB(item.mediaType, item.tmdbId);
          results[item.tmdbId] = rt;
        })
      );
      if (!cancelled) setItemRuntimes(prev => ({ ...prev, ...results }));
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [items]);

  // Resolve runtime for a given item (from DB field or fetched from TMDB)
  const getRuntime = (item: any): number | null => {
    if (item.runtime != null) return item.runtime;
    return itemRuntimes[item.tmdbId] ?? null;
  };

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

  // Apply duration filter
  const durationFiltered = selectedDuration === 'all' || !Array.isArray(items)
    ? (Array.isArray(items) ? items : [])
    : items.filter(item => {
        const rt = getRuntime(item);
        if (rt == null) return true; // keep unresolved items while fetching
        const option = DURATION_OPTIONS.find(o => o.value === selectedDuration);
        if (!option || option.value === 'all') return true;
        return rt >= (option as any).min && rt <= (option as any).max;
      });

  // Apply genre filter on top
  const filteredItems = selectedGenre
    ? durationFiltered.filter(item => item.genreIds && Array.isArray(item.genreIds) && item.genreIds.includes(selectedGenre))
    : durationFiltered;

  const sortedItems = [...filteredItems];
  if (listType === 'my_movies' || listType === 'my_shows' || listType === 'watched') {
    sortedItems.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  const selectedDurationLabel = DURATION_OPTIONS.find(o => o.value === selectedDuration)?.label || 'All Durations';

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

      {/* Filters: Duration dropdown + Genre pills */}
      {(!loading && items.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>

          {/* Duration dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', flexShrink: 0 }}>
              <Clock size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Duration</span>
            </div>
            <div ref={durationDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDurationOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 14px',
                  background: selectedDuration !== 'all' ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid',
                  borderColor: selectedDuration !== 'all' ? 'var(--primary-color)' : 'rgba(255,255,255,0.18)',
                  borderRadius: '8px', color: 'white', fontSize: '0.85rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
                  minWidth: '160px', justifyContent: 'space-between',
                }}
              >
                <span>{selectedDurationLabel}</span>
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isDurationOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
              </button>
              {isDurationOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  background: 'rgba(18,18,24,0.97)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
                  padding: '6px', zIndex: 100, minWidth: '190px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                }}>
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedDuration(opt.value as DurationValue); setIsDurationOpen(false); }}
                      style={{
                        background: selectedDuration === opt.value ? 'rgba(229,9,20,0.18)' : 'transparent',
                        border: 'none',
                        color: selectedDuration === opt.value ? 'var(--primary-color)' : 'white',
                        textAlign: 'left', padding: '9px 12px', cursor: 'pointer', borderRadius: '6px',
                        fontSize: '0.85rem', fontWeight: selectedDuration === opt.value ? 600 : 400,
                        transition: 'background 0.15s', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '10px',
                      }}
                      onMouseEnter={e => { if (selectedDuration !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={e => { if (selectedDuration !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{opt.label}</span>
                      {selectedDuration === opt.value && <span style={{ fontSize: '0.75rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedDuration !== 'all' && (
              <button
                onClick={() => setSelectedDuration('all')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Genre pills */}
          {availableGenres.length > 0 && (
            <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              <Filter size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
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
        </div>
      )}

      {(!loading || items.length > 0) && (
        <>
          {items.length === 0 && listType !== 'custom' ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
              <h3>This list is empty.</h3>
              <p>Explore movies and shows and add them to your {formatListTypeTitle(listType)} list.</p>
            </div>
          ) : sortedItems.length === 0 && items.length > 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <Clock size={44} style={{ marginBottom: '16px', opacity: 0.35 }} />
              <h3 style={{ marginBottom: '8px' }}>No results for this filter.</h3>
              <p>Try a different duration range or genre.</p>
            </div>
          ) : (
            <div className="grid-cards" style={{ paddingBottom: '50px' }}>
              {sortedItems.map(item => {
                const runtime = getRuntime(item);
                const runtimeLabel = runtime != null
                  ? (runtime >= 60
                    ? `${Math.floor(runtime / 60)}h${runtime % 60 > 0 ? ` ${runtime % 60}m` : ''}`
                    : `${runtime}m`)
                  : null;

                return (
                  <a
                    key={item._id}
                    className="movie-card"
                    href={`/detail/${item.mediaType}/${item.tmdbId}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                      e.preventDefault();
                      navigate(`/detail/${item.mediaType}/${item.tmdbId}`);
                    }}
                    style={{
                      position: 'relative', width: '100%', aspectRatio: '2/3',
                      borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'transform 0.3s ease',
                      display: 'block', textDecoration: 'none', color: 'inherit'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <img
                      src={getImageUrl(item.posterPath, 'w342')}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300?text=No+Image'}
                    />

                    {/* Runtime badge */}
                    {runtimeLabel && (
                      <div style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
                        padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600,
                        color: 'rgba(255,255,255,0.9)',
                        display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.3px',
                      }}>
                        <Clock size={10} />
                        {runtimeLabel}
                      </div>
                    )}

                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      padding: '15px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            className="icon-btn glass"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              setActiveDropdown(activeDropdown === item._id ? null : item._id);
                            }}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeDropdown === item._id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                            title="Add to Custom List"
                          >
                            <ListPlus size={16} />
                          </button>
                          {activeDropdown === item._id && (
                            <div
                              style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 20, minWidth: '150px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {customListNames.map(name => {
                                const inList = isInList(item.tmdbId, name);
                                return (
                                  <button
                                    key={name}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await toggleListItem({ tmdbId: item.tmdbId, mediaType: item.mediaType, title: item.title, posterPath: item.posterPath, releaseDate: item.releaseDate, genreIds: item.genreIds, runtime: item.runtime ?? itemRuntimes[item.tmdbId], listType: name }, name);
                                      setActiveDropdown(null);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: inList ? 'var(--primary-color)' : 'white', textAlign: 'left', padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: inList ? 600 : 400 }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    {name}{inList && <span>✓</span>}
                                  </button>
                                );
                              })}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const name = window.prompt('Enter new custom list name:');
                                  if (name && name.trim()) {
                                    await toggleListItem({ tmdbId: item.tmdbId, mediaType: item.mediaType, title: item.title, posterPath: item.posterPath, releaseDate: item.releaseDate, genreIds: item.genreIds, runtime: item.runtime ?? itemRuntimes[item.tmdbId], listType: name.trim() }, name.trim());
                                  }
                                  setActiveDropdown(null);
                                }}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', textAlign: 'center', padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}
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
                  </a>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyLists;
