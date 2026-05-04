import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Games.css';

export default function TournamentLobby() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('id');

  const [tData, setTData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;

    const unsub = onSnapshot(doc(db, 'chessTournaments', tournamentId), (snap) => {
      if (snap.exists()) {
        setTData(snap.data());
      } else {
        toast('Tournament not found.', 'error');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [tournamentId, toast]);

  async function handleJoinPool() {
    if (!user) {
      toast('Please log in first.', 'error');
      navigate('/auth');
      return;
    }
    try {
      await updateDoc(doc(db, 'chessTournaments', tournamentId), {
        players: arrayUnion({
          uid: user.uid,
          name: profile?.playerName || user.displayName || 'Player',
          rating: profile?.stats?.elo || 1200
        })
      });
      toast('Joined the tournament pool!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (!tournamentId) {
    return (
      <div className="chess-page container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <h2>Invalid Tournament Link</h2>
        <p>Please scan the QR code provided by the admin.</p>
      </div>
    );
  }

  if (loading) return <div className="spinner" style={{ margin: '100px auto' }}></div>;
  if (!tData) return <div className="container" style={{ paddingTop: 100 }}>Tournament not found.</div>;

  const hasJoined = tData.players?.find(p => p.uid === user?.uid);
  const myMatch = tData.matches?.find(m => (m.player1?.uid === user?.uid || m.player2?.uid === user?.uid) && !m.winner);

  return (
    <div className="chess-page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="section-tag">⚡ LIVE EVENT</p>
          <h1 style={{ fontSize: 40 }}>Knockout <span className="text-glow">Arena</span></h1>
          <p className="section-subtitle">Tournament ID: {tournamentId}</p>
        </div>

        {tData.status === 'pooling' && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: 16 }}>Waiting for Players</h2>
            <p style={{ color: 'var(--grey-400)', marginBottom: 32 }}>
              The admin is currently accepting players. Join the pool to secure your spot.
            </p>
            {!hasJoined ? (
              <button className="btn btn-primary btn-lg" onClick={handleJoinPool}>
                ⚡ Join Tournament Pool
              </button>
            ) : (
              <div style={{ color: '#00f260', fontFamily: 'Orbitron', fontSize: 18, padding: 16, border: '1px solid #00f260', borderRadius: 8 }}>
                ✓ You are in the pool! Waiting for bracket generation...
              </div>
            )}

            <div style={{ marginTop: 48 }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: 16, color: '#FFD700', marginBottom: 16 }}>Current Pool ({tData.players?.length || 0})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                {tData.players?.map(p => (
                  <div key={p.uid} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: 20, fontFamily: 'Rajdhani' }}>
                    {p.name} (ELO: {p.rating})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tData.status === 'active' && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: 16, color: '#FFD700' }}>Tournament is LIVE</h2>
            
            {myMatch ? (
              <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD700', padding: 32, borderRadius: 12, margin: '24px 0' }}>
                <h3 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: 16 }}>Your Match is Ready!</h3>
                <p style={{ marginBottom: 24, fontSize: 18 }}>
                  You are playing against <strong style={{ color: '#FFD700' }}>{myMatch.player1.uid === user.uid ? myMatch.player2.name : myMatch.player1.name}</strong>
                </p>
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/games/chess?id=${myMatch.boardId}`)}>
                  Join Board Now →
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--grey-400)', fontSize: 18 }}>
                {hasJoined ? "You don't have an active match right now. Please wait for the next round." : "You are spectating this tournament."}
              </p>
            )}

            <div style={{ marginTop: 48, textAlign: 'left' }}>
              <h3 style={{ fontFamily: 'Orbitron', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>Live Bracket Overview</h3>
              {tData.matches?.map(m => (
                <div key={m.matchId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: 16, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ color: m.winner === m.player1?.uid ? '#00f260' : '#fff' }}>{m.player1?.name || 'TBD'}</span>
                    <span style={{ color: 'var(--grey-600)' }}>VS</span>
                    <span style={{ color: m.winner === m.player2?.uid ? '#00f260' : '#fff' }}>{m.player2?.name || 'TBD'}</span>
                  </div>
                  <div>
                    {m.winner ? (
                      <span style={{ color: '#00f260', fontFamily: 'Orbitron', fontSize: 12 }}>Winner: {m.winner === m.player1.uid ? m.player1.name : m.player2.name}</span>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/games/chess?id=${m.boardId}`)}>Spectate</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
