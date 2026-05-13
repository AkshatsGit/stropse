import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Navbar.css';

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/');
    setProfileOpen(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      // Search by username (exact) or name (exact)
      const q1 = query(collection(db, 'users'), where('username', '==', searchQuery.trim()));
      const q2 = query(collection(db, 'users'), where('name', '==', searchQuery.trim()));
      
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const combined = [...s1.docs, ...s2.docs].map(d => ({ id: d.id, ...d.data() }));
      
      // De-duplicate by ID
      const unique = Array.from(new Map(combined.map(u => [u.id, u])).values());
      setSearchResults(unique);
      if (unique.length === 0) toast('No players found with that name/username', 'info');
    } catch (err) {
      toast('Search failed', 'error');
    } finally {
      setSearching(false);
    }
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tournaments', label: 'Tournaments' },
    { to: '/game-profiles', label: 'Game Profiles' },
    { to: '/games', label: 'Games' },
    { to: '/community', label: 'Community' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <div className="logo-icon" style={{ background: 'none', border: 'none', padding: 0, width: 34, height: 34, flexShrink: 0 }}>
            <img
              src="/stropse-seal.png"
              alt="STROPSE"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.4))' }}
            />
          </div>
          <span className="logo-text">
            {'STROPSE'.split('').map((ch, i) => (
              <span key={i} className="neon-letter neon-letter-logo" style={{ animationDelay: `${i * 0.14}s` }}>{ch}</span>
            ))}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              end={l.to === '/'}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* Theme Switcher */}
          <div className="profile-menu-wrapper" style={{ marginRight: '8px' }}>
            <button className="profile-btn" onClick={() => {
              const themes = ['default', 'red-gold', 'orange-black'];
              const current = document.documentElement.getAttribute('data-theme') || 'default';
              const next = themes[(themes.indexOf(current) + 1) % themes.length];
              document.documentElement.setAttribute('data-theme', next);
              localStorage.setItem('stropse-theme', next);
            }} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: '8px' }} title="Toggle Theme">
              <span style={{ fontSize: 16 }}>🎨</span>
            </button>
          </div>

          {/* Search Icon & Dropdown */}
          {user && (
            <div className="profile-menu-wrapper">
              <button className="profile-btn" onClick={() => { setSearchOpen(p => !p); setProfileOpen(false); }} style={{ padding: '6px 12px' }}>
                <span style={{ fontSize: 16 }}>🔍</span>
              </button>
              {searchOpen && (
                <div className="profile-dropdown" style={{ width: 300, right: 0, padding: 16 }}>
                  <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Username or Name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 14 }}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={searching}>
                      {searching ? '...' : 'Go'}
                    </button>
                  </form>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {searchResults.map(res => (
                      <Link
                        key={res.id}
                        to={`/profile/${res.id}`}
                        className="dropdown-item"
                        onClick={() => setSearchOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px' }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {res.profilePicture ? <img src={res.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (res.name || 'U').slice(0, 1)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 13, lineHeight: '1' }}>{res.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--grey-500)' }}>@{res.username}</div>
                        </div>
                      </Link>
                    ))}
                    {searchResults.length === 0 && !searching && searchQuery && (
                      <div style={{ fontSize: 12, color: 'var(--grey-500)', textAlign: 'center', padding: '12px 0' }}>No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
              <div className="profile-menu-wrapper">
                <button className="profile-btn" onClick={() => { setProfileOpen(p => !p); setSearchOpen(false); }} style={{ position: 'relative' }}>
                  <div className="profile-avatar">
                    {userProfile?.profilePicture ? (
                      <img src={userProfile.profilePicture} alt="avatar" />
                    ) : (
                      <span>{(userProfile?.name || user.email)?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  {userProfile?.friendRequests?.length > 0 && (
                    <span style={{ position: 'absolute', top: -2, right: 8, background: '#ff3333', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' }}>
                      {userProfile.friendRequests.length}
                    </span>
                  )}
                  <span className="profile-name">{userProfile?.username || 'Profile'}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <span>👤</span> My Profile
                    </Link>
                    <Link to="/game-profiles" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <span>🎮</span> Game Profiles
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">Join Now</Link>
          )}

          {/* Mobile toggle */}
          <button className="hamburger" onClick={() => setMenuOpen(m => !m)}>
            <span className={menuOpen ? 'ham-open' : ''}></span>
            <span className={menuOpen ? 'ham-open' : ''}></span>
            <span className={menuOpen ? 'ham-open' : ''}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-active' : ''}`}
              onClick={() => setMenuOpen(false)}
              end={l.to === '/'}
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Profile</NavLink>
              <button className="mobile-nav-link mobile-logout" onClick={() => { handleLogout(); setMenuOpen(false); }}>Sign Out</button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>Join Now</Link>
          )}
        </div>
      )}
    </nav>
  );
}
