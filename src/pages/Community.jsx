import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp, getDocs, where, deleteDoc, doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Community.css';

const ChatMessage = memo(({ msg, myUid, onDelete }) => {
  const isMe = msg.userId === myUid;
  const time = msg.createdAt?.toDate
    ? msg.createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const [showOptions, setShowOptions] = useState(false);
  const pressTimer = useRef(null);

  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => {
      setShowOptions(true);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div 
      className={`chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-other'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className="chat-msg-author">{msg.userName || 'Anonymous'}</div>
      <div className="chat-bubble-wrapper">
        <div className="chat-bubble">{msg.text}</div>
        {isMe && showOptions && (
          <button className="chat-msg-delete" onClick={() => onDelete(msg.id)} title="Delete Message">
            🗑️
          </button>
        )}
      </div>
      <div className="chat-time">{time}</div>
    </div>
  );
});

export default function Community() {
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [view, setView] = useState('rooms'); // 'rooms' | 'chat' | 'friends'
  const [friends, setFriends] = useState([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [requests, setRequests] = useState([]);
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);

  // Load public rooms
  useEffect(() => {
    async function loadRooms() {
      const snap = await getDocs(query(collection(db, 'rooms'), orderBy('createdAt', 'asc')));
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    loadRooms();
  }, []);

  // Load friends & requests
  useEffect(() => {
    if (!user) return;
    async function loadFriends() {
      const snap = await getDocs(query(
        collection(db, 'friendships'),
        where('users', 'array-contains', user.uid)
      ));
      const fs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFriends(fs.filter(f => f.status === 'accepted'));
      setRequests(fs.filter(f => f.status === 'pending' && f.to === user.uid));
    }
    loadFriends();
  }, [user]);

  // Subscribe to messages
  const subscribeMessages = useCallback((roomId) => {
    if (unsubRef.current) unsubRef.current();
    const q = query(
      collection(db, 'chats'),
      where('roomId', '==', roomId)
    );
    unsubRef.current = onSnapshot(q, snap => {
      let msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a,b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMessages(msgs.slice(-100)); // Keep only latest 100
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, err => {
      toast('Failed to load chat: ' + err.message, 'error');
    });
  }, []);

  function enterRoom(room) {
    if (room.locked) { toast('This room is locked', 'error'); return; }
    setActiveRoom(room);
    subscribeMessages(room.id);
    setView('chat');
  }

  function leaveRoom() {
    if (unsubRef.current) unsubRef.current();
    setActiveRoom(null);
    setMessages([]);
    setView('rooms');
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chats'), {
        roomId: activeRoom.id,
        userId: user.uid,
        userName: userProfile?.username || user.email,
        text: input.trim(),
        createdAt: serverTimestamp(),
      });
      setInput('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(msgId) {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'chats', msgId));
      toast('Message deleted', 'success');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  }

  async function sendFriendRequest() {
    if (!friendUsername.trim()) return;
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', friendUsername.trim())));
      if (snap.empty) { toast('User not found', 'error'); return; }
      const targetUser = snap.docs[0];
      if (targetUser.id === user.uid) { toast('You cannot add yourself!', 'error'); return; }
      await addDoc(collection(db, 'friendships'), {
        users: [user.uid, targetUser.id],
        from: user.uid,
        to: targetUser.id,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast(`Friend request sent to ${friendUsername}! ✉️`, 'success');
      setFriendUsername('');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  useEffect(() => () => { if (unsubRef.current) unsubRef.current(); }, []);

  return (
    <div className="community-page">
      <div className="container">
        <div className="page-header">
          <p className="section-tag">⚡ COMMUNITY</p>
          <h1>Chat <span className="text-glow">Rooms</span></h1>
        </div>

        {/* Nav */}
        <div className="community-nav">
          <button className={`filter-btn ${view === 'rooms' || view === 'chat' ? 'filter-btn-active' : ''}`}
            onClick={() => { leaveRoom(); setView('rooms'); }}>
            💬 Public Rooms
          </button>
          <button className={`filter-btn ${view === 'friends' ? 'filter-btn-active' : ''}`}
            onClick={() => { leaveRoom(); setView('friends'); }}>
            👥 Friends ({friends.length})
          </button>
        </div>

        {/* Chat View */}
        {view === 'chat' && activeRoom && (
          <div className="chat-view">
            <div className="chat-header">
              <button className="btn btn-ghost btn-sm" onClick={leaveRoom}>← Back</button>
              <div>
                <h2 className="chat-room-name"># {activeRoom.name}</h2>
                {activeRoom.description && (
                  <p style={{ fontSize: 12, color: 'var(--grey-600)', fontFamily: 'Inter,sans-serif' }}>{activeRoom.description}</p>
                )}
              </div>
              <div className="badge badge-success">LIVE</div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--grey-700)', fontFamily: 'Orbitron,sans-serif', fontSize: 12, letterSpacing: '0.2em', padding: '40px 0' }}>
                  NO MESSAGES YET — BE THE FIRST!
                </div>
              )}
              {messages.map(msg => (
                <ChatMessage key={msg.id} msg={msg} myUid={user.uid} onDelete={deleteMessage} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input-form">
              <input
                className="form-input chat-input"
                placeholder={`Message #${activeRoom.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {sending ? '...' : <>Send <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg></>}
              </button>
            </form>
          </div>
        )}

        {/* Rooms View */}
        {view === 'rooms' && (
          <div>
            {rooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>No Rooms Yet</h3>
                <p>Admin will create rooms soon. Check back later.</p>
              </div>
            ) : (
              <div className="rooms-grid">
                {rooms.map(room => (
                  <button key={room.id} className="room-card" onClick={() => enterRoom(room)}>
                    <div className="room-card-header">
                      <span className="room-card-name"># {room.name}</span>
                      {room.locked
                        ? <span className="badge badge-danger">🔒 LOCKED</span>
                        : <span className="badge badge-success">OPEN</span>}
                    </div>
                    {room.description && (
                      <p className="room-card-desc">{room.description}</p>
                    )}
                    <span className="room-card-join">
                      {room.locked ? 'Locked' : 'Join Room →'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends View */}
        {view === 'friends' && (
          <div className="friends-view">
            <div className="card" style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 16 }}>Add Friend</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  className="form-input"
                  placeholder="Enter username..."
                  value={friendUsername}
                  onChange={e => setFriendUsername(e.target.value)}
                />
                <button className="btn btn-primary" onClick={sendFriendRequest}>Send Request</button>
              </div>
            </div>

            {requests.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, marginBottom: 16 }}>
                  Pending Requests ({requests.length})
                </h3>
                {requests.map(r => (
                  <div key={r.id} className="friend-item">
                    <span>📩 Friend request from UID: {r.from}</span>
                  </div>
                ))}
              </div>
            )}

            {friends.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No Friends Yet</h3>
                <p>Search for players by username to add them.</p>
              </div>
            ) : (
              <div className="friends-list">
                {friends.map(f => (
                  <div key={f.id} className="friend-item">
                    <span className="badge badge-success">🟢</span>
                    <span style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 16 }}>
                      {f.users.find(u => u !== user.uid)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
