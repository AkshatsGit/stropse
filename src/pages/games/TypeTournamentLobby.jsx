import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Games.css';

export default function TypeTournamentLobby() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('id');

  const [tData, setTData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;

    const unsub = onSnapshot(doc(db, 'typeTournaments', tournamentId), (snap) => {
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
      await updateDoc(doc(db, 'typeTournaments', tournamentId), {
        players: arrayUnion({
          uid: user.uid,
          name: profile?.playerName || user.displayName || 'Player',
          rating: 1200
        })
      });
      toast('Joined the tournament pool!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
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
            <h4 style={{ color: '#00ffff', fontFamily: 'Orbitron', textAlign: 'center', marginBottom: 16 }}>Round {roundNum}</h4>
            {matches.map(m => (
              <div key={m.matchId} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,255,0.2)', borderRadius: 8, padding: 12, minWidth: 200, position: 'relative' }}>
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
                    <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: '2px 6px', borderColor: '#00ffff', color: '#00ffff' }} onClick={() => navigate(`/games/typing?id=${m.boardId}`)}>SPECTATE</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
        {t.status === 'completed' && t.tournamentWinner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
            <h4 style={{ color: '#00ffff', fontFamily: 'Orbitron', textAlign: 'center', marginBottom: 16 }}>Champion</h4>
            <div style={{ background: 'rgba(0,242,96,0.1)', border: '2px solid #00f260', borderRadius: 8, padding: 24, minWidth: 200, textAlign: 'center', boxShadow: '0 0 30px rgba(0,242,96,0.3)' }}>
              <span style={{ fontSize: 40 }}>🏆</span><br/>
              <strong style={{ color: '#00f260', fontFamily: 'Orbitron', fontSize: 20 }}>{t.tournamentWinner.name}</strong>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!tournamentId) {
    return (
      <div className="chess-page container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <h2>Invalid Tournament Link</h2>
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
          <p className="section-tag" style={{ color: '#00ffff' }}>⚡ TYPING TOURNAMENT</p>
          <h1 style={{ fontSize: 40 }}>Cyber <span className="text-glow" style={{ textShadow: '0 0 20px #00ffff' }}>Typer Arena</span></h1>
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
              <h3 style={{ fontFamily: 'Orbitron', fontSize: 16, color: '#00ffff', marginBottom: 16 }}>Current Pool ({tData.players?.length || 0})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                {tData.players?.map(p => (
                  <div key={p.uid} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: 20, fontFamily: 'Rajdhani' }}>
                    {p.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(tData.status === 'active' || tData.status === 'completed') && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: 16, color: '#00ffff' }}>
              {tData.status === 'completed' ? 'Tournament Complete' : 'Tournament is LIVE'}
            </h2>
            
            {myMatch && tData.status === 'active' ? (
              <div style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid #00ffff', padding: 32, borderRadius: 12, margin: '24px 0' }}>
                <h3 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: 16 }}>Your Race is Ready!</h3>
                <p style={{ marginBottom: 24, fontSize: 18 }}>
                  You are racing against <strong style={{ color: '#00ffff' }}>{myMatch.player1.uid === user.uid ? myMatch.player2?.name : myMatch.player1.name}</strong>
                </p>
                <button className="btn btn-primary btn-lg" style={{ background: '#00ffff', color: '#000' }} onClick={() => navigate(`/games/typing?id=${myMatch.boardId}`)}>
                  Join Race Now →
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--grey-400)', fontSize: 18, marginBottom: 24 }}>
                {tData.status === 'completed' ? "The event has concluded." : (hasJoined ? "You don't have an active race right now. Please wait." : "You are spectating this tournament.")}
              </p>
            )}

            <div style={{ textAlign: 'left', background: 'rgba(25,25,25,0.8)', padding: 24, borderRadius: 12, border: '1px solid rgba(0,255,255,0.1)' }}>
              <h3 style={{ fontFamily: 'Orbitron', marginBottom: 16, color: '#fff' }}>Live Tournament Web</h3>
              {renderBracket(tData)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
