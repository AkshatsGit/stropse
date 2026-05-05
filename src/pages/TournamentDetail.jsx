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
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [stropseForm, setStropseForm] = useState({
    fullName: '',
    email: '',
    institution: '',
    grade: '',
    whatsapp: '',
    callNumber: '',
    sameAsWhatsApp: false
  });

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'tournaments', id));
        if (snap.exists()) setTournament({ id: snap.id, ...snap.data() });
        else navigate('/tournaments');

        if (user) {
          const rSnap = await getDocs(query(
            collection(db, 'registrations'),
            where('userId', '==', user.uid),
            where('tournamentId', '==', id)
          ));
          setAlreadyRegistered(!rSnap.empty);
          
          // Pre-fill email
          setStropseForm(prev => ({ ...prev, email: user.email }));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [id, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStropseForm(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'sameAsWhatsApp' && checked) updated.callNumber = prev.whatsapp;
      if (name === 'whatsapp' && prev.sameAsWhatsApp) updated.callNumber = value;
      return updated;
    });
  };

  async function handleRegister(e) {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    
    const { fullName, email, institution, grade, whatsapp, callNumber } = stropseForm;
    if (!fullName || !email || !institution || !grade || !whatsapp || !callNumber) {
      toast('Please fill all required fields', 'error');
      return;
    }

    setRegistering(true);
    try {
      await addDoc(collection(db, 'registrations'), {
        userId: user.uid,
        tournamentId: id,
        ...stropseForm,
        status: 'pending_verification',
        registeredAt: serverTimestamp(),
        source: 'stropse_form'
      });
      setAlreadyRegistered(true);
      setShowRegModal(false);
      toast('🎉 Registration submitted for verification!', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setRegistering(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!tournament) return null;

  const tDate = tournament.date?.toDate ? tournament.date.toDate() : new Date(tournament.date);
  const color = GAME_COLORS[tournament.gameType] || '#FFD700';
  const isPast = tDate < new Date();

  return (
    <div className="td-page">
      <div className="container">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>← Back</button>

        <div className="td-layout">
          <div className="td-main">
            {tournament.bannerUrl && (
              <div className="td-banner-wrapper">
                <img src={tournament.bannerUrl} alt="Banner" className="td-banner-img" />
              </div>
            )}
            <div className="td-header" style={{ '--t-color': color }}>
              <div className="td-top">
                <div className="td-game">
                  {GAME_IMGS[tournament.gameType] ? (
                    <img src={GAME_IMGS[tournament.gameType]} alt="" style={{width: 36, height: 36, objectFit: 'cover', borderRadius: '4px'}} />
                  ) : <span>🎮</span>}
                  <span className="badge badge-primary">{tournament.gameType}</span>
                </div>
                {!isPast && <span className="badge badge-success">OPEN</span>}
              </div>
              <h1 className="td-title">{tournament.title}</h1>
              <p className="td-description">{tournament.description}</p>
            </div>

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

          <div className="td-sidebar">
            <div className="td-info-card-custom">
              <div className="td-info-header-custom">
                <h3 className="td-info-title-custom">TOURNAMENT INFO</h3>
              </div>
              <div className="td-info-items-custom">
                {[
                  { label: 'DATE & TIME', value: tDate.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) },
                  { label: 'PRIZE POOL', value: tournament.prizePool || 'TBA' },
                  { label: 'ENTRY FEE', value: tournament.entryFee || 'Free' },
                ].map((item, idx) => (
                  <div key={idx} className="td-info-row-custom">
                    <div className="td-info-text-custom">
                      <span className="td-info-label-custom">{item.label}</span>
                      <span className="td-info-value-custom">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="td-info-action-custom">
                {alreadyRegistered ? (
                  <div className="td-info-btn-registered">✅ REGISTERED</div>
                ) : !isPast && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button className="td-info-btn-custom" onClick={() => setShowRegModal(true)}>
                      <span className="btn-main-text">REGISTER VIA STROPSE</span>
                      <span className="btn-sub-text">(Official Form)</span>
                    </button>
                    {tournament.googleFormLink && (
                      <button className="btn btn-outline btn-full" onClick={() => window.open(tournament.googleFormLink, '_blank')}>
                        Register via Google Form
                      </button>
                    )}
                  </div>
                )}
                {!user && <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--grey-600)' }}>Sign in to register</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STROPSE REGISTRATION MODAL */}
      {showRegModal && (
        <div className="modal-overlay" onClick={() => setShowRegModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <button className="modal-close" onClick={() => setShowRegModal(false)}>✕</button>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: 20, marginBottom: 4, color: '#00ffff' }}>⚡ STROPSE REGISTRATION</h2>
            <p style={{ color: 'var(--grey-500)', fontSize: 13, marginBottom: 24 }}>Enter your official details for tournament verification.</p>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="gp-stats-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input name="fullName" className="form-input" placeholder="Akshat Srivastava" value={stropseForm.fullName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input name="email" className="form-input" type="email" value={stropseForm.email} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="gp-stats-grid">
                <div className="form-group">
                  <label className="form-label">College / School Name</label>
                  <input name="institution" className="form-input" placeholder="Lucknow University" value={stropseForm.institution} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade / Degree Name</label>
                  <input name="grade" className="form-input" placeholder="B.Tech 3rd Year" value={stropseForm.grade} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Number</label>
                <input name="whatsapp" className="form-input" placeholder="+91 XXXXX XXXXX" value={stropseForm.whatsapp} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Voice Call Number</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input type="checkbox" name="sameAsWhatsApp" id="sameAs" checked={stropseForm.sameAsWhatsApp} onChange={handleInputChange} />
                  <label htmlFor="sameAs" style={{ fontSize: 12, cursor: 'pointer', color: 'var(--grey-400)' }}>Same as WhatsApp</label>
                </div>
                <input name="callNumber" className="form-input" placeholder="+91 XXXXX XXXXX" value={stropseForm.callNumber} onChange={handleInputChange} disabled={stropseForm.sameAsWhatsApp} required />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost btn-full" onClick={() => setShowRegModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={registering}>
                  {registering ? 'Processing...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
