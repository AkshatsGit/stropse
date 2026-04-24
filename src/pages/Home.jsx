import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';



const GAMES = [
  { name: 'BGMI', tag: 'Battle Royale', img: '/bgmi.png', color: '#FFD700', desc: 'India\'s #1 Battle Royale' },
  { name: 'Free Fire', tag: 'Survival', img: '/freefire.png', color: '#FF6B35', desc: 'Fast-Paced Shooter' },
  { name: 'Chess', tag: 'Strategy', img: '/chess.png', color: '#A8D8EA', desc: 'Mind Over Matter' },
  { name: 'Sudoku', tag: 'Puzzle', img: '/sudoku.png', color: '#C7F2A4', desc: 'Speed & Precision' },
];

const FEATURES = [
  { icon: '🏆', title: 'Tournament System', desc: 'Register for live tournaments. Track your progress. Claim your prize.' },
  { icon: '🪪', title: 'Player Cards', desc: 'Premium digital IDs showcasing your stats, rank, and identity.' },
  { icon: '💬', title: 'Community Hub', desc: 'Real-time rooms, private chats, and a friend network.' },
  { icon: '📊', title: 'Stat Tracking', desc: 'KD ratio, win rate, Elo — all in one place.' },
];

export default function Home() {
  const glitchRef = useRef(null);

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-visual">
          <div className="cube-ambient-glow" />
        </div>

        <div className="container hero-content">
          <div className="hero-eyebrow">
            <span className="hero-badge">⚡ INDIA'S UNIFIED ESPORTS ECOSYSTEM</span>
          </div>

          <h1 className="hero-title" ref={glitchRef}>
            <span className="hero-title-line1">WHERE</span>
            <span className="hero-title-main">
              {'GAMERS'.split('').map((ch, i) => (
                <span key={i} className="neon-letter">{ch}</span>
              ))}
            </span>
            <span className="hero-title-line3">BECOME COMPETITORS</span>
          </h1>

          <p className="hero-subtitle">
            Play. Improve. Compete. Dominate.<br />
            <span style={{ color: 'var(--grey-600)' }}>One platform. Every game. Infinite glory.</span>
          </p>

          <div className="hero-cta">
            <Link to="/tournaments" className="btn btn-primary btn-lg">
              ⚡ Explore Tournaments
            </Link>
            <Link to="/auth" className="btn btn-outline btn-lg">
              Create Account
            </Link>
          </div>


        </div>

        <div className="hero-scroll-indicator">
          <div className="scroll-line" />
          <span>SCROLL</span>
        </div>
      </section>

      {/* GAMES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <p className="section-tag">⚡ GAME TITLES</p>
            <h2 className="section-title">Every Arena. <span className="text-glow">One Platform.</span></h2>
            <p className="section-subtitle">From battle royales to strategy masters — compete in your domain.</p>
          </div>
          <div className="games-grid">
            {GAMES.map(g => (
              <Link key={g.name} to="/tournaments" className="game-card">
                <div className="game-card-img-wrapper" style={{ '--game-color': g.color }}>
                  <img src={g.img} alt={g.name} className="game-card-img" />
                </div>
                <div className="game-card-tag">{g.tag}</div>
                <h3 className="game-card-name">{g.name}</h3>
                <p className="game-card-desc">{g.desc}</p>
                <div className="game-card-arrow">→ VIEW TOURNAMENTS</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header">
            <p className="section-tag">⚡ PLATFORM FEATURES</p>
            <h2 className="section-title">Built for <span className="text-glow">Champions</span></h2>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-glow" />
            <div className="cta-content">
              <p className="section-tag">⚡ JOIN THE ELITE</p>
              <h2 className="cta-title">Ready to <span className="text-glow">Dominate?</span></h2>
              <p className="cta-desc">
                Your journey starts here. Create your account, build your verified player identity,
                and step into our official tournaments today.
              </p>
              <Link to="/auth" className="btn btn-primary btn-lg">
                Start Your Journey →
              </Link>
            </div>
            <div className="cta-decoration">
              <div style={{ width: 220, height: 220, flexShrink: 0 }}>
                <img src="/stropse-seal.png" alt="STROPSE Seal" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.35))' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-elegant">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '24px', letterSpacing: '2px', margin: 0 }}>STROPSE</h2>
          <p style={{ color: 'var(--grey-500)', fontSize: '14px', margin: 0 }}>India's Unified Esports Ecosystem</p>
          <div style={{ marginTop: '16px' }}>
            <a href="https://instagram.com/stropse.in" target="_blank" rel="noreferrer" className="footer-link">
              Instagram: @stropse.in
            </a>
          </div>
          <p style={{ color: 'var(--grey-700)', fontSize: '12px', marginTop: '24px' }}>© {new Date().getFullYear()} STROPSE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
