import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc,
  query, orderBy, serverTimestamp, onSnapshot
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
            { id: 'promotions', label: '📢 Promotions' },
            { id: 'messages', label: '📬 Inbox' },
            { id: 'chess_tourneys', label: '♟️ Chess Tournaments' },
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
        {activeTab === 'promotions' && <PromotionManager toast={toast} />}
        {activeTab === 'messages' && <MessageViewer toast={toast} />}
        {activeTab === 'chess_tourneys' && <ChessTournamentManager toast={toast} />}
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', gameType: 'BGMI', date: '', entryFee: '', prizePool: '', googleFormLink: '', description: '', rules: '', bannerUrl: ''
  });

  async function fetchTournaments() {
    setLoading(true);
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchTournaments(); }, []);

  function handleNew() {
    setForm({ title: '', gameType: 'BGMI', date: '', entryFee: '', prizePool: '', googleFormLink: '', description: '', rules: '', bannerUrl: '' });
    setEditingId(null);
    setShowForm(s => !s);
  }

  function handleEdit(t) {
    let dateStr = t.date;
    if (t.date?.toDate) {
      const d = t.date.toDate();
      const tzoffset = d.getTimezoneOffset() * 60000;
      dateStr = new Date(d - tzoffset).toISOString().slice(0, 16);
    }
    
    setForm({
      title: t.title || '',
      gameType: t.gameType || 'BGMI',
      date: dateStr || '',
      entryFee: t.entryFee || '',
      prizePool: t.prizePool || '',
      googleFormLink: t.googleFormLink || '',
      description: t.description || '',
      rules: t.rules || '',
      bannerUrl: t.bannerUrl || ''
    });
    setEditingId(t.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title || !form.date) { toast('Title and date required', 'error'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'tournaments', editingId), {
          ...form,
          date: new Date(form.date)
        });
        toast('Tournament updated! 🏆', 'success');
      } else {
        await addDoc(collection(db, 'tournaments'), {
          ...form,
          date: new Date(form.date),
          createdAt: serverTimestamp(),
        });
        toast('Tournament created! 🏆', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ title: '', gameType: 'BGMI', date: '', entryFee: '', prizePool: '', googleFormLink: '', description: '', rules: '', bannerUrl: '' });
      fetchTournaments();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Compress image to max 800px width
        const MAX_WIDTH = 800;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to lightweight base64 JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        setForm(p => ({ ...p, bannerUrl: compressedBase64 }));
        setUploadingImage(false);
        toast('Image processed and ready! 📸', 'success');
      };
      img.onerror = () => {
        setUploadingImage(false);
        toast('Failed to read image file', 'error');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setUploadingImage(false);
      toast('Failed to read file', 'error');
    };
    reader.readAsDataURL(file);
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
        <button className="btn btn-primary" onClick={handleNew}>
          {showForm ? '✕ Cancel' : '+ New Tournament'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 20 }}>{editingId ? 'Edit Tournament' : 'Create Tournament Post'}</h3>
          <form onSubmit={handleSave} className="admin-form-grid">
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
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Banner Image</label>
              <input type="file" accept="image/*" className="form-input" 
                onChange={handleImageUpload} disabled={uploadingImage} />
              {uploadingImage && <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>Uploading image... please wait</p>}
              {!uploadingImage && form.bannerUrl && <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ Image uploaded and ready</p>}
            </div>
            {/* Banner Preview */}
            <div className="form-group" style={{ gridColumn: '1/-1', marginBottom: 16 }}>
              <label className="form-label">Card Preview</label>
              <div style={{ maxWidth: 350, margin: '0 auto', pointerEvents: 'none' }}>
                <div className="t-card" style={{ '--t-color': '#FFD700', margin: 0 }}>
                  {form.bannerUrl && (
                    <div className="t-card-banner">
                      <img src={form.bannerUrl} alt="Banner Preview" />
                    </div>
                  )}
                  <div className="t-card-top">
                    <div className="t-card-game">
                      <span className="t-card-type">{form.gameType}</span>
                    </div>
                    <span className="badge badge-primary">UPCOMING</span>
                  </div>
                  <h3 className="t-card-title">{form.title || 'Tournament Title'}</h3>
                </div>
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Publishing...' : (editingId ? '💾 Save Changes' : '📢 Publish Tournament')}
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(t)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
                    </div>
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

