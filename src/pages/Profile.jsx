import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';
import './Profile.css';

export default function Profile() {
  const { user, userProfile, setUserProfile, refreshProfile } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [verifiedCards, setVerifiedCards] = useState([]);
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
  });

  useEffect(() => {
    async function loadCards() {
      if (!user) return;
      try {
        const q = query(collection(db, 'gameProfiles'), where('userId', '==', user.uid), where('status', '==', 'verified'));
        const snap = await getDocs(q);
        setVerifiedCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load cards", err);
      }
    }
    loadCards();
  }, [user]);

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

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

  const initials = (userProfile?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPic(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Small size for profile pics
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64String = canvas.toDataURL('image/jpeg', 0.6);
        
        updateDoc(doc(db, 'users', user.uid), { profilePicture: base64String })
          .then(() => {
             refreshProfile();
             toast('Profile picture updated!', 'success');
          })
          .catch(err => toast(err.message, 'error'))
          .finally(() => setUploadingPic(false));
      };
      img.onerror = () => {
        setUploadingPic(false);
        toast('Failed to load image', 'error');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setUploadingPic(false);
      toast('Failed to read file', 'error');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <p className="section-tag">⚡ IDENTITY</p>
          <h1>My <span className="text-glow">Profile</span></h1>
        </div>

        <div className="profile-layout">
          {/* Left - Avatar */}
          <div className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-avatar-large" onClick={() => document.getElementById('profile-pic-upload').click()}>
                {uploadingPic && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                    <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                  </div>
                )}
                {userProfile?.profilePicture ? (
                  <img src={userProfile.profilePicture} alt="avatar" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
                <div className="avatar-edit-overlay">
                  <span>📷 Edit</span>
                </div>
              </div>
              <input type="file" id="profile-pic-upload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
              <h2 className="profile-name">{userProfile?.name || 'Player'}</h2>
              <p className="profile-username">@{userProfile?.username || 'username'}</p>
              <div className="profile-email">
                <span>📧</span> {user?.email}
              </div>
              {userProfile?.bio && (
                <p className="profile-bio">{userProfile.bio}</p>
              )}
              <button className="btn btn-outline btn-full" onClick={() => setEditing(e => !e)}>
                {editing ? '✕ Cancel' : '✏️ Edit Profile'}
              </button>
            </div>

            {/* Stats Mini */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="profile-mini-stats">
                <div className="profile-mini-stat">
                  <span className="mini-stat-val">{userProfile?.friends?.length || 0}</span>
                  <span className="mini-stat-label">Friends</span>
                </div>
                <div className="profile-mini-stat">
                  <span className="mini-stat-val">—</span>
                  <span className="mini-stat-label">Tournaments</span>
                </div>
                <div className="profile-mini-stat">
                  <span className="mini-stat-val">{verifiedCards.length}</span>
                  <span className="mini-stat-label">Cards</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Edit Form or Info */}
          <div className="profile-main">
            {editing ? (
              <div className="card">
                <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 16, marginBottom: 24 }}>
                  ✏️ Edit Profile
                </h3>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input name="name" className="form-input" value={form.name} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input name="username" className="form-input" value={form.username} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea name="bio" className="form-textarea" value={form.bio} onChange={handleChange}
                      placeholder="Tell the community about yourself..." rows={4} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-ghost btn-full" onClick={() => setEditing(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                {/* Profile Info Sections */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 20 }}>Account Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { label: 'Full Name', value: userProfile?.name || '—' },
                      { label: 'Username', value: `@${userProfile?.username || '—'}` },
                      { label: 'Email', value: user?.email },
                      { label: 'Bio', value: userProfile?.bio || 'No bio yet.' },
                    ].map(({ label, value }) => (
                      <div key={label} className="profile-detail-row">
                        <span className="profile-detail-label">{label}</span>
                        <span className="profile-detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 16 }}>Verified Player Cards</h3>
                  {verifiedCards.length > 0 ? (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {verifiedCards.map(card => (
                        <div key={card.id} style={{ width: 280 }}>
                          <PlayerCard profile={card} compact />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--grey-600)' }}>No verified cards yet. Create one and wait for admin approval.</p>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 16 }}>Quick Links</h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to="/game-profiles" className="btn btn-outline btn-sm">🪪 Manage Player Cards</Link>
                    <Link to="/tournaments" className="btn btn-outline btn-sm">🏆 Browse Tournaments</Link>
                    <Link to="/community" className="btn btn-outline btn-sm">💬 Community</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
