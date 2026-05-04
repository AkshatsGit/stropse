import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { doc, updateDoc, onSnapshot, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Games.css';

export default function ChessGame() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('id');

  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);

  // Game state
  const [game, setGame] = useState(new Chess());
  const [gameDoc, setGameDoc] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);

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
      
      // Auto-join as black if empty and we are not white
      if (!data.blackPlayer && data.whitePlayer !== user.uid) {
        await updateDoc(doc(db, 'chessGames', gameId), {
          blackPlayer: user.uid,
          status: 'playing'
        });
        toast('Joined game as Black!', 'success');
      }

      setGameDoc(data);
      
      // Update local game board
      const newGame = new Chess();
      if (data.fen) {
        try { newGame.load(data.fen); } catch(e){}
      }
      setGame(newGame);
      if (data.history) setMoveHistory(data.history);
      
    }, (error) => {
      console.error(error);
      toast('Lost connection to game', 'error');
    });

    return () => unsub();
  }, [gameId, user, navigate, toast]);

  async function handleCreateGame() {
    if (!user) { toast('Please log in first', 'error'); return; }
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'chessGames'), {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        history: [],
        whitePlayer: user.uid,
        blackPlayer: null,
        status: 'waiting',
        createdAt: serverTimestamp()
      });
      toast('Game created! Waiting for opponent...', 'success');
      navigate(`/games/chess?id=${docRef.id}`);
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

  // Board interaction
  function onDrop(sourceSquare, targetSquare) {
    if (!gameDoc || gameDoc.status !== 'playing') {
      toast('Waiting for opponent', 'info');
      return false;
    }

    const myColor = gameDoc.whitePlayer === user.uid ? 'w' : (gameDoc.blackPlayer === user.uid ? 'b' : null);
    if (!myColor) {
      toast('You are spectating', 'info');
      return false; // spectator
    }

    if (game.turn() !== myColor) {
      toast('Not your turn!', 'error');
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen
      });

      // Valid move
      if (move) {
        const newFen = game.fen();
        const newHistory = [...moveHistory, { san: move.san, from: sourceSquare, to: targetSquare }];
        
        // Push to Firebase
        updateDoc(doc(db, 'chessGames', gameId), {
          fen: newFen,
          history: newHistory,
          status: game.isGameOver() ? 'completed' : 'playing'
        });
        
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
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
            <p style={{ color: 'var(--grey-400)', marginBottom: 32 }}>Create a new board and invite an opponent.</p>
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
            <div className="chess-header">
              <div>
                <h2>Board: <span className="text-glow" style={{ fontSize: 16 }}>{gameId}</span></h2>
                <p style={{ fontSize: 12, color: 'var(--grey-500)', marginTop: 4 }}>
                  {gameDoc?.status === 'waiting' ? 'Waiting for opponent to join...' : 
                   gameDoc?.status === 'completed' ? 'Match Ended' : 'Match in Progress'}
                </p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/games/chess')}>Leave</button>
            </div>
            
            {/* STROPSE Faded Logo Background & Board Wrapper */}
            <div style={{ position: 'relative', width: 'min(500px, 90vw)', border: '2px solid rgba(255,215,0,0.3)', borderRadius: 8, boxShadow: '0 0 40px rgba(255,215,0,0.1)' }}>
              
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
                <img src="/stropse-seal.png" alt="" style={{ width: '60%', opacity: 0.1, filter: 'drop-shadow(0 0 20px #FFD700)' }} />
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <Chessboard 
                  position={game.fen()} 
                  onPieceDrop={onDrop}
                  boardOrientation={boardOrientation}
                  animationDuration={300}
                  customDarkSquareStyle={{ backgroundColor: '#1a1a1a' }}
                  customLightSquareStyle={{ backgroundColor: '#333333' }}
                  arePiecesDraggable={gameDoc?.status === 'playing' && myTurn}
                />
              </div>

              {gameDoc?.status === 'waiting' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div className="spinner" style={{ marginBottom: 16 }}></div>
                  <h3 style={{ color: '#FFD700', fontFamily: 'Orbitron' }}>Waiting for opponent...</h3>
                  <p style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>Share the Board ID: {gameId}</p>
                </div>
              )}
              
              {game.isGameOver() && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 24 }}>
                  <h3 style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: 32, marginBottom: 12 }}>Match Over</h3>
                  <p style={{ color: '#fff', marginBottom: 24, fontSize: 18 }}>
                    {game.isCheckmate() ? 'Checkmate!' : game.isDraw() ? 'Draw!' : 'Ended'}
                  </p>
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
            <div className="chess-status">
              <p>Status: <span style={{ color: myTurn ? '#FFD700' : 'var(--grey-400)' }}>{myTurn ? 'Your Turn' : "Opponent's Turn"}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
