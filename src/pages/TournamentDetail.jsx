import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './TournamentDetail.css';

const GAME_IMGS = { BGMI: '/bgmi.png', 'Free Fire': '/freefire.png', Chess: '/chess.png', Sudoku: '/sudoku.png' };
const GAME_COLORS = { BGMI: '#FFD700', 'Free Fire': '#FF6B35', Chess: '#A8D8EA', Sudoku: '#C7F2A4' };

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [gameProfiles, setGameProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'tournaments', id));
        if (snap.exists()) setTournament({ id: snap.id, ...snap.data() });
        else navigate('/tournaments');

        if (user) {
          // Load game profiles for this game type
          const gSnap = await getDocs(query(collection(db, 'gameProfiles'), where('userId', '==', user.uid)));
          setGameProfiles(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          // Check existing registration
          const rSnap = await getDocs(query(
            collection(db, 'registrations'),
            where('userId', '==', user.uid),
            where('tournamentId', '==', id)
          ));
          setAlreadyRegistered(!rSnap.empty);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user, navigate]);

  async function handleRegisterClick() {
    if (tournament.googleFormLink) {
      window.open(tournament.googleFormLink, '_blank');
    } else {
      toast('Registration link not available.', 'error');
    }
  }

  async function handleRegister() {
    if (!user) { navigate('/auth'); return; }
    if (!selectedProfile) { toast('Please select a game profile', 'error'); return; }
    setRegistering(true);
    try {
      await addDoc(collection(db, 'registrations'), {
        userId: user.uid,
        tournamentId: id,
        playerId: selectedProfile,
        status: 'confirmed',
        registeredAt: serverTimestamp(),
      });
      setAlreadyRegistered(true);
      setShowRegModal(false);
      toast('🎉 Successfully registered!', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setRegistering(false);
    }
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );

  if (!tournament) return null;

  const tDate = tournament.date?.toDate ? tournament.date.toDate() : new Date(tournament.date);
  const color = GAME_COLORS[tournament.gameType] || '#FFD700';
  const isPast = tDate < new Date();
  const relevantProfiles = gameProfiles.filter(p =>
    p.gameType === tournament.gameType || gameProfiles.length > 0
  );

  return (
    <div className="td-page">
      <div className="container">
        {/* Back */}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>
          ← Back
        </button>

        <div className="td-layout">
          {/* Main */}
          <div className="td-main">
            {tournament.bannerUrl && (
              <div className="td-banner-wrapper">
                <img src={tournament.bannerUrl} alt={`${tournament.title} Banner`} className="td-banner-img" />
              </div>
            )}
            <div className="td-header" style={{ '--t-color': color }}>
              <div className="td-top">
                <div className="td-game">
                  {GAME_IMGS[tournament.gameType] ? (
                    <img src={GAME_IMGS[tournament.gameType]} alt="" style={{width: 36, height: 36, objectFit: 'cover', borderRadius: '4px'}} />
                  ) : <span style={{ fontSize: 32 }}>🎮</span>}
                  <span className="badge badge-primary">{tournament.gameType}</span>
                </div>
                <span className="badge badge-success">UPCOMING</span>
              </div>
              <h1 className="td-title">{tournament.title}</h1>
              {tournament.description && (
                <p className="td-description">{tournament.description}</p>
              )}
            </div>

            {/* Rules */}
            {tournament.rules && (
              <div className="td-section">
                <h2 className="td-section-title">📋 Tournament Rules</h2>
                <div className="td-rules">
                  {tournament.rules.split('\n').filter(Boolean).map((rule, i) => (
                    <div key={i} className="td-rule">
                      <span className="td-rule-num">{String(i+1).padStart(2,'0')}</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="td-sidebar">
            <div className="td-info-card-custom">
              
              <div className="td-info-header-custom">
                <svg className="td-info-star" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                <h3 className="td-info-title-custom">TOURNAMENT INFO</h3>
              </div>

              <div className="td-info-items-custom">
                {[
                  { id: 'date', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>, label: 'DATE & TIME', value: tDate.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) },
                  { id: 'prize', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C8.69 2 6 4.69 6 8v2H5c-1.11 0-2 .89-2 2v8c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.89-2-2-2h-1V8c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4v2H8V8c0-2.21 1.79-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>, label: 'PRIZE POOL', value: tournament.prizePool || 'TBA' },
                  { id: 'entry', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46s-.81-2.77-2-3.46V6h16v2.54zM11 15h2v2h-2zm0-4h2v2h-2zm0-4h2v2h-2z"/></svg>, label: 'ENTRY FEE', value: tournament.entryFee || 'Free' },
                  { id: 'game', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 8 18.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>, label: 'GAME', value: tournament.gameType },
                ].map(item => (
                  <div key={item.id} className="td-info-row-custom">
                    <div className="td-info-icon-custom">
                      {item.icon}
                    </div>
                    <div className="td-info-text-custom">
                      <span className="td-info-label-custom">{item.label}</span>
                      <span className="td-info-value-custom">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="td-info-action-custom">
                {alreadyRegistered ? (
                  <div className="td-info-btn-registered">
                    ✅ YOU ARE REGISTERED
                  </div>
                ) : !isPast && (
                  <button className="td-info-btn-custom" onClick={handleRegisterClick}>
                    <span className="btn-main-text">REGISTER NOW</span>
                    <span className="btn-sub-text">(GOOGLE FORM)</span>
                  </button>
                )}
                
                <div className="td-security-note">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                  <span>Registration is securely handled via Google Forms.</span>
                </div>
                {!user && (
                  <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--grey-600)', fontFamily: 'Inter,sans-serif' }}>
                    Sign in required to register
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <div className="modal-overlay" onClick={() => setShowRegModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegModal(false)}>✕</button>
            <h2 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 18, marginBottom: 8 }}>
              ⚡ Register for Tournament
            </h2>
            <p style={{ color: 'var(--grey-400)', fontFamily: 'Inter,sans-serif', fontSize: 14, marginBottom: 24 }}>
              {tournament.title}
            </p>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Select Game Profile</label>
              {relevantProfiles.length === 0 ? (
                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 6, color: 'var(--grey-400)', fontSize: 14, fontFamily: 'Inter,sans-serif' }}>
                  No game profile found. <a href="/game-profiles" style={{ color: 'var(--primary)' }}>Create one first →</a>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedProfile}
                  onChange={e => setSelectedProfile(e.target.value)}
                >
                  <option value="">-- Choose Profile --</option>
                  {relevantProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.playerId} — {p.gameType}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setShowRegModal(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-full"
                onClick={handleRegister}
                disabled={registering || !selectedProfile}
              >
                {registering ? 'Registering...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
