import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import './Admin.css';

const ADMIN_CREDENTIALS = { username: 'Akshat', password: 'qwerty' };
const GAME_TYPES = ['BGMI', 'Free Fire', 'Chess', 'Sudoku'];

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(() =>
    sessionStorage.getItem('admin_auth') === 'true'
  );
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('tournaments');
  const toast = useToast();

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminForm.username === ADMIN_CREDENTIALS.username &&
        adminForm.password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem('admin_auth', 'true');
      setLoggedIn(true);
      toast('Welcome, Admin ⚡', 'success');
    } else {
      toast('Invalid credentials', 'error');
    }
  }

  if (!loggedIn) {
    return (
      <div className="admin-login-page">
        <div className="auth-bg-grid" />
        <div className="admin-login-container">
          <div className="admin-login-card">
            <div className="admin-login-icon">⚡</div>
            <h1 className="admin-login-title">ADMIN ACCESS</h1>
            <p style={{ color: 'var(--grey-600)', fontFamily: 'Inter,sans-serif', fontSize: 14, marginBottom: 28 }}>
              Restricted area. Authorized personnel only.
            </p>
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" placeholder="Admin username"
                  value={adminForm.username}
                  onChange={e => setAdminForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="••••••"
                  value={adminForm.password}
                  onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg">
                ⚡ Enter Admin Panel
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header flex-between">
          <div>
            <p className="section-tag">⚡ RESTRICTED</p>
            <h1>Admin <span className="text-glow">Dashboard</span></h1>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => {
            sessionStorage.removeItem('admin_auth');
            setLoggedIn(false);
          }}>Logout</button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { id: 'tournaments', label: '🏆 Tournaments' },
            { id: 'cards', label: '🪪 Player Cards' },
            { id: 'rooms', label: '💬 Community' },
            { id: 'registrations', label: '📋 Registrations' },
          ].map(t => (
            <button
              key={t.id}
              className={`filter-btn ${activeTab === t.id ? 'filter-btn-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'tournaments' && <TournamentManager toast={toast} />}
        {activeTab === 'cards' && <CardManager toast={toast} />}
        {activeTab === 'rooms' && <RoomManager toast={toast} />}
        {activeTab === 'registrations' && <RegistrationViewer toast={toast} />}
      </div>
    </div>
  );
}

/* =========================================
   TOURNAMENT MANAGER
========================================= */
function TournamentManager({ toast }) {
  const [tournaments, setTournaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', gameType: 'BGMI', date: '', entryFee: '', prizePool: '', googleFormLink: '', description: '', rules: ''
  });

  async function fetchTournaments() {
    setLoading(true);
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchTournaments(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.date) { toast('Title and date required', 'error'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'tournaments'), {
        ...form,
        date: new Date(form.date),
        createdAt: serverTimestamp(),
      });
      toast('Tournament created! 🏆', 'success');
      setShowForm(false);
      setForm({ title: '', gameType: 'BGMI', date: '', entryFee: '', prizePool: '', googleFormLink: '', description: '', rules: '' });
      fetchTournaments();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tournament?')) return;
    await deleteDoc(doc(db, 'tournaments', id));
    setTournaments(p => p.filter(t => t.id !== id));
    toast('Tournament deleted', 'info');
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Tournament Manager</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ New Tournament'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 20 }}>Create Tournament Post</h3>
          <form onSubmit={handleCreate} className="admin-form-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Tournament Title</label>
              <input className="form-input" placeholder="BGMI Pro League Season 5" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Game Type</label>
              <select className="form-select" value={form.gameType}
                onChange={e => setForm(p => ({ ...p, gameType: e.target.value }))}>
                {GAME_TYPES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input type="datetime-local" className="form-input" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Entry Fee</label>
              <input className="form-input" placeholder="₹99 / Free" value={form.entryFee}
                onChange={e => setForm(p => ({ ...p, entryFee: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Prize Pool</label>
              <input className="form-input" placeholder="₹10,000" value={form.prizePool}
                onChange={e => setForm(p => ({ ...p, prizePool: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Google Form Reg. Link</label>
              <input className="form-input" placeholder="https://forms.gle/..." value={form.googleFormLink}
                onChange={e => setForm(p => ({ ...p, googleFormLink: e.target.value }))} required />
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Tournament description..." value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Rules (one per line)</label>
              <textarea className="form-textarea" placeholder="Each line = one rule" value={form.rules}
                onChange={e => setForm(p => ({ ...p, rules: e.target.value }))} rows={4} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Publishing...' : '📢 Publish Tournament'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="spinner" /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Game</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--grey-600)', padding: 32 }}>No tournaments yet</td></tr>
              ) : tournaments.map(t => (
                <tr key={t.id}>
                  <td className="t-name">{t.title}</td>
                  <td><span className="badge badge-primary">{t.gameType}</span></td>
                  <td style={{ color: 'var(--grey-400)', fontSize: 13 }}>
                    {t.date?.toDate ? t.date.toDate().toLocaleDateString('en-IN') : t.date}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================
   CARD MANAGER
========================================= */
function CardManager({ toast }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchProfiles() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'gameProfiles'), orderBy('createdAt', 'desc')));
    setProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  async function handleVerify(id, current) {
    await updateDoc(doc(db, 'gameProfiles', id), {
      status: current === 'verified' ? 'pending' : 'verified'
    });
    setProfiles(p => p.map(c => c.id === id ? { ...c, status: current === 'verified' ? 'pending' : 'verified' } : c));
    toast('Card status updated ✅', 'success');
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Player Card Engine</h2>
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player ID</th>
                <th>Game</th>
                <th>User</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--grey-600)', padding: 32 }}>No game profiles yet</td></tr>
              ) : profiles.map(p => (
                <tr key={p.id}>
                  <td className="t-name">
                    {p.playerName || 'GAMER'}<br/>
                    <span style={{ fontSize: 10, color: 'var(--grey-400)', fontFamily: 'Rajdhani, sans-serif' }}>ID: {p.playerId}</span>
                  </td>
                  <td><span className="badge badge-primary">{p.gameType}</span></td>
                  <td style={{ color: 'var(--grey-400)', fontSize: 12 }}>
                    Key: <span style={{ color: '#FFD700', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif' }}>{p.authKey || 'MISSING'}</span>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'verified' ? 'badge-success' : 'badge-grey'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${p.status === 'verified' ? 'btn-ghost' : 'btn-outline'}`}
                      onClick={() => handleVerify(p.id, p.status)}
                    >
                      {p.status === 'verified' ? 'Revoke' : '✓ Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================
   ROOM MANAGER
========================================= */
function RoomManager({ toast }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  async function fetchRooms() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'rooms'), orderBy('createdAt', 'desc')));
    setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchRooms(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'rooms'), {
        ...form, locked: false, createdAt: serverTimestamp()
      });
      toast('Room created! 💬', 'success');
      setForm({ name: '', description: '' });
      setShowCreate(false);
      fetchRooms();
    } catch (err) { toast(err.message, 'error'); }
    finally { setCreating(false); }
  }

  async function toggleLock(room) {
    await updateDoc(doc(db, 'rooms', room.id), { locked: !room.locked });
    setRooms(p => p.map(r => r.id === room.id ? { ...r, locked: !r.locked } : r));
    toast(`Room ${room.locked ? 'unlocked' : 'locked'} 🔒`, 'info');
  }

  async function handleDeleteRoom(id) {
    if (!confirm('Delete this room?')) return;
    await deleteDoc(doc(db, 'rooms', id));
    setRooms(p => p.filter(r => r.id !== id));
    toast('Room deleted', 'info');
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Community Control</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? '✕ Cancel' : '+ New Room'}
        </button>
      </div>
      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="Room name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            <input className="form-input" style={{ flex: 2 }} placeholder="Description (optional)" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? '...' : 'Create'}
            </button>
          </form>
        </div>
      )}
      {loading ? <div className="spinner" /> : (
        <div className="rooms-admin-list">
          {rooms.map(r => (
            <div key={r.id} className="room-admin-item">
              <div>
                <span className="room-admin-name"># {r.name}</span>
                {r.description && <p className="room-admin-desc">{r.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${r.locked ? 'badge-danger' : 'badge-success'}`}>
                  {r.locked ? '🔒 Locked' : 'Open'}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleLock(r)}>
                  {r.locked ? 'Unlock' : 'Lock'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRoom(r.id)}>Delete</button>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon">💬</div><p>No rooms created yet.</p></div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================
   REGISTRATION VIEWER
========================================= */
function RegistrationViewer({ toast }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const snap = await getDocs(query(collection(db, 'registrations'), orderBy('registeredAt', 'desc')));
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Tournament Registrations</h2>
        <span className="badge badge-primary">{registrations.length} total</span>
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Tournament ID</th>
                <th>Player ID</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--grey-600)', padding: 32 }}>No registrations yet</td></tr>
              ) : registrations.map(r => (
                <tr key={r.id}>
                  <td style={{ fontSize: 12, color: 'var(--grey-400)' }}>{r.userId?.slice(0, 12)}...</td>
                  <td style={{ fontSize: 12, color: 'var(--grey-400)' }}>{r.tournamentId?.slice(0, 12)}...</td>
                  <td className="t-name">{r.playerId?.slice(0, 16)}...</td>
                  <td><span className="badge badge-success">{r.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--grey-600)' }}>
                    {r.registeredAt?.toDate ? r.registeredAt.toDate().toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
