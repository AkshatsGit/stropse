import React, { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PlayerCard, { PlayerCardBack } from '../components/PlayerCard';
import './GameProfiles.css';

const GAME_TYPES = ['BGMI', 'Free Fire', 'Chess', 'Sudoku'];

export default function GameProfiles() {
  const { user } = useAuth();
  const toast = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [form, setForm] = useState({
    playerName: '', playerId: '', gameType: 'BGMI', authKey: '',
    kd: '', winRate: '', matches: '', elo: '', rank: ''
  });

  async function fetchProfiles() {
    setLoading(true);
    try {
      const q = query(collection(db, 'gameProfiles'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) fetchProfiles(); }, [user]);

  useEffect(() => {
    if (printingId) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingId(null);
      }, 500); // Allow images to load
      return () => clearTimeout(timer);
    }
  }, [printingId]);

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
      if (!form.playerId || !form.playerName || form.authKey.length !== 8) { 
        toast('Name, ID, and 8-Character Key required', 'error'); 
        return; 
      }
      setCreating(true);
      try {
        const isShooter = form.gameType === 'BGMI' || form.gameType === 'Free Fire';
        const stats = isShooter
          ? { kd: form.kd, winRate: form.winRate, matches: form.matches }
          : { elo: form.elo, winRate: form.winRate, rank: form.rank };

        await addDoc(collection(db, 'gameProfiles'), {
          userId: user.uid,
          playerName: form.playerName.trim(),
          playerId: form.playerId,
          gameType: form.gameType,
          authKey: form.authKey.toUpperCase(),
        stats,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast('Player Card created! 🪪', 'success');
      setShowCreate(false);
      setForm({ playerId: '', gameType: 'BGMI', kd: '', winRate: '', matches: '', elo: '', rank: '' });
      fetchProfiles();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(profileId) {
    if (!confirm('Delete this player card?')) return;
    try {
      await deleteDoc(doc(db, 'gameProfiles', profileId));
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      toast('Profile deleted', 'info');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function downloadCard(id, playerName) {
    setPrintingId(id);
    toast('Preparing high-resolution print...', 'info');
  }

  const isShooter = form.gameType === 'BGMI' || form.gameType === 'Free Fire';

  if (printingId) {
    const p = profiles.find(x => x.id === printingId);
    if (!p) return null;
    return (
      <div className="print-mode-container">
        <div className="print-page">
          <PlayerCard profile={p} />
        </div>
        <div className="print-page">
          <PlayerCardBack />
        </div>
      </div>
    );
  }

  return (
    <div className="gp-page">
      <div className="container">
        <div className="page-header flex-between">
          <div>
            <p className="section-tag">⚡ PLAYER CARDS</p>
            <h1>My Game <span className="text-glow">Profiles</span></h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create Card
          </button>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🪪</div>
            <h3>No Player Cards Yet</h3>
            <p>Create your first game profile to showcase your stats.</p>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setShowCreate(true)}>
              Create First Card
            </button>
          </div>
        ) : (
          <div className="gp-grid">
            {profiles.map(p => (
              <div key={p.id} className="gp-card-wrapper">
                <div id={`card-${p.id}`} style={{ padding: '2px', background: 'transparent' }}>
                  <PlayerCard profile={p} compact />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    className="btn btn-outline btn-sm gp-delete-btn"
                    onClick={() => downloadCard(p.id, p.playerId)}
                  >
                    ⬇ Download
                  </button>
                  <button
                    className="btn btn-danger btn-sm gp-delete-btn"
                    onClick={() => handleDelete(p.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            <h2 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 18, marginBottom: 24 }}>
              ⚡ Create Player Card
            </h2>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Game</label>
                <select name="gameType" className="form-select" value={form.gameType} onChange={handleChange}>
                  {GAME_TYPES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Auth Key (8-Digit)</label>
                <input className="form-input" name="authKey" placeholder="XXXXXXXX" value={form.authKey} maxLength={8} onChange={handleChange} required />
                <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>Contact Stropse Team to get your processing key.</p>
              </div>

              <div className="form-group">
                <label className="form-label">In-Game Name / Alias</label>
                <input className="form-input" name="playerName" placeholder="GAMER123" value={form.playerName} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Real Full Name</label>
                <input className="form-input" name="fullName" placeholder="John Doe" value={form.fullName} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Game Player ID</label>
                <input name="playerId" className="form-input" placeholder="5123456789" value={form.playerId} onChange={handleChange} required />
              </div>

              {isShooter ? (
                <div className="gp-stats-grid">
                  <div className="form-group">
                    <label className="form-label">K/D Ratio</label>
                    <input name="kd" className="form-input" placeholder="3.24" value={form.kd} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Win Rate %</label>
                    <input name="winRate" className="form-input" placeholder="42" value={form.winRate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Matches Played</label>
                    <input name="matches" className="form-input" placeholder="850" value={form.matches} onChange={handleChange} />
                  </div>
                </div>
              ) : (
                <div className="gp-stats-grid">
                  <div className="form-group">
                    <label className="form-label">Elo Rating</label>
                    <input name="elo" className="form-input" placeholder="1200" value={form.elo} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Win Rate %</label>
                    <input name="winRate" className="form-input" placeholder="55" value={form.winRate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rank</label>
                    <input name="rank" className="form-input" placeholder="Master" value={form.rank} onChange={handleChange} />
                  </div>
                </div>
              )}

              {/* Preview */}
              {form.playerId && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                  <PlayerCard profile={{
                    playerId: form.playerId,
                    playerName: form.playerName,
                    fullName: form.fullName,
                    gameType: form.gameType,
                    status: 'pending',
                    stats: isShooter
                      ? { kd: form.kd || '—', winRate: form.winRate || '—', matches: form.matches || '—' }
                      : { elo: form.elo || '—', winRate: form.winRate || '—', rank: form.rank || '—' }
                  }} compact />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost btn-full" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
