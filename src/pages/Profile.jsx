import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useParams } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';
import './Profile.css';

export default function Profile() {
  const { id } = useParams(); // URL param for public profile
  const { user, userProfile: ownProfile, refreshProfile } = useAuth();
  const toast = useToast();
  
  // Decide if we are looking at our own profile
  const isOwnProfile = !id || id === user?.uid;
  const targetId = id || user?.uid;

  const [targetUser, setTargetUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', bio: '' });

  useEffect(() => {
    async function loadProfile() {
      if (!targetId) return;
      setLoading(true);
      try {
        // 1. Get User Profile
        let profileData = null;
        if (isOwnProfile && ownProfile) {
          profileData = ownProfile;
        } else {
          const snap = await getDoc(doc(db, 'users', targetId));
          if (snap.exists()) profileData = { id: snap.id, ...snap.data() };
        }
        setTargetUser(profileData);
        if (profileData) {
          setForm({
            name: profileData.name || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
          });
        }

        // 2. Get Player Cards
        const q = query(
          collection(db, 'gameProfiles'), 
          where('userId', '==', targetId), 
          where('status', '==', 'verified')
        );
        const cardSnap = await getDocs(q);
        const allCards = cardSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter: if public, only show those with onDisplay !== false
        if (isOwnProfile) {
          setCards(allCards);
        } else {
          setCards(allCards.filter(c => c.onDisplay !== false));
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [targetId, isOwnProfile, ownProfile]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name,
        username: form.username,
        bio: form.bio,
      });
      await refreshProfile();
      setEditing(false);
      toast('Profile updated! ✅', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleDisplay(cardId, current) {
    try {
      await updateDoc(doc(db, 'gameProfiles', cardId), { onDisplay: !current });
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, onDisplay: !current } : c));
      toast(`Card ${!current ? 'visible' : 'hidden'} on profile`, 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!targetUser) return <div className="container" style={{ padding: 100, textAlign: 'center' }}><h2>User not found</h2><Link to="/">Back Home</Link></div>;

  const initials = (targetUser.name || targetUser.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <p className="section-tag">⚡ {isOwnProfile ? 'IDENTITY' : 'PLAYER PROFILE'}</p>
          <h1>{isOwnProfile ? 'My' : `${targetUser.name}'s`} <span className="text-glow">Profile</span></h1>
        </div>

        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-avatar-large" onClick={() => isOwnProfile && document.getElementById('pic-up').click()}>
                {uploadingPic && <div className="spinner-overlay"><div className="spinner" /></div>}
                {targetUser.profilePicture ? <img src={targetUser.profilePicture} alt="avatar" /> : <span className="avatar-initials">{initials}</span>}
                {isOwnProfile && <div className="avatar-edit-overlay"><span>📷 Edit</span></div>}
              </div>
              <input type="file" id="pic-up" style={{ display: 'none' }} accept="image/*" onChange={(e) => {/* Handle upload logic if needed */}} />
              <h2 className="profile-name">{targetUser.name || 'Player'}</h2>
              <p className="profile-username">@{targetUser.username || 'username'}</p>
              <div className="profile-email"><span>📧</span> {targetUser.email}</div>
              {targetUser.bio && <p className="profile-bio">{targetUser.bio}</p>}
              {isOwnProfile && (
                <button className="btn btn-outline btn-full" onClick={() => setEditing(!editing)}>
                  {editing ? '✕ Cancel' : '✏️ Edit Profile'}
                </button>
              )}
            </div>
          </div>

          <div className="profile-main">
            {editing && isOwnProfile ? (
              <div className="card">
                <h3 style={{ fontFamily: 'Orbitron', fontSize: 16, marginBottom: 24 }}>✏️ Edit Profile</h3>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" rows={4} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-ghost btn-full" onClick={() => setEditing(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-full" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'Orbitron', fontSize: 14, marginBottom: 20 }}>Verified Player Cards</h3>
                  {cards.length > 0 ? (
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {cards.map(card => (
                        <div key={card.id} style={{ width: 280, position: 'relative' }}>
                          <PlayerCard profile={card} compact />
                          {isOwnProfile && (
                            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: card.onDisplay !== false ? '#FFD700' : '#666' }}>
                                {card.onDisplay !== false ? '● Visible' : '○ Hidden'}
                              </span>
                              <button onClick={() => toggleDisplay(card.id, card.onDisplay !== false)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: 10 }}>
                                {card.onDisplay !== false ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#666', fontSize: 13 }}>No cards to display.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
