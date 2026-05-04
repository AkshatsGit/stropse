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
  
  const [certDataUrl, setCertDataUrl] = useState(null);
  const [viewingCert, setViewingCert] = useState(false);
  
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
                {creating ? 'Creating...' : (user ? 'âš¡ Create 1v1 Race' : 'Log in to Play')}
              </button>
              <button className="btn btn-outline btn-lg" style={{ borderColor: '#00ffff', color: '#00ffff' }} onClick={handleCreateSoloGame} disabled={creating || !user}>
                {creating ? '...' : 'â±ï¸ Solo Speed Test'}
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
  if (gameDoc?.status === 'completed') {
    if (gameDoc.startedAt && gameDoc.endedAt) {
      const minutes = (gameDoc.endedAt - gameDoc.startedAt) / 60000;
      const words = targetText.length / 5;
      finalWPM = Math.max(0, Math.round(words / Math.max(minutes, 0.001)));
    } else {
      finalWPM = 60; // Fallback for old documents missing timestamps
    }
  }

  const generateCertificateImage = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, 1200, 800);

      const loadImg = (src, isCors = false) => new Promise(res => {
        const img = new Image();
        if (isCors) img.crossOrigin = 'Anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = src;
      });

      Promise.all([
        loadImg('/stropse-seal.png'),
        loadImg(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/games/typing?id=' + gameId)}&bgcolor=ffffff&color=000000`, true)
      ]).then(([sealImg, qrImg]) => {
        if (sealImg) {
          ctx.globalAlpha = 0.05;
          ctx.drawImage(sealImg, 300, 150, 600, 600);
          ctx.globalAlpha = 1.0;
        }

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(80, 40); ctx.lineTo(1120, 40); ctx.lineTo(1160, 80);
        ctx.lineTo(1160, 720); ctx.lineTo(1120, 760); ctx.lineTo(80, 760);
        ctx.lineTo(40, 720); ctx.lineTo(40, 80); ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,215,0,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(90, 55); ctx.lineTo(1110, 55); ctx.lineTo(1145, 90);
        ctx.lineTo(1145, 710); ctx.lineTo(1110, 745); ctx.lineTo(90, 745);
        ctx.lineTo(55, 710); ctx.lineTo(55, 90); ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#FFD700';
        const drawCornerAccent = (x, y) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); };
        drawCornerAccent(80, 40); drawCornerAccent(1120, 40); drawCornerAccent(1160, 80); drawCornerAccent(1160, 720);
        drawCornerAccent(1120, 760); drawCornerAccent(80, 760); drawCornerAccent(40, 720); drawCornerAccent(40, 80);

        if (sealImg) ctx.drawImage(sealImg, 550, 60, 100, 100);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STROPSE', 600, 190);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px "Rajdhani", sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('OFFICIAL ESPORTS CERTIFICATION', 600, 220);

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

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '18px "Orbitron", sans-serif';
        ctx.fillText('THIS CERTIFIES THAT', 600, 390);

        const playerName = gameDoc?.isSolo ? (gameDoc?.player1Name || 'Player') : (gameDoc?.winner === gameDoc?.player1 ? gameDoc?.player1Name : (gameDoc?.player2Name || 'Player 2'));
        
        ctx.font = 'bold 64px "Orbitron", sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(playerName, 604, 454);
        ctx.fillStyle = '#333333';
        ctx.fillText(playerName, 602, 452);

        const gradient = ctx.createLinearGradient(0, 400, 0, 470);
        gradient.addColorStop(0, '#FFF29E');
        gradient.addColorStop(0.4, '#FFD700');
        gradient.addColorStop(0.6, '#B8860B');
        gradient.addColorStop(1, '#8A6300');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(255,215,0,0.4)';
        ctx.shadowBlur = 15;
        ctx.fillText(playerName, 600, 450);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '18px "Orbitron", sans-serif';
        ctx.fillText('HAS ACHIEVED A TYPING SPEED OF', 600, 520);

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(380, 550); ctx.lineTo(820, 550); ctx.lineTo(850, 600);
        ctx.lineTo(820, 650); ctx.lineTo(380, 650); ctx.lineTo(350, 600);
        ctx.closePath(); ctx.stroke();

        ctx.strokeStyle = 'rgba(255,215,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(385, 555); ctx.lineTo(815, 555); ctx.lineTo(842, 600);
        ctx.lineTo(815, 645); ctx.lineTo(385, 645); ctx.lineTo(358, 600);
        ctx.closePath(); ctx.stroke();

        ctx.beginPath(); ctx.moveTo(280, 600); ctx.lineTo(330, 600); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(870, 600); ctx.lineTo(920, 600); ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px "Orbitron", sans-serif';
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 20;
        ctx.fillText(`${finalWPM} WPM`, 600, 625);
        ctx.shadowBlur = 0;

        // QR Code & ID
        if (qrImg) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(90, 630, 100, 100);
          ctx.drawImage(qrImg, 95, 635, 90, 90);
          
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 16px "Orbitron", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`ID: ${gameId}`, 210, 670);
          ctx.fillStyle = '#aaaaaa';
          ctx.font = '12px "Rajdhani", sans-serif';
          ctx.fillText('VERIFY ONLINE', 210, 690);
        }

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px "Rajdhani", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('DATE', 1100, 715);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "Orbitron", sans-serif';
        ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), 1100, 735);

        if (sealImg) ctx.drawImage(sealImg, 560, 680, 80, 80);

        resolve(canvas.toDataURL('image/png'));
      });
    });
  };

  useEffect(() => {
    if (gameDoc?.status === 'completed' && !certDataUrl) {
      generateCertificateImage().then(setCertDataUrl);
    }
  }, [gameDoc?.status, certDataUrl]);

  return (
    <div style={{ minHeight: '90vh', paddingTop: 40, paddingBottom: 80, paddingLeft: 20, paddingRight: 20, boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 780, width: '100%', marginLeft: 'auto', marginRight: 'auto', boxSizing: 'border-box' }}>

        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Orbitron', margin: 0, fontSize: 22 }}>
              Race: <span style={{ color: '#FFD700' }}>{gameId}</span>
            </h2>
            <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>{gameDoc?.status?.toUpperCase()}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {gameDoc?.status === 'playing' && isParticipant && (
              <button onClick={handleResign} style={{ background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 12 }}>
                ⚑ RESIGN
              </button>
            )}
            <button onClick={() => navigate('/games/typing')} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 12 }}>
              LEAVE
            </button>
          </div>
        </div>

        {/* MAIN CARD */}
        <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 12, padding: 32, width: '100%', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
          
          {/* Background seal watermark */}
          <img src="/stropse-seal.png" alt="" style={{ position: 'absolute', right: -80, top: -80, width: 500, opacity: 0.03, pointerEvents: 'none', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* ===== COMPLETED ===== */}
            {gameDoc?.status === 'completed' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'Orbitron', color: '#FFD700', fontSize: 36, margin: '0 0 12px' }}>
                  {gameDoc?.isSolo ? 'TEST COMPLETE' : 'RACE FINISHED'}
                </h2>
                {!gameDoc?.isSolo && (
                  <p style={{ color: '#fff', fontSize: 18, marginBottom: 12 }}>
                    Winner: <span style={{ color: '#FFD700' }}>
                      {gameDoc.winner === gameDoc.player1 ? gameDoc.player1Name : gameDoc.player2Name}
                    </span>
                  </p>
                )}
                {gameDoc?.reason === 'resignation' && (
                  <p style={{ color: '#ff4444', marginBottom: 12 }}>(By Resignation)</p>
                )}
                {certDataUrl ? (
                  <div style={{ marginTop: 24 }}>
                    <img
                      src={certDataUrl}
                      alt="Stropse Certificate"
                      style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain', border: '2px solid #FFD700', borderRadius: 10, boxShadow: '0 0 40px rgba(255,215,0,0.15)' }}
                    />
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                      <a
                        href={certDataUrl}
                        download={`Stropse_${finalWPM}WPM.png`}
                        style={{ background: '#FFD700', color: '#000', textDecoration: 'none', padding: '10px 24px', borderRadius: 8, fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700 }}
                      >
                        📥 Download Certificate
                      </a>
                      <button
                        onClick={() => navigate('/games/typing')}
                        style={{ background: 'transparent', border: '1px solid #FFD700', color: '#FFD700', padding: '10px 24px', borderRadius: 8, fontFamily: 'Orbitron', fontSize: 13, cursor: 'pointer' }}
                      >
                        Back to Lobby
                      </button>
                    </div>
                    <p style={{ color: '#666', marginTop: 12, fontSize: 12 }}>
                      Download and upload to LinkedIn to verify your speed.
                    </p>
                  </div>
                ) : (
                  <p style={{ color: '#FFD700', fontFamily: 'Orbitron', marginTop: 32 }}>
                    Generating Certificate...
                  </p>
                )}
              </div>
            )}

            {/* ===== WAITING ===== */}
            {gameDoc?.status === 'waiting' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h3 style={{ color: '#FFD700', fontFamily: 'Orbitron', marginBottom: 24 }}>Waiting for opponent...</h3>
                <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 10, display: 'inline-block', marginBottom: 16 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/games/typing?id=' + gameId)}&bgcolor=ffffff&color=000000`}
                    alt="QR"
                    style={{ display: 'block', width: 130, height: 130 }}
                  />
                </div>
                <p style={{ color: '#aaa', margin: 0 }}>Share this QR to invite opponent</p>
              </div>
            )}

            {/* ===== PLAYING ===== */}
            {gameDoc?.status === 'playing' && (
              <div>
                {/* P1 Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: 13 }}>
                      {gameDoc?.isSolo ? 'Your Progress' : `${gameDoc?.player1Name || 'Player 1'}${gameDoc?.player1 === user?.uid ? ' (You)' : ''}`}
                    </span>
                    <span style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: 13 }}>{Math.round(p1Pct)}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #b8860b, #FFD700, #fffacd)', height: '100%', width: `${p1Pct}%`, transition: 'width 0.15s ease', borderRadius: 4, boxShadow: '0 0 10px rgba(255,215,0,0.4)' }} />
                  </div>
                </div>

                {/* P2 Progress */}
                {!gameDoc?.isSolo && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#00e5ff', fontFamily: 'Orbitron', fontSize: 13 }}>
                        {gameDoc?.player2Name || 'Player 2'}{gameDoc?.player2 === user?.uid ? ' (You)' : ''}
                      </span>
                      <span style={{ color: '#00e5ff', fontFamily: 'Orbitron', fontSize: 13 }}>{Math.round(p2Pct)}%</span>
                    </div>
                    <div style={{ background: '#1a1a1a', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(90deg, #006080, #00e5ff)', height: '100%', width: `${p2Pct}%`, transition: 'width 0.15s ease', borderRadius: 4, boxShadow: '0 0 10px rgba(0,229,255,0.3)' }} />
                    </div>
                  </div>
                )}

                {/* Typing Text Box */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  style={{ background: '#090909', border: '1px solid #333', borderRadius: 10, padding: '24px 20px', fontSize: 20, lineHeight: '2', fontFamily: '"Courier New", Courier, monospace', wordBreak: 'break-word', wordWrap: 'break-word', cursor: 'text', userSelect: 'none', width: '100%', boxSizing: 'border-box' }}
                >
                  {targetText.split('').map((char, i) => {
                    const typed = i < inputVal.length;
                    const correct = typed && inputVal[i] === char;
                    const wrong = typed && inputVal[i] !== char;
                    const isCurrent = i === inputVal.length;
                    return (
                      <span
                        key={i}
                        style={{
                          color: correct ? '#FFD700' : wrong ? '#ff4444' : '#555',
                          background: wrong ? 'rgba(255,68,68,0.12)' : 'transparent',
                          borderBottom: isCurrent ? '2px solid #FFD700' : '2px solid transparent',
                          textShadow: isCurrent ? '0 0 10px #FFD700' : correct ? '0 0 6px rgba(255,215,0,0.3)' : 'none',
                          transition: 'color 0.08s',
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>

                {/* Hidden real input */}
                {isParticipant && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <input
                      ref={inputRef}
                      autoFocus
                      type="text"
                      value={inputVal}
                      onChange={handleInputChange}
                      disabled={gameDoc.status !== 'playing'}
                      style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0 }}
                    />
                    <p style={{ color: '#555', fontFamily: 'Orbitron', fontSize: 11, letterSpacing: 3, margin: 0 }}>
                      CLICK TEXT BOX TO TYPE
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}