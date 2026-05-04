import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { doc, updateDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Games.css';

const TIME_MODES = {
  blitz: { label: 'Blitz 3|0', seconds: 3 * 60 },
  rapid: { label: 'Rapid 10|0', seconds: 10 * 60 },
  classic: { label: 'Classic 30|0', seconds: 30 * 60 }
};

export default function ChessGame() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('id');

  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedMode, setSelectedMode] = useState('rapid');

  // Game state
  const [game, setGame] = useState(new Chess());
  const [gameDoc, setGameDoc] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  
  // AI Rating
  const [aiRating, setAiRating] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Tap-to-move state
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});

  // Timers
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);

  // Setup listener if gameId exists
  useEffect(() => {
    if (!gameId || !user) return;

    const unsub = onSnapshot(doc(db, 'chessGames', gameId), async (snapshot) => {
      if (!snapshot.exists()) {
        toast('Game not found', 'error');
        navigate('/games/chess');
        return;
      }
      const data = snapshot.data();
      
      if (!data.blackPlayer && data.whitePlayer !== user.uid) {
        await updateDoc(doc(db, 'chessGames', gameId), {
          blackPlayer: user.uid,
          status: 'playing',
          lastMoveAt: Date.now() // start timer
        });
        toast('Joined game as Black!', 'success');
      }

      setGameDoc(data);
      
      const newGame = new Chess();
      if (data.fen) {
        try { newGame.load(data.fen); } catch(e){}
      }
      setGame(newGame);
      if (data.history) setMoveHistory(data.history);
      
      // Update base times
      if (data.whiteTime !== undefined) setWhiteTime(data.whiteTime);
      if (data.blackTime !== undefined) setBlackTime(data.blackTime);

    }, (error) => {
      console.error(error);
      toast('Lost connection to game', 'error');
    });

    return () => unsub();
  }, [gameId, user, navigate, toast]);

  // AI Analysis Effect
  useEffect(() => {
    if (gameDoc?.status === 'completed' && !aiRating && !analyzing && moveHistory.length > 0) {
      analyzeGameWithGemini();
    }
  }, [gameDoc?.status]);

  async function analyzeGameWithGemini() {
    setAnalyzing(true);
    try {
      const pgnMoves = moveHistory.map((m, i) => `${i % 2 === 0 ? Math.floor(i / 2) + 1 + '.' : ''}${m.san}`).join(' ');
      
      if (moveHistory.length < 5) {
        setAiRating("Blunderous Start. The game ended too quickly to determine a solid rating. Estimated Performance: 300 - 400 ELO.");
        setAnalyzing(false);
        return;
      }

      const prompt = `You are a Chess Grandmaster and Engine. Analyze the following chess game moves (PGN). Based on the tactical awareness, opening principles, and blunders, estimate the average ELO rating of the players (like Chess.com does). If the game is very short or chaotic, give a rating around 300-400. Give ONLY a concise 1-2 sentence assessment followed by the estimated ELO rating.\nGame Moves: ${pgnMoves}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAH45YAgEYZuuLIqu9fxoVIOhQvceIGCPM`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      setAiRating(text);
    } catch (err) {
      setAiRating("Analysis failed. Estimated Performance: 1000 ELO.");
    } finally {
      setAnalyzing(false);
    }
  }

  // Timer countdown effect
  useEffect(() => {
    if (!gameDoc || gameDoc.status !== 'playing' || game.isGameOver()) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - gameDoc.lastMoveAt) / 1000);
      
      if (game.turn() === 'w') {
        setWhiteTime(Math.max(0, gameDoc.whiteTime - elapsed));
        if (gameDoc.whiteTime - elapsed <= 0) handleTimeOut('w');
      } else {
        setBlackTime(Math.max(0, gameDoc.blackTime - elapsed));
        if (gameDoc.blackTime - elapsed <= 0) handleTimeOut('b');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameDoc, game]);

  function handleTimeOut(color) {
    if (gameDoc.status !== 'completed') {
      updateDoc(doc(db, 'chessGames', gameId), {
        status: 'completed',
        winner: color === 'w' ? 'black' : 'white',
        reason: 'timeout'
      });
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function handleCreateGame() {
    if (!user) { toast('Please log in first', 'error'); return; }
    setCreating(true);
    try {
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const startSeconds = TIME_MODES[selectedMode].seconds;

      await setDoc(doc(db, 'chessGames', generatedId), {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        history: [],
        whitePlayer: user.uid,
        blackPlayer: null,
        status: 'waiting',
        mode: selectedMode,
        whiteTime: startSeconds,
        blackTime: startSeconds,
        lastMoveAt: Date.now(),
        createdAt: serverTimestamp()
      });
      toast('Game created! Waiting for opponent...', 'success');
      navigate(`/games/chess?id=${generatedId}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  function handleJoinGame(e) {
    e.preventDefault();
    if (!joinId) return;
    navigate(`/games/chess?id=${joinId}`);
  }

  function executeMove(sourceSquare, targetSquare) {
    if (!gameDoc || gameDoc.status !== 'playing') {
      toast('Waiting for opponent', 'info');
      return false;
    }

    const myColor = gameDoc.whitePlayer === user.uid ? 'w' : (gameDoc.blackPlayer === user.uid ? 'b' : null);
    if (!myColor) {
      toast('You are spectating', 'info');
      return false;
    }

    if (game.turn() !== myColor) {
      toast('Not your turn!', 'error');
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move) {
        const newFen = game.fen();
        const newHistory = [...moveHistory, { san: move.san, from: sourceSquare, to: targetSquare }];
        
        // Compute new times
        const now = Date.now();
        const elapsed = Math.floor((now - gameDoc.lastMoveAt) / 1000);
        let newWhiteTime = gameDoc.whiteTime;
        let newBlackTime = gameDoc.blackTime;
        
        if (myColor === 'w') newWhiteTime -= elapsed;
        if (myColor === 'b') newBlackTime -= elapsed;

        const optimisticGame = new Chess(newFen);
        setGame(optimisticGame);
        setMoveHistory(newHistory);
        setOptionSquares({});
        setMoveFrom('');

        let matchWinner = null;
        if (optimisticGame.isCheckmate()) {
          matchWinner = optimisticGame.turn() === 'w' ? 'black' : 'white';
        } else if (optimisticGame.isDraw()) {
          matchWinner = 'draw';
        }

        const updates = {
          fen: newFen,
          history: newHistory,
          status: optimisticGame.isGameOver() ? 'completed' : 'playing',
          whiteTime: newWhiteTime,
          blackTime: newBlackTime,
          lastMoveAt: now
        };
        
        if (matchWinner) updates.winner = matchWinner;

        updateDoc(doc(db, 'chessGames', gameId), updates);
        
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  }

  function onDrop(sourceSquare, targetSquare) {
    return executeMove(sourceSquare, targetSquare);
  }

  function onSquareClick(square) {
    const myColor = gameDoc?.whitePlayer === user?.uid ? 'w' : (gameDoc?.blackPlayer === user?.uid ? 'b' : null);
    if (!myColor || game.turn() !== myColor || gameDoc?.status !== 'playing') return;

    function getMoveOptions(square) {
      const moves = game.moves({ square, verbose: true });
      if (moves.length === 0) return false;
      const newSquares = {};
      moves.forEach((move) => {
        newSquares[move.to] = {
          background: 'radial-gradient(circle, rgba(255,215,0,0.5) 20%, transparent 20%)',
          borderRadius: '50%'
        };
      });
      newSquares[square] = { background: 'rgba(255,215,0,0.4)' };
      setOptionSquares(newSquares);
      return true;
    }

    if (!moveFrom) {
      if (game.get(square) && game.get(square).color === myColor) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
      return;
    }

    if (square === moveFrom) {
      setMoveFrom('');
      setOptionSquares({});
      return;
    }

    const moved = executeMove(moveFrom, square);
    if (!moved) {
      if (game.get(square) && game.get(square).color === myColor) {
        setMoveFrom(square);
        getMoveOptions(square);
      } else {
        setMoveFrom('');
        setOptionSquares({});
      }
    }
  }

  function calculateAIAssessment() {
    if (analyzing) return "Analyzing moves with STROPSE AI (Gemini)...";
    if (aiRating) return aiRating;
    return "Analysis unavailable.";
  }

  function handleResignOrLeave(isResignBtn = false) {
    const isParticipant = gameDoc && user && (gameDoc.whitePlayer === user.uid || gameDoc.blackPlayer === user.uid);
    const myColor = gameDoc?.whitePlayer === user?.uid ? 'w' : (gameDoc?.blackPlayer === user?.uid ? 'b' : null);

    if (gameDoc?.status === 'playing' && isParticipant) {
      const msg = isResignBtn 
        ? "Are you sure you want to resign?" 
        : "Are you sure you want to leave? You will forfeit the match.";
        
      if (window.confirm(msg)) {
        updateDoc(doc(db, 'chessGames', gameId), {
          status: 'completed',
          winner: myColor === 'w' ? 'black' : 'white',
          reason: 'resignation'
        });
        if (!isResignBtn) navigate('/games/chess');
      }
    } else {
      navigate('/games/chess');
    }
  }

  // ==================
  // RENDER LOBBY
  // ==================
  if (!gameId) {
    return (
      <div className="chess-page">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="page-header" style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ fontSize: 48 }}>Neo <span className="text-glow">Chess</span></h1>
            <p className="section-subtitle">Challenge players around the globe in a high-fidelity arena.</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', marginBottom: 24, padding: 48 }}>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: 16 }}>Start a Match</h2>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {Object.entries(TIME_MODES).map(([key, mode]) => (
                <button 
                  key={key} 
                  className={`btn ${selectedMode === key ? 'btn-primary' : 'btn-outline'} btn-sm`}
                  onClick={() => setSelectedMode(key)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <button className="btn btn-primary btn-lg" onClick={handleCreateGame} disabled={creating || !user}>
              {creating ? 'Creating...' : (user ? '⚡ Create New Game' : 'Log in to Play')}
            </button>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: 16 }}>Join via Code</h2>
            <form onSubmit={handleJoinGame} style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <input 
                className="form-input" 
                placeholder="Enter Board ID" 
                value={joinId} 
                onChange={e => setJoinId(e.target.value)}
                style={{ maxWidth: 250 }}
              />
              <button type="submit" className="btn btn-outline" disabled={!user}>Join Board</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==================
  // RENDER GAME
  // ==================
  const boardOrientation = gameDoc?.blackPlayer === user?.uid ? 'black' : 'white';
  const myTurn = gameDoc && user && (
    (game.turn() === 'w' && gameDoc.whitePlayer === user.uid) ||
    (game.turn() === 'b' && gameDoc.blackPlayer === user.uid)
  );

  return (
    <div className="chess-page">
      <div className="container">
        <div className="chess-layout">
          <div className="chess-board-container" style={{ position: 'relative' }}>
            <div className="chess-header" style={{ alignItems: 'flex-end' }}>
              <div>
                <h2>Board: <span className="text-glow" style={{ fontSize: 16 }}>{gameId}</span></h2>
                <p style={{ fontSize: 12, color: 'var(--grey-500)', marginTop: 4 }}>
                  {gameDoc?.status === 'waiting' ? 'Waiting for opponent to join...' : 
                   gameDoc?.status === 'completed' ? 'Match Ended' : 'Match in Progress'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {gameDoc?.status === 'playing' && (gameDoc.whitePlayer === user?.uid || gameDoc.blackPlayer === user?.uid) && (
                    <button className="btn btn-primary btn-sm" style={{ background: '#ff3333', borderColor: '#ff3333', color: '#fff' }} onClick={() => handleResignOrLeave(true)}>⚑ Resign</button>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => handleResignOrLeave(false)}>Leave</button>
                </div>
              </div>
            </div>
            
            {/* STROPSE Lion Logo Faded Wrapper */}
            <div style={{ position: 'relative', width: 'min(500px, 90vw)', border: '2px solid rgba(255,215,0,0.4)', borderRadius: 4, boxShadow: '0 0 40px rgba(255,215,0,0.1)' }}>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Chessboard 
                  position={game.fen()} 
                  onPieceDrop={onDrop}
                  onSquareClick={onSquareClick}
                  customSquareStyles={optionSquares}
                  boardOrientation={boardOrientation}
                  animationDuration={100}
                  customDarkSquareStyle={{ backgroundColor: '#111111' }}
                  customLightSquareStyle={{ backgroundColor: 'rgba(255,215,0,0.8)' }}
                  arePiecesDraggable={gameDoc?.status === 'playing' && myTurn}
                />
              </div>

              {/* Faded Lion Logo Overlay - matched to edge */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
                <img src="/stropse-seal.png" alt="" style={{ width: '90%', opacity: 0.05, mixBlendMode: 'screen' }} />
              </div>

              {gameDoc?.status === 'waiting' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div className="spinner" style={{ marginBottom: 16 }}></div>
                  <h3 style={{ color: '#FFD700', fontFamily: 'Orbitron', marginBottom: 16 }}>Waiting for opponent...</h3>
                  <div style={{ background: '#fff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/games/chess?id=' + gameId)}&bgcolor=ffffff&color=000000`} 
                      alt="Join QR" 
                      style={{ display: 'block', width: 120, height: 120 }}
                    />
                  </div>
                  <p style={{ color: '#fff', fontSize: 14 }}>Scan to Join or Share Board ID</p>
                  <p style={{ color: '#00ffff', fontSize: 24, fontFamily: 'Orbitron', fontWeight: 'bold', letterSpacing: '0.2em', marginTop: 8 }}>{gameId}</p>
                </div>
              )}
              
              {gameDoc?.status === 'completed' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 24 }}>
                  <h3 style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: 32, marginBottom: 12 }}>Match Over</h3>
                  <p style={{ color: '#fff', marginBottom: 16, fontSize: 18 }}>
                    {gameDoc.reason === 'timeout' ? `${gameDoc.winner === 'white' ? 'White' : 'Black'} wins on time!` : 
                     gameDoc.reason === 'resignation' ? `${gameDoc.winner === 'white' ? 'White' : 'Black'} wins by resignation!` :
                     game.isCheckmate() ? 'Checkmate!' : 
                     game.isDraw() ? 'Draw!' : 'Ended'}
                  </p>
                  <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD700', padding: '16px', borderRadius: 8, marginBottom: 24 }}>
                    <h4 style={{ fontFamily: 'Orbitron', color: '#FFD700', fontSize: 12, marginBottom: 8 }}>STROPSE AI ANALYSIS</h4>
                    <p style={{ color: '#fff', fontFamily: 'Rajdhani', fontSize: 16 }}>{calculateAIAssessment()}</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => navigate('/games/chess')}>Return to Lobby</button>
                </div>
              )}
            </div>
          </div>

          <div className="chess-sidebar">
            <h3 className="sidebar-title">Action Log</h3>
            <div className="move-history-list">
              {moveHistory.length === 0 ? <p className="empty-moves">No moves yet</p> : null}
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                <div key={i} className="move-row">
                  <span className="move-num">{i + 1}.</span>
                  <span className="move-w" style={{ color: '#FFD700' }}>{moveHistory[i * 2]?.san}</span>
                  <span className="move-b" style={{ color: '#fff' }}>{moveHistory[i * 2 + 1]?.san || ''}</span>
                </div>
              ))}
            </div>
            
            <div className="chess-status" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--grey-400)' }}>Opponent Time</span>
                <span style={{ fontFamily: 'Orbitron', color: '#fff' }}>{formatTime(boardOrientation === 'white' ? blackTime : whiteTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,215,0,0.1)', padding: '8px 12px', borderRadius: 4, border: myTurn ? '1px solid rgba(255,215,0,0.5)' : 'none' }}>
                <span style={{ fontSize: 12, color: '#FFD700' }}>Your Time</span>
                <span style={{ fontFamily: 'Orbitron', color: '#FFD700', fontWeight: 'bold' }}>{formatTime(boardOrientation === 'white' ? whiteTime : blackTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
