import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import PlayerCard from '../components/PlayerCard';

export default function CardView() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'gameProfiles'),
          where('playerId', '==', profileId),
          where('status', '==', 'verified')
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setNotFound(true);
        } else {
          setProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileId]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.05) 0%, #050505 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img src="/stropse-seal.png" alt="STROPSE" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', mixBlendMode: 'screen', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 22, fontWeight: 900, letterSpacing: 4, color: '#FFD700' }}>STROPSE</div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#666', letterSpacing: 2 }}>GLOBAL ESPORTS FEDERATION</div>
      </div>

      {loading ? (
        <div className="spinner" style={{ margin: '40px auto' }} />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 18, color: '#aaa', marginBottom: 8 }}>Card Not Found</h2>
          <p style={{ fontSize: 14 }}>This player card is either pending verification or doesn't exist.</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#00ff88', letterSpacing: 2 }}>
            ✓ VERIFIED STROPSE PLAYER
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PlayerCard profile={profile} />
          </div>
          <div style={{ marginTop: 24, padding: '16px 32px', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#666', marginBottom: 6 }}>OFFICIALLY VERIFIED BY</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#FFD700', letterSpacing: 4 }}>STROPSE</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 11, color: '#444', marginTop: 6, letterSpacing: 1 }}>EST. 2026 · UNITY THROUGH COMPETITION</div>
          </div>
        </div>
      )}
    </div>
  );
}
