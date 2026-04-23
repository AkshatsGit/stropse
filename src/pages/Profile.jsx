import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Profile.css';

export default function Profile() {
  const { user, userProfile, setUserProfile, refreshProfile } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
  });

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
              <div className="profile-avatar-large">
                {userProfile?.profilePicture ? (
                  <img src={userProfile.profilePicture} alt="avatar" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
              </div>
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
                  <span className="mini-stat-val">—</span>
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

                <div className="card">
                  <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 16 }}>Quick Links</h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href="/game-profiles" className="btn btn-outline btn-sm">🪪 My Player Cards</a>
                    <a href="/tournaments" className="btn btn-outline btn-sm">🏆 Browse Tournaments</a>
                    <a href="/community" className="btn btn-outline btn-sm">💬 Community</a>
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
