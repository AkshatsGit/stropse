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
            <div className="card-glow td-info-card">
              <h3 className="td-info-title">Tournament Info</h3>

              <div className="td-info-items">
                {[
                  { label: '📅 Date & Time', value: tDate.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) },
                  { label: '💰 Prize Pool', value: tournament.prizePool || 'TBA', highlight: true },
                  { label: '🎫 Entry Fee', value: tournament.entryFee || 'Free' },
                  { label: '🎮 Game', value: tournament.gameType },
                ].map(item => (
                  <div key={item.label} className="td-info-item">
                    <span className="td-info-label">{item.label}</span>
                    <span className={`td-info-value ${item.highlight ? 'text-glow' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                {alreadyRegistered ? (
                  <div className="registered-badge">
                    <span>✅ You are registered!</span>
                  </div>
                ) : !isPast && (
                  <div style={{ marginTop: 32 }}>
                    <button className="btn btn-primary btn-full btn-lg" onClick={handleRegisterClick}>
                      Register Now (Google Form)
                    </button>
                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--grey-600)', marginTop: 12 }}>
                      Registration is securely handled via Google Forms.
                    </p>
                  </div>
                )}
                {!user && (
                  <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--grey-600)', fontFamily: 'Inter,sans-serif' }}>
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
