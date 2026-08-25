import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { searchMedia, getImageUrl } from '../services/tmdb';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsMobileMenuOpen(false); // Close menu on scroll
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      searchMedia(debouncedSearch).then(results => {
        setSearchResults(results.slice(0, 5));
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const navLinks = (
    <>
      <Link to="/explore/movies" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Movies</Link>
      <Link to="/explore/series" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Series</Link>
      {user && (
        <>
          <Link to="/lists/my_movies" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>My Movies</Link>
          <Link to="/lists/my_shows" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>My Shows</Link>
          <Link to="/lists/favourites" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Favourites</Link>
          <Link to="/lists/custom" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Custom Lists</Link>
        </>
      )}
    </>
  );

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled glass' : ''}`} style={navStyles(isScrolled)}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '70px', padding: '10px 5%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)' }}>
            TV Time
          </Link>
        </div>
        
        <div className="nav-links-desktop">
          {navLinks}
        </div>

        <div className="nav-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="search-container" style={{ position: 'relative' }}>
            <Search className="search-icon" size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-base search-input" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '250px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}
            />
            {searchResults.length > 0 && (
              <div className="search-dropdown glass" style={dropdownStyles}>
                {searchResults.map(item => (
                  <div key={item.id} className="search-item" onClick={() => {
                    navigate(`/detail/${item.media_type}/${item.id}`);
                    setSearchTerm('');
                    setSearchResults([]);
                  }} style={{ display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={getImageUrl(item.poster_path || item.profile_path, 'w92')} alt={item.title || item.name} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x60?text=No+Img'} />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', margin: 0 }}>{item.title || item.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.media_type === 'movie' ? 'Movie' : item.media_type === 'tv' ? 'TV Show' : 'Person'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {user ? (
            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem' }}>{user.username}</span>
              <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          {navLinks}
        </div>
      )}
    </nav>
  );
};

const navStyles = (isScrolled: boolean): React.CSSProperties => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 1000,
  transition: 'var(--transition-normal)',
  background: isScrolled ? 'var(--glass-bg)' : 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
  backdropFilter: isScrolled ? 'blur(12px)' : 'none',
  borderBottom: isScrolled ? '1px solid var(--glass-border)' : 'none'
});

const dropdownStyles: React.CSSProperties = {
  position: 'absolute',
  top: '110%',
  left: 0,
  width: '100%',
  background: 'var(--surface-color)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
};

export default Navbar;