/* =========================================
   PROMOTION MANAGER
========================================= */
function PromotionManager({ toast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [promo, setPromo] = useState({ bannerUrl: '', link: '', isActive: false });

  useEffect(() => {
    async function fetchPromo() {
      try {
        // We use getDocs to find if a settings document exists. Alternatively, use a known doc ID.
        // We'll use a specific doc ID 'homepage' inside the 'settings' collection.
        const docRef = doc(db, 'settings', 'homepage');
        const snap = await getDocs(query(collection(db, 'settings')));
        let data = snap.docs.find(d => d.id === 'homepage')?.data()?.promotion;
        if (data) setPromo(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPromo();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'homepage'), { promotion: promo })
        .catch(async (err) => {
          if (err.code === 'not-found') {
            await setDoc(doc(db, 'settings', 'homepage'), { promotion: promo });
          } else throw err;
        });
      toast('Promotion updated! 📢', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1200; // Larger for homepage banner
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setPromo(p => ({ ...p, bannerUrl: compressedBase64 }));
        setUploadingImage(false);
        toast('Banner processed!', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Industry Partner / Promotion Banner</h2>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <form onSubmit={handleSave} className="admin-form-grid">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Banner Image (Wide aspect ratio recommended)</label>
            <input type="file" accept="image/*" className="form-input" onChange={handleImageUpload} disabled={uploadingImage} />
            {uploadingImage && <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>Processing image...</p>}
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Target Link (Optional)</label>
            <input className="form-input" placeholder="https://..." value={promo.link}
              onChange={e => setPromo(p => ({ ...p, link: e.target.value }))} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="promo-active" checked={promo.isActive}
              onChange={e => setPromo(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            <label htmlFor="promo-active" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>Banner is Active (Visible on Homepage)</label>
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1', marginTop: 16 }}>
            <label className="form-label">Live Preview (As seen on Homepage)</label>
            <div style={{ width: '100%', background: 'var(--bg)', padding: '40px 24px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
              {promo.bannerUrl ? (
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                  <div style={{ display: 'block', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 0 30px rgba(255,215,0,0.1)', cursor: promo.link ? 'pointer' : 'default' }}>
                    <img src={promo.bannerUrl} alt="Promotion" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
                  <span style={{ color: 'var(--grey-600)' }}>No image uploaded</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Promotion Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================
   MESSAGE VIEWER (INBOX)
========================================= */
function MessageViewer({ toast }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const snap = await getDocs(query(collection(db, 'contacts'), orderBy('createdAt', 'desc')));
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'contacts', id));
      setMessages(p => p.filter(m => m.id !== id));
      toast('Message deleted', 'info');
    } catch (err) {
      toast('Failed to delete', 'error');
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Support Inbox</h2>
        <span className="badge badge-primary">{messages.length} messages</span>
      </div>
      
      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>Your inbox is empty.</p>
            </div>
          ) : messages.map(msg => (
            <div key={msg.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: 'var(--primary)' }}>{msg.name}</h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--grey-400)' }}>
                    <a href={`mailto:${msg.email}`} style={{ color: 'var(--info)' }}>{msg.email}</a>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--grey-600)' }}>
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString('en-IN') : 'Just now'}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(msg.id)}>🗑️ Delete</button>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'var(--white)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================
   CHESS TOURNAMENT MANAGER
========================================= */
function ChessTournamentManager({ toast }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'chessTournaments'), orderBy('createdAt', 'desc')), snap => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleHost() {
    try {
      const tid = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, 'chessTournaments', tid), {
        status: 'pooling',
        players: [],
        matches: [],
        createdAt: serverTimestamp()
      });
      toast('Tournament Hub created!', 'success');
    } catch(err) {
      toast(err.message, 'error');
    }
  }

  async function generateBracket(tid, players) {
    if (!players || players.length < 2) {
      toast('Need at least 2 players', 'error');
      return;
    }
    // Simple shuffle for MVP
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const matches = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i];
      const p2 = shuffled[i+1];
      if (!p2) {
        // Bye
        matches.push({ matchId: `R1-M${i}`, round: 1, player1: p1, player2: null, boardId: null, winner: p1.uid });
        continue;
      }
      const boardId = Math.random().toString(36).substring(2, 8).toUpperCase();
      // create chessGames document for this match
      await setDoc(doc(db, 'chessGames', boardId), {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        history: [],
        whitePlayer: p1.uid,
        blackPlayer: p2.uid,
        status: 'playing',
        mode: 'rapid', // default
        whiteTime: 600,
        blackTime: 600,
        lastMoveAt: Date.now(),
        createdAt: serverTimestamp()
      });
      
      matches.push({ matchId: `R1-M${i}`, round: 1, player1: p1, player2: p2, boardId, winner: null });
    }

    await updateDoc(doc(db, 'chessTournaments', tid), {
      status: 'active',
      matches
    });
    toast('Bracket generated and matches live!', 'success');
  }

  async function syncResults(tid, tData) {
    if (!tData.matches) return;
    const updatedMatches = [...tData.matches];
    let changed = false;
    for (let m of updatedMatches) {
      if (!m.winner && m.boardId) {
        const boardSnap = await getDoc(doc(db, 'chessGames', m.boardId));
        if (boardSnap.exists()) {
          const bData = boardSnap.data();
          if (bData.status === 'completed') {
            if (bData.winner === 'white') m.winner = bData.whitePlayer;
            else if (bData.winner === 'black') m.winner = bData.blackPlayer;
            else m.winner = bData.whitePlayer; // fallback draw to white for MVP
            changed = true;
          }
        }
      }
    }
    if (changed) {
      await updateDoc(doc(db, 'chessTournaments', tid), { matches: updatedMatches });
      toast('Synced latest match results!', 'success');
    } else {
      toast('No new results available.', 'info');
    }
  }

  async function generateNextRound(tid, tData) {
    if (!tData.matches || tData.matches.length === 0) return;
    const currentRound = Math.max(...tData.matches.map(m => m.round));
    const currentRoundMatches = tData.matches.filter(m => m.round === currentRound);
    
    if (currentRoundMatches.some(m => !m.winner)) {
      toast('Not all matches in this round are completed!', 'error');
      return;
    }

    const winners = currentRoundMatches.map(m => {
       if (m.winner === m.player1?.uid) return m.player1;
       if (m.winner === m.player2?.uid) return m.player2;
       return null;
    }).filter(Boolean);

    if (winners.length === 1) {
      await updateDoc(doc(db, 'chessTournaments', tid), {
        status: 'completed',
        tournamentWinner: winners[0]
      });
      toast(`Tournament Complete! Winner: ${winners[0].name}`, 'success');
      return;
    }

    const newMatches = [...tData.matches];
    for (let i = 0; i < winners.length; i += 2) {
      const p1 = winners[i];
      const p2 = winners[i+1];
      
      if (!p2) {
        newMatches.push({ matchId: `R${currentRound+1}-M${i}`, round: currentRound + 1, player1: p1, player2: null, boardId: null, winner: p1.uid });
        continue;
      }

      const boardId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, 'chessGames', boardId), {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        history: [],
        whitePlayer: p1.uid,
        blackPlayer: p2.uid,
        status: 'playing',
        mode: 'rapid', 
        whiteTime: 600,
        blackTime: 600,
        lastMoveAt: Date.now(),
        createdAt: serverTimestamp()
      });
      
      newMatches.push({ matchId: `R${currentRound+1}-M${i}`, round: currentRound + 1, player1: p1, player2: p2, boardId, winner: null });
    }

    await updateDoc(doc(db, 'chessTournaments', tid), { matches: newMatches });
    toast(`Round ${currentRound + 1} generated!`, 'success');
  }

  function renderBracket(t) {
    if (!t.matches) return null;
    const rounds = {};
    t.matches.forEach(m => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    });

    return (
      <div style={{ display: 'flex', gap: 40, overflowX: 'auto', padding: '24px 0' }}>
        {Object.entries(rounds).map(([roundNum, matches]) => (
          <div key={roundNum} style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
            <h4 style={{ color: '#FFD700', fontFamily: 'Orbitron', textAlign: 'center', marginBottom: 16 }}>Round {roundNum}</h4>
            {matches.map(m => (
              <div key={m.matchId} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, padding: 12, minWidth: 200, position: 'relative' }}>
                <div style={{ padding: 4, borderBottom: '1px solid rgba(255,255,255,0.05)', color: m.winner === m.player1?.uid ? '#00f260' : '#fff' }}>
                  {m.player1?.name || 'TBD'}
                </div>
                <div style={{ padding: 4, color: m.winner === m.player2?.uid ? '#00f260' : '#fff' }}>
                  {m.player2 ? m.player2.name : 'BYE'}
                </div>
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  {m.winner ? (
                    <span style={{ color: '#00f260', fontSize: 10, fontFamily: 'Orbitron' }}>COMPLETED</span>
                  ) : m.boardId ? (
                    <span style={{ color: '#00ffff', fontSize: 10, fontFamily: 'Orbitron' }}>Board: {m.boardId}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
        {t.status === 'completed' && t.tournamentWinner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
            <h4 style={{ color: '#FFD700', fontFamily: 'Orbitron', textAlign: 'center', marginBottom: 16 }}>Champion</h4>
            <div style={{ background: 'rgba(0,242,96,0.1)', border: '2px solid #00f260', borderRadius: 8, padding: 24, minWidth: 200, textAlign: 'center', boxShadow: '0 0 30px rgba(0,242,96,0.3)' }}>
              <span style={{ fontSize: 40 }}>🏆</span><br/>
              <strong style={{ color: '#00f260', fontFamily: 'Orbitron', fontSize: 20 }}>{t.tournamentWinner.name}</strong>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="spinner"></div>;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Orbitron', color: '#FFD700' }}>Chess Tournament Hub</h2>
        <button className="btn btn-primary" onClick={handleHost}>⚡ Host New Tournament</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {tournaments.map(t => (
          <div key={t.id} className="card" style={{ padding: 24 }}>
            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'Orbitron', fontSize: 24 }}>ID: {t.id} <span style={{ fontSize: 12, padding: '4px 8px', background: t.status === 'pooling' ? 'rgba(255,215,0,0.1)' : 'rgba(0,255,100,0.1)', borderRadius: 4, color: t.status === 'pooling' ? '#FFD700' : '#00f260', marginLeft: 12 }}>{t.status.toUpperCase()}</span></h3>
                <p style={{ color: 'var(--grey-500)', fontSize: 13, marginTop: 4 }}>Joined Players: {t.players?.length || 0}</p>
              </div>
              {t.status === 'pooling' && (
                <button className="btn btn-outline" onClick={() => generateBracket(t.id, t.players)}>Generate Bracket</button>
              )}
            </div>

            {t.status === 'pooling' && (
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <p style={{ marginBottom: 8, fontSize: 12, color: 'var(--grey-400)' }}>Player Scan to Join</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/games/tournament?id=' + t.id)}&bgcolor=ffffff&color=000000`} alt="QR" style={{ width: 120, height: 120, borderRadius: 8 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontFamily: 'Orbitron', color: '#FFD700', marginBottom: 12 }}>Waiting Pool</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {t.players?.map(p => (
                      <span key={p.uid} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 20, fontSize: 14 }}>{p.name} ({p.rating})</span>
                    ))}
                    {(!t.players || t.players.length === 0) && <span style={{ color: 'var(--grey-600)' }}>No players yet.</span>}
                  </div>
                </div>
              </div>
            )}

            {(t.status === 'active' || t.status === 'completed') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontFamily: 'Orbitron', color: '#FFD700' }}>Live Tournament Web</h4>
                  {t.status === 'active' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => syncResults(t.id, t)}>🔄 Sync Results</button>
                      <button className="btn btn-primary btn-sm" onClick={() => generateNextRound(t.id, t)}>▶ Next Round</button>
                    </div>
                  )}
                </div>
                
                <div style={{ background: 'rgba(25,25,25,0.8)', padding: 24, borderRadius: 12, overflowX: 'auto', border: '1px solid rgba(255,215,0,0.1)' }}>
                  {renderBracket(t)}
                </div>

                <div style={{ marginTop: 24 }}>
                  <h5 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: 12 }}>Match Overview</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {t.matches?.map(m => (
                      <div key={m.matchId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 8 }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <span style={{ color: m.winner === m.player1?.uid ? '#00f260' : '#fff' }}>{m.player1?.name}</span>
                          <span style={{ color: 'var(--grey-500)' }}>vs</span>
                          <span style={{ color: m.winner === m.player2?.uid ? '#00f260' : '#fff' }}>{m.player2 ? m.player2.name : 'BYE'}</span>
                        </div>
                        <div style={{ fontFamily: 'Orbitron', fontSize: 12 }}>
                          {m.winner ? <span style={{ color: '#00f260' }}>Completed</span> : <span style={{ color: '#00ffff' }}>Board: {m.boardId}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {tournaments.length === 0 && <p style={{ textAlign: 'center', color: 'var(--grey-500)', marginTop: 40 }}>No chess tournaments hosted yet.</p>}
      </div>
    </div>
  );
}
