import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Games.css';

const TEXTS = [
  "In the world of competitive esports, milliseconds matter. Precision, strategy, and rapid execution distinguish champions from amateurs.",
  "Neon lights cast long shadows over the arena. The crowd roars as the final move is made, cementing a new legacy in the digital age.",
  "Cybernetics and artificial intelligence have revolutionized the way we interact with technology, blurring the lines between human and machine."
];

export default function TypeGame() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('id');

  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [gameDoc, setGameDoc] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [startTime, setStartTime] = useState(null);
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (!gameId || !user) return;

    const unsub = onSnapshot(doc(db, 'typeGames', gameId), async (snapshot) => {
      if (!snapshot.exists()) {
        toast('Game not found', 'error');
        navigate('/games/typing');
        return;
      }
      const data = snapshot.data();
      
      // Auto join as p2
      if (!data.player2 && data.player1 !== user.uid) {
        await updateDoc(doc(db, 'typeGames', gameId), {
          player2: user.uid,
          player2Name: user.displayName || 'Player 2',
          status: 'playing',
          startedAt: Date.now()
        });
        toast('Joined Typing Match!', 'success');
      }

      setGameDoc(data);

      if (data.status === 'playing' && !startTime) {
        setStartTime(data.startedAt || Date.now());
      }
      
    }, (error) => {
      console.error(error);
      toast('Lost connection', 'error');
    });

    return () => unsub();
  }, [gameId, user, navigate, toast, startTime]);

  async function handleCreateGame() {
    if (!user) { toast('Please log in first', 'error'); return; }
    setCreating(true);
    try {
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const randomText = TEXTS[Math.floor(Math.random() * TEXTS.length)];
      
      await setDoc(doc(db, 'typeGames', generatedId), {
        textToType: randomText,
        player1: user.uid,
        player1Name: user.displayName || 'Player 1',
        player2: null,
        player2Name: null,
        p1Progress: 0,
        p2Progress: 0,
        status: 'waiting',
        isSolo: false,
        createdAt: serverTimestamp()
      });
      toast('Match created! Waiting for opponent...', 'success');
      navigate(`/games/typing?id=${generatedId}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateSoloGame() {
    if (!user) { toast('Please log in first', 'error'); return; }
    setCreating(true);
    try {
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const randomText = TEXTS[Math.floor(Math.random() * TEXTS.length)];
      
      await setDoc(doc(db, 'typeGames', generatedId), {
        textToType: randomText,
        player1: user.uid,
        player1Name: user.displayName || 'Player 1',
        player2: null,
        p1Progress: 0,
        status: 'playing',
        isSolo: true,
        startedAt: Date.now(),
        createdAt: serverTimestamp()
      });
      toast('Solo speed test started!', 'success');
      navigate(`/games/typing?id=${generatedId}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  function handleJoinGame(e) {
    e.preventDefault();
    if (!joinId) return;
    navigate(`/games/typing?id=${joinId}`);
  }

  function handleResign() {
    if (window.confirm("Are you sure you want to forfeit the typing race?")) {
      const isP1 = gameDoc?.player1 === user?.uid;
      updateDoc(doc(db, 'typeGames', gameId), {
        status: 'completed',
        winner: isP1 ? gameDoc.player2 : gameDoc.player1,
        reason: 'resignation'
      });
    }
  }

  function handleInputChange(e) {
    if (!gameDoc || gameDoc.status !== 'playing') return;
    const isParticipant = gameDoc.player1 === user.uid || gameDoc.player2 === user.uid;
    if (!isParticipant) return;

    const val = e.target.value;
    const targetText = gameDoc.textToType;
    
    // Check if input matches so far
    const isCorrectSoFar = targetText.startsWith(val);
    if (!isCorrectSoFar) {
      // Disallow typing if mistake is made until they backspace
      return; 
    }

    setInputVal(val);

    const progress = val.length;
    const isP1 = gameDoc.player1 === user.uid;

    const updates = {};
    if (isP1) updates.p1Progress = progress;
    else updates.p2Progress = progress;

    if (progress === targetText.length) {
      updates.status = 'completed';
      updates.winner = user.uid;
      updates.reason = 'finished';
      updates.endedAt = Date.now();
    }

    updateDoc(doc(db, 'typeGames', gameId), updates);
  }

  // ==================
  // LOBBY
  // ==================
  if (!gameId) {
    return (
      <div className="chess-page">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="page-header" style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ fontSize: 48 }}>Cyber <span className="text-glow">Typer</span></h1>
            <p className="section-subtitle">1v1 High-Speed Typing Arena</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', marginBottom: 24, padding: 48 }}>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: 16 }}>Start a Race</h2>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={handleCreateGame} disabled={creating || !user}>
                {creating ? 'Creating...' : (user ? '⚡ Create 1v1 Race' : 'Log in to Play')}
              </button>
              <button className="btn btn-outline btn-lg" style={{ borderColor: '#00ffff', color: '#00ffff' }} onClick={handleCreateSoloGame} disabled={creating || !user}>
                {creating ? '...' : '⏱️ Solo Speed Test'}
              </button>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: 16 }}>Join via Code</h2>
            <form onSubmit={handleJoinGame} style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <input 
                className="form-input" 
                placeholder="Enter Race ID" 
                value={joinId} 
                onChange={e => setJoinId(e.target.value)}
                style={{ maxWidth: 250 }}
              />
              <button type="submit" className="btn btn-outline" disabled={!user}>Join Race</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==================
  // GAME UI
  // ==================
  const isParticipant = gameDoc && user && (gameDoc.player1 === user.uid || gameDoc.player2 === user.uid);
  const targetText = gameDoc?.textToType || "";
  
  const p1Prog = gameDoc?.p1Progress || 0;
  const p2Prog = gameDoc?.p2Progress || 0;
  const p1Pct = Math.min(100, (p1Prog / targetText.length) * 100);
  const p2Pct = Math.min(100, (p2Prog / targetText.length) * 100);

  let finalWPM = 0;
  if (gameDoc?.status === 'completed' && gameDoc?.startedAt && gameDoc?.endedAt) {
    const minutes = (gameDoc.endedAt - gameDoc.startedAt) / 60000;
    const words = targetText.length / 5;
    finalWPM = Math.round(words / minutes);
  }

  function downloadCertificate() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // 1. Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1200, 800);

    // Subtle background logo
    const img = new Image();
    img.src = '/stropse-seal.png';
    img.onload = () => {
      ctx.globalAlpha = 0.05;
      ctx.drawImage(img, 300, 150, 600, 600);
      ctx.globalAlpha = 1.0;

      // 2. Borders (Outer Chamfered)
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 40);
      ctx.lineTo(1120, 40);
      ctx.lineTo(1160, 80);
      ctx.lineTo(1160, 720);
      ctx.lineTo(1120, 760);
      ctx.lineTo(80, 760);
      ctx.lineTo(40, 720);
      ctx.lineTo(40, 80);
      ctx.closePath();
      ctx.stroke();

      // Inner border
      ctx.strokeStyle = 'rgba(255,215,0,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(90, 55);
      ctx.lineTo(1110, 55);
      ctx.lineTo(1145, 90);
      ctx.lineTo(1145, 710);
      ctx.lineTo(1110, 745);
      ctx.lineTo(90, 745);
      ctx.lineTo(55, 710);
      ctx.lineTo(55, 90);
      ctx.closePath();
      ctx.stroke();

      // Corner accents
      ctx.fillStyle = '#FFD700';
      const drawCornerAccent = (x, y, dx, dy) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCornerAccent(80, 40); drawCornerAccent(1120, 40);
      drawCornerAccent(1160, 80); drawCornerAccent(1160, 720);
      drawCornerAccent(1120, 760); drawCornerAccent(80, 760);
      drawCornerAccent(40, 720); drawCornerAccent(40, 80);

      // 3. Top Logo & Title
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, 550, 60, 100, 100); // Top center logo

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 32px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STROPSE', 600, 190);

      ctx.fillStyle = '#aaaaaa';
      ctx.font = '16px "Rajdhani", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('OFFICIAL ESPORTS CERTIFICATION', 600, 220);

      // Lines next to Cyber Typer
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(250, 290); ctx.lineTo(350, 290); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(850, 290); ctx.lineTo(950, 290); ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px "Orbitron", sans-serif';
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 15;
      ctx.fillText('CYBER TYPER', 600, 310);
      ctx.shadowBlur = 0;

      // 4. Recipient
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '18px "Orbitron", sans-serif';
      ctx.fillText('THIS CERTIFIES THAT', 600, 390);

      // Create Gold Gradient for Name
      const gradient = ctx.createLinearGradient(0, 410, 0, 460);
      gradient.addColorStop(0, '#FFE866');
      gradient.addColorStop(0.5, '#FFD700');
      gradient.addColorStop(1, '#B8860B');
      
      ctx.fillStyle = gradient;
      ctx.font = 'bold 54px "Orbitron", sans-serif';
      ctx.shadowColor = 'rgba(255,215,0,0.3)';
      ctx.shadowBlur = 10;
      ctx.fillText(gameDoc?.player1Name?.toUpperCase() || 'PLAYER', 600, 450);
      ctx.shadowBlur = 0;

      // 5. WPM Section
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '18px "Orbitron", sans-serif';
      ctx.fillText('HAS ACHIEVED A TYPING SPEED OF', 600, 520);

      // Hexagon/Chamfered box for WPM
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(380, 550);
      ctx.lineTo(820, 550);
      ctx.lineTo(850, 600);
      ctx.lineTo(820, 650);
      ctx.lineTo(380, 650);
      ctx.lineTo(350, 600);
      ctx.closePath();
      ctx.stroke();

      // Inner faint box
      ctx.strokeStyle = 'rgba(255,215,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(385, 555);
      ctx.lineTo(815, 555);
      ctx.lineTo(842, 600);
      ctx.lineTo(815, 645);
      ctx.lineTo(385, 645);
      ctx.lineTo(358, 600);
      ctx.closePath();
      ctx.stroke();

      // Side dashes
      ctx.beginPath(); ctx.moveTo(280, 600); ctx.lineTo(330, 600); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(870, 600); ctx.lineTo(920, 600); ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px "Orbitron", sans-serif';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 20;
      ctx.fillText(`${finalWPM} WPM`, 600, 625);
      ctx.shadowBlur = 0;

      // 6. Footer
      // Date
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px "Rajdhani", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DATE', 150, 715);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px "Orbitron", sans-serif';
      ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), 150, 735);

      // Icon placeholder Date
      ctx.strokeStyle = '#FFD700';
      ctx.strokeRect(120, 710, 20, 20);

      // Race ID
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px "Rajdhani", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('RACE ID', 1050, 715);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px "Orbitron", sans-serif';
      ctx.fillText(gameId, 1050, 735);

      // Icon placeholder ID
      ctx.strokeRect(1060, 710, 20, 20);

      // Bottom Center Logo
      ctx.drawImage(img, 560, 680, 80, 80);

      // Download
      const link = document.createElement('a');
      link.download = `Stropse_CyberTyper_${finalWPM}WPM.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }

  return (
    <div className="chess-page">
      <div className="container" style={{ maxWidth: 800 }}>
        
        <div className="flex-between" style={{ marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Orbitron' }}>Race: <span className="text-glow" style={{ fontSize: 16 }}>{gameId}</span></h2>
            <p style={{ color: 'var(--grey-400)' }}>{gameDoc?.status.toUpperCase()}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {gameDoc?.status === 'playing' && isParticipant && (
               <button className="btn btn-outline btn-sm" style={{ borderColor: '#ff3333', color: '#ff3333' }} onClick={handleResign}>⚑ Resign</button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/games/typing')}>Leave</button>
          </div>
        </div>

        <div className="card" style={{ padding: 48, position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', right: -100, top: -100, opacity: 0.03, pointerEvents: 'none' }}>
             <img src="/stropse-seal.png" alt="" style={{ width: 600 }} />
          </div>

          {gameDoc?.status === 'waiting' && (
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ marginBottom: 16 }}></div>
              <h3 style={{ color: '#FFD700', fontFamily: 'Orbitron', marginBottom: 16 }}>Waiting for opponent...</h3>
              <div style={{ background: '#111', padding: 12, borderRadius: 8, display: 'inline-block', marginBottom: 16 }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/games/typing?id=' + gameId)}&bgcolor=ffffff&color=000000`} 
                  alt="QR" style={{ display: 'block', width: 120, height: 120 }}
                />
              </div>
              <p style={{ color: '#fff' }}>Scan to Join Race</p>
            </div>
          )}

          {gameDoc?.status !== 'waiting' && (
            <div>
              {/* RACERS */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ marginBottom: 24 }}>
                  <div className="flex-between" style={{ marginBottom: 8, fontFamily: 'Orbitron' }}>
                    <span style={{ color: '#00f260' }}>{gameDoc?.isSolo ? 'Your Progress' : `${gameDoc?.player1Name} ${gameDoc?.player1 === user?.uid ? '(You)' : ''}`}</span>
                    <span>{Math.round(p1Pct)}%</span>
                  </div>
                  <div style={{ background: '#222', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ background: '#00f260', height: '100%', width: `${p1Pct}%`, transition: 'width 0.1s linear' }} />
                  </div>
                </div>

                {!gameDoc?.isSolo && (
                  <div>
                    <div className="flex-between" style={{ marginBottom: 8, fontFamily: 'Orbitron' }}>
                      <span style={{ color: '#00ffff' }}>{gameDoc?.player2Name || 'Player 2'} {gameDoc?.player2 === user?.uid ? '(You)' : ''}</span>
                      <span>{Math.round(p2Pct)}%</span>
                    </div>
                    <div style={{ background: '#222', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ background: '#00ffff', height: '100%', width: `${p2Pct}%`, transition: 'width 0.1s linear' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* TARGET TEXT */}
              <div style={{ background: '#111', padding: 24, borderRadius: 8, border: '1px solid #333', fontSize: 24, lineHeight: 1.6, fontFamily: 'monospace', position: 'relative' }}>
                {gameDoc?.status === 'completed' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <h2 style={{ fontFamily: 'Orbitron', color: '#FFD700', fontSize: 40, marginBottom: 12 }}>{gameDoc.isSolo ? 'TEST COMPLETE' : 'RACE FINISHED'}</h2>
                    {!gameDoc.isSolo && (
                      <p style={{ color: '#fff', fontSize: 20 }}>
                        Winner: <span style={{ color: '#00f260' }}>{gameDoc.winner === gameDoc.player1 ? gameDoc.player1Name : gameDoc.player2Name}</span>
                      </p>
                    )}
                    {gameDoc.isSolo && finalWPM > 0 && (
                      <div style={{ marginTop: 16, background: 'rgba(255,215,0,0.05)', padding: '16px 32px', borderRadius: 12, border: '1px solid rgba(255,215,0,0.3)' }}>
                        <p style={{ color: '#FFD700', fontSize: 16, fontFamily: 'Orbitron', marginBottom: 4 }}>YOUR SPEED</p>
                        <h1 style={{ color: '#fff', fontSize: 56, fontFamily: 'Orbitron', margin: 0, textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>{finalWPM} <span style={{ fontSize: 24, color: 'var(--grey-500)' }}>WPM</span></h1>
                      </div>
                    )}
                    {gameDoc.reason === 'resignation' && !gameDoc.isSolo && <p style={{ color: '#ff3333', marginTop: 8 }}>(By Resignation)</p>}
                    
                    {gameDoc.isSolo && finalWPM > 0 && (
                      <button className="btn btn-outline" style={{ marginTop: 24, borderColor: '#FFD700', color: '#FFD700', fontSize: 18 }} onClick={downloadCertificate}>
                        📥 Download Official Certificate
                      </button>
                    )}
                  </div>
                )}

                {targetText.split('').map((char, i) => {
                  let color = '#555';
                  let background = 'transparent';
                  if (i < inputVal.length) {
                    color = inputVal[i] === char ? '#00f260' : '#ff3333';
                    if (inputVal[i] !== char) background = 'rgba(255,51,51,0.2)';
                  }
                  
                  // Blinking cursor on current character
                  const isCurrent = i === inputVal.length;
                  const borderBottom = isCurrent ? '3px solid #FFD700' : '3px solid transparent';
                  const textShadow = isCurrent ? '0 0 10px #FFD700' : (color === '#00f260' ? '0 0 10px rgba(0,242,96,0.3)' : 'none');

                  return (
                    <span key={i} style={{ color, background, borderBottom, textShadow, padding: '0 2px', transition: 'color 0.1s' }}>
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* INPUT BOX */}
              {isParticipant && gameDoc?.status === 'playing' && (
                <div style={{ marginTop: 24 }}>
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={inputVal}
                    onChange={handleInputChange}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'transparent', caretColor: 'transparent', position: 'absolute', opacity: 0 }}
                    disabled={gameDoc.status !== 'playing'}
                  />
                  <p style={{ textAlign: 'center', color: '#FFD700', fontFamily: 'Orbitron', marginTop: 12, animation: 'pulse 1.5s infinite' }}>Start typing to race...</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
