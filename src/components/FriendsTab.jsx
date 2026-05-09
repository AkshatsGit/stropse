import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import ChatModal from './ChatModal';

export default function FriendsTab() {
  const { user, userProfile, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [requestsData, setRequestsData] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!userProfile) return;
      setLoading(true);
      try {
        const reqIds = userProfile.friendRequests || [];
        const frIds = userProfile.friends || [];

        // Fetch requests (chunking to avoid 'in' limit of 10)
        let fetchedReqs = [];
        if (reqIds.length > 0) {
          for (let i = 0; i < reqIds.length; i += 10) {
            const chunk = reqIds.slice(i, i + 10);
            const q = query(collection(db, 'users'), where('uid', 'in', chunk));
            const snap = await getDocs(q);
            fetchedReqs.push(...snap.docs.map(d => d.data()));
          }
        }
        setRequestsData(fetchedReqs);

        // Fetch friends
        let fetchedFrs = [];
        if (frIds.length > 0) {
          for (let i = 0; i < frIds.length; i += 10) {
            const chunk = frIds.slice(i, i + 10);
            const q = query(collection(db, 'users'), where('uid', 'in', chunk));
            const snap = await getDocs(q);
            fetchedFrs.push(...snap.docs.map(d => d.data()));
          }
        }
        setFriendsData(fetchedFrs);

      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userProfile]);

  async function handleAccept(targetId) {
    try {
      // Remove from requests, add to friends (for current user)
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequests: arrayRemove(targetId),
        friends: arrayUnion(targetId)
      });
      // Add current user to target's friends
      await updateDoc(doc(db, 'users', targetId), {
        friends: arrayUnion(user.uid)
      });
      toast('Friend request accepted!', 'success');
      refreshProfile();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleReject(targetId) {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequests: arrayRemove(targetId)
      });
      toast('Friend request rejected.', 'info');
      refreshProfile();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleRemoveFriend(targetId) {
    if (!window.confirm("Remove this friend?")) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayRemove(targetId)
      });
      await updateDoc(doc(db, 'users', targetId), {
        friends: arrayRemove(user.uid)
      });
      toast('Friend removed.', 'info');
      refreshProfile();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function handleChat(friend) {
    setActiveChat(friend);
  }

  function handleChallenge(friendId) {
    // For now, redirect to games lobby or create a typing match explicitly
    navigate('/games');
    toast('Choose a game to challenge your friend!', 'info');
  }

  if (loading) return <div className="spinner" style={{ margin: '40px auto' }}></div>;

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ fontFamily: 'Orbitron', fontSize: 18, color: '#00ffff', marginBottom: 24 }}>Manage Friends</h3>
      
      {/* Pending Requests */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontFamily: 'Rajdhani', fontSize: 16, color: '#FFD700', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: 8, marginBottom: 16 }}>Pending Requests ({requestsData.length})</h4>
        {requestsData.length === 0 ? (
          <p style={{ color: 'var(--grey-500)', fontSize: 13 }}>No pending friend requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requestsData.map(req => (
              <div key={req.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {req.profilePicture ? <img src={req.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (req.name || 'U').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <Link to={`/profile/${req.uid}`} style={{ fontWeight: 'bold', fontSize: 15, color: '#fff', textDecoration: 'none' }}>{req.name}</Link>
                    <div style={{ fontSize: 12, color: 'var(--grey-500)' }}>@{req.username}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" style={{ borderColor: '#00f260', color: '#00f260', padding: '4px 12px' }} onClick={() => handleAccept(req.uid)}>Accept</button>
                  <button className="btn btn-outline btn-sm" style={{ borderColor: '#ff4444', color: '#ff4444', padding: '4px 12px' }} onClick={() => handleReject(req.uid)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Friends */}
      <div>
        <h4 style={{ fontFamily: 'Rajdhani', fontSize: 16, color: '#00ffff', borderBottom: '1px solid rgba(0,255,255,0.2)', paddingBottom: 8, marginBottom: 16 }}>My Friends ({friendsData.length})</h4>
        {friendsData.length === 0 ? (
          <p style={{ color: 'var(--grey-500)', fontSize: 13 }}>You haven't added any friends yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {friendsData.map(friend => (
              <div key={friend.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {friend.profilePicture ? <img src={friend.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (friend.name || 'U').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <Link to={`/profile/${friend.uid}`} style={{ fontWeight: 'bold', fontSize: 15, color: '#fff', textDecoration: 'none' }}>{friend.name}</Link>
                    <div style={{ fontSize: 12, color: 'var(--grey-500)' }}>@{friend.username}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" style={{ padding: '4px 12px' }} onClick={() => handleChallenge(friend.uid)}>⚔️ Challenge</button>
                  <button className="btn btn-outline btn-sm" style={{ padding: '4px 12px' }} onClick={() => handleChat(friend)}>💬 Chat</button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px 12px', color: '#ff4444' }} onClick={() => handleRemoveFriend(friend.uid)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeChat && (
        <ChatModal friend={activeChat} onClose={() => setActiveChat(null)} />
      )}
    </div>
  );
}
