import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function ChatModal({ friend, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const chatId = [user.uid, friend.uid].sort().join('_');

  useEffect(() => {
    if (!user || !friend) return;
    const q = query(collection(db, 'chats'), where('chatId', '==', chatId));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      setMessages(msgs);
    }, (err) => {
      console.error("Chat fetch error:", err);
    });
    return () => unsub();
  }, [chatId, user, friend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const text = input;
    setInput('');
    try {
      await addDoc(collection(db, 'chats'), {
        chatId,
        senderId: user.uid,
        text: text.trim(),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 320, height: 400, background: '#111', border: '1px solid #333', borderRadius: 12, display: 'flex', flexDirection: 'column', zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1a1a1a', borderBottom: '1px solid #333', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden' }}>
            {friend.profilePicture ? <img src={friend.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{(friend.name || 'U').slice(0, 1)}</span>}
          </div>
          <strong style={{ fontSize: 14 }}>{friend.name}</strong>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(m => {
          const isMe = m.senderId === user.uid;
          return (
            <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? '#00ffff' : '#2a2a2a', color: isMe ? '#000' : '#fff', padding: '8px 12px', borderRadius: 12, maxWidth: '80%', fontSize: 13, borderBottomRightRadius: isMe ? 0 : 12, borderBottomLeftRadius: isMe ? 12 : 0 }}>
              {m.text}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: 12, borderTop: '1px solid #333', background: '#0a0a0a', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 14 }} autoFocus />
        <button type="submit" style={{ background: 'transparent', border: 'none', color: '#00ffff', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
      </form>
    </div>
  );
}
