import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tournaments', label: 'Tournaments' },
    { to: '/game-profiles', label: 'Game Profiles' },
    { to: '/community', label: 'Community' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" stroke="#FFD700" strokeWidth="3" opacity="0.7"/>
              <path d="M30 75 L50 20 L62 50 L50 45 L70 75" fill="#FFD700" filter="url(#glow)"/>
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
            </svg>
          </div>
          <span className="logo-text">STROPSE</span>
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
          {user ? (
              <div className="profile-menu-wrapper">
                <button className="profile-btn" onClick={() => setProfileOpen(p => !p)}>
                  <div className="profile-avatar">
                    {userProfile?.profilePicture ? (
                      <img src={userProfile.profilePicture} alt="avatar" />
                    ) : (
                      <span>{(userProfile?.name || user.email)?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
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
