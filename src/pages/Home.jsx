import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import { TournamentCard } from './Tournaments';
import './Tournaments.css'; // Make sure card styles are loaded
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
  const toast = useToast();
  const [featured, setFeatured] = useState([]);
  const [promo, setPromo] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'), limit(3));
        const snap = await getDocs(q);
        setFeatured(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const settingsDoc = await getDoc(doc(db, 'settings', 'homepage'));
        if (settingsDoc.exists() && settingsDoc.data().promotion?.isActive) {
          setPromo(settingsDoc.data().promotion);
        }
      } catch (e) { console.error(e); }
    }
    loadData();
  }, []);

  async function handleContactSubmit(e) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    
    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        ...contactForm,
        createdAt: serverTimestamp()
      });
      toast('Message sent successfully! We will get back to you.', 'success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast('Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-visual">
          <div className="cube-ambient-glow" />
        </div>

        <div className="container hero-content">
          <div className="hero-eyebrow">
            <span className="hero-badge">⚡ PREMIER ESPORTS TOURNAMENTS IN LUCKNOW</span>
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
            Welcome to Stropse Esports. Play. Improve. Compete. Dominate.<br />
            <span style={{ color: 'var(--grey-600)' }}>The ultimate platform for live BGMI matches in Lucknow and India's competitive gaming.</span>
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

      {/* PROMOTION BANNER */}
      {promo && promo.bannerUrl && (
        <section className="section" style={{ padding: '0 24px', marginTop: 40 }}>
          <div className="container" style={{ padding: 0 }}>
            {promo.link ? (
              <a href={promo.link} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 0 30px rgba(255,215,0,0.1)' }} className="scroll-reveal">
                <img src={promo.bannerUrl} alt="Promotion" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </a>
            ) : (
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 0 30px rgba(255,215,0,0.1)' }} className="scroll-reveal">
                <img src={promo.bannerUrl} alt="Promotion" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* FEATURED TOURNAMENTS */}
      {featured.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="container">
            <div className="section-header scroll-reveal">
              <p className="section-tag">⚡ LIVE & UPCOMING</p>
              <h2 className="section-title">Featured <span className="text-glow">Tournaments</span></h2>
              <p className="section-subtitle">Jump straight into the most anticipated esports events of the season.</p>
            </div>
            <div className="tournaments-grid">
              {featured.map(t => (
                <div key={t.id} style={{ transitionDelay: '0.1s' }} className="scroll-reveal">
                  <TournamentCard tournament={t} />
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }} className="scroll-reveal">
              <Link to="/tournaments" className="btn btn-outline">
                View All Tournaments →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* GAMES */}
      <section className="section">
        <div className="container">
          <div className="section-header scroll-reveal">
            <p className="section-tag">⚡ GAME TITLES</p>
            <h2 className="section-title">Every Arena. <span className="text-glow">One Platform.</span></h2>
            <p className="section-subtitle">From battle royales to strategy masters — compete in your domain.</p>
          </div>
          <div className="games-grid">
            {GAMES.map((g, i) => (
              <Link key={g.name} to="/tournaments" className="game-card scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
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
          <div className="section-header scroll-reveal">
            <p className="section-tag">⚡ PLATFORM FEATURES</p>
            <h2 className="section-title">Built for <span className="text-glow">Champions</span></h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
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
          <div className="cta-banner scroll-reveal">
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
                <img src="/stropse-seal.png" alt="STROPSE Seal" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.35))' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT US */}
      <section className="section">
        <div className="container">
          <div className="card scroll-reveal" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="section-header" style={{ marginBottom: 32 }}>
              <h2 className="section-title" style={{ fontSize: 28 }}>Contact <span className="text-glow">Us</span></h2>
              <p className="section-subtitle">Have a question or want to partner with STROPSE?</p>
            </div>
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" placeholder="Your Name" value={contactForm.name}
                  onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="your@email.com" value={contactForm.email}
                  onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" placeholder="How can we help?" value={contactForm.message}
                  onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} required rows={4} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={sendingMessage}>
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </form>
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
