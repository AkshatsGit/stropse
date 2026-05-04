import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Games.css';

// ─── 6x6 Sudoku Generator (2×3 boxes, digits 1–6) ────────────────────
const SIZE = 6;
const BOX_ROWS = 2;
const BOX_COLS = 3;

function isValid6(board, pos, num) {
  const row = Math.floor(pos / SIZE);
  const col = pos % SIZE;
  for (let i = 0; i < SIZE; i++) {
    if (board[row * SIZE + i] === num) return false;
    if (board[i * SIZE + col] === num) return false;
  }
  const br = Math.floor(row / BOX_ROWS) * BOX_ROWS;
  const bc = Math.floor(col / BOX_COLS) * BOX_COLS;
  for (let r = br; r < br + BOX_ROWS; r++)
    for (let c = bc; c < bc + BOX_COLS; c++)
      if (board[r * SIZE + c] === num) return false;
  return true;
}

function solve6(board) {
  const pos = board.indexOf(0);
  if (pos === -1) return true;
  const nums = [1,2,3,4,5,6].sort(() => Math.random() - 0.5);
  for (const n of nums) {
    if (isValid6(board, pos, n)) {
      board[pos] = n;
      if (solve6(board)) return true;
      board[pos] = 0;
    }
  }
  return false;
}

function generatePuzzle(difficulty = 'hard') {
  const solved = Array(SIZE * SIZE).fill(0);
  solve6(solved);
  const puzzle = [...solved];
  // hard: remove ~22-24, medium: ~18-20
  const removes = difficulty === 'hard'
    ? 22 + Math.floor(Math.random() * 3)
    : 17 + Math.floor(Math.random() * 3);
  const indices = Array.from({ length: SIZE * SIZE }, (_, i) => i).sort(() => Math.random() - 0.5);
  let removed = 0;
  for (const idx of indices) {
    if (removed >= removes) break;
    const backup = puzzle[idx];
    puzzle[idx] = 0;
    // Keep at least 1 given per row
    const row = Math.floor(idx / SIZE);
    const rowGivens = puzzle.slice(row * SIZE, row * SIZE + SIZE).filter(v => v !== 0);
    if (rowGivens.length < 1) { puzzle[idx] = backup; continue; }
    removed++;
  }
  return { puzzle, solution: solved };
}

function isRowComplete(board, solution, row) {
  for (let c = 0; c < SIZE; c++) {
    const i = row * SIZE + c;
    if (board[i] !== solution[i]) return false;
  }
  return true;
}

function isBoardSolved(board, solution) {
  return board.every((v, i) => v === solution[i]);
}

// ─── Component ────────────────────────────────────────────────────────
export default function SudokuGame() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('id');

  const [puzzle, setPuzzle]     = useState(null);
  const [solution, setSolution] = useState(null);
  const [board, setBoard]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [timer, setTimer]       = useState(0);
  const [running, setRunning]   = useState(false);
  const [solved, setSolved]     = useState(false);
  const [difficulty, setDifficulty] = useState('hard');

  const [gameDoc, setGameDoc]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId]     = useState('');

  const initPuzzle = useCallback((diff = 'hard') => {
    const { puzzle: p, solution: s } = generatePuzzle(diff);
    setPuzzle(p); setSolution(s); setBoard([...p]);
    setSelected(null); setMistakes(0); setTimer(0);
    setSolved(false); setRunning(true);
  }, []);

  useEffect(() => { if (!gameId) initPuzzle(difficulty); }, []);

  // Timer
  useEffect(() => {
    if (!running || solved) return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running, solved]);

  // Multiplayer listener
  useEffect(() => {
    if (!gameId || !user) return;
    const unsub = onSnapshot(doc(db, 'sudokuGames', gameId), snap => {
      if (!snap.exists()) { toast('Game not found', 'error'); navigate('/games/sudoku'); return; }
      const data = snap.data();
      if (!data.player2 && data.player1 !== user.uid) {
        updateDoc(doc(db, 'sudokuGames', gameId), {
          player2: user.uid, player2Name: user.displayName || 'Player 2', status: 'playing',
        });
        toast('Joined Sudoku match!', 'success');
      }
      setGameDoc(data);
      if (!puzzle && data.puzzle) {
        const p = Array.isArray(data.puzzle) ? data.puzzle : Object.values(data.puzzle);
        const s = Array.isArray(data.solution) ? data.solution : Object.values(data.solution);
        setPuzzle(p); setSolution(s); setBoard([...p]); setRunning(true);
      }
    });
    return () => unsub();
  }, [gameId, user]);

  async function createMultiGame() {
    if (!user) { toast('Log in first', 'error'); return; }
    setCreating(true);
    try {
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { puzzle: p, solution: s } = generatePuzzle('hard');
      await setDoc(doc(db, 'sudokuGames', id), {
        puzzle: p, solution: s,
        player1: user.uid, player1Name: user.displayName || 'Player 1',
        player2: null, player2Name: null,
        p1Progress: 0, p2Progress: 0,
        status: 'waiting', isSolo: false, winner: null,
        createdAt: serverTimestamp(),
      });
      navigate(`/games/sudoku?id=${id}`);
    } catch (e) { toast(e.message, 'error'); }
    finally { setCreating(false); }
  }

  function handleInput(num) {
    if (selected === null || !board || !solution || !puzzle) return;
    if (puzzle[selected] !== 0) return;
    const newBoard = [...board];
    newBoard[selected] = num;
    setBoard(newBoard);

    if (num !== 0 && num !== solution[selected]) setMistakes(m => m + 1);

    if (isBoardSolved(newBoard, solution)) {
      setSolved(true); setRunning(false);
      toast('🎉 Sudoku Solved!', 'success');
      if (gameId && gameDoc)
        updateDoc(doc(db, 'sudokuGames', gameId), { status: 'completed', winner: user.uid, winnerName: user.displayName || 'Player' });
    }

    if (gameId) {
      const isP1 = gameDoc?.player1 === user?.uid;
      const filled = newBoard.filter((v, i) => v !== 0 && v === solution[i]).length;
      updateDoc(doc(db, 'sudokuGames', gameId), {
        [isP1 ? 'p1Progress' : 'p2Progress']: filled,
        [isP1 ? 'p1Board' : 'p2Board']: newBoard,
      });
    }
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const totalCorrect = board ? board.filter((v, i) => v !== 0 && solution && v === solution[i]).length : 0;
  const completedRows = solution ? Array.from({ length: SIZE }, (_, r) => board ? isRowComplete(board, solution, r) : false) : [];

  // ── LOBBY ──
  if (!gameId && !puzzle) {
    return (
      <div style={{ minHeight: '90vh', padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: 40, marginBottom: 8 }}>
            Cyber <span style={{ color: '#00ffff' }}>Sudoku</span>
          </h1>
          <p style={{ color: '#888', marginBottom: 40 }}>6×6 · Medium / Hard · 1v1 or Solo</p>

          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 40, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Orbitron', color: '#00ffff', marginBottom: 24 }}>Solo Play</h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
              {['medium', 'hard'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  style={{ padding: '8px 24px', borderRadius: 8, border: `1px solid ${difficulty === d ? '#00ffff' : '#333'}`, background: difficulty === d ? 'rgba(0,255,255,0.1)' : 'transparent', color: difficulty === d ? '#00ffff' : '#666', fontFamily: 'Orbitron', fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => initPuzzle(difficulty)}
              style={{ padding: '12px 32px', background: 'rgba(0,255,255,0.08)', border: '1px solid #00ffff', color: '#00ffff', borderRadius: 8, fontFamily: 'Orbitron', fontSize: 14, cursor: 'pointer' }}>
              ▶ Start Solo
            </button>
          </div>

          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 40 }}>
            <h3 style={{ fontFamily: 'Orbitron', color: '#FFD700', marginBottom: 24 }}>1v1 Challenge</h3>
            <button onClick={createMultiGame} disabled={creating || !user}
              style={{ padding: '12px 32px', background: creating ? '#111' : 'rgba(255,215,0,0.08)', border: '1px solid #FFD700', color: '#FFD700', borderRadius: 8, fontFamily: 'Orbitron', fontSize: 14, cursor: 'pointer', marginBottom: 20 }}>
              {creating ? 'Creating...' : '⚡ Create 1v1 Game'}
            </button>
            <p style={{ color: '#555', fontFamily: 'Orbitron', fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>— OR JOIN —</p>
            <form onSubmit={e => { e.preventDefault(); if (joinId) navigate(`/games/sudoku?id=${joinId}`); }}
              style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <input className="form-input" placeholder="Enter Game ID" value={joinId}
                onChange={e => setJoinId(e.target.value)} style={{ maxWidth: 180 }} />
              <button type="submit" className="btn btn-outline" disabled={!user || !joinId}>Join</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── WAITING ──
  if (gameId && gameDoc?.status === 'waiting') {
    return (
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, textAlign: 'center', padding: 24 }}>
        <h2 style={{ fontFamily: 'Orbitron', color: '#FFD700' }}>Waiting for opponent...</h2>
        <p style={{ color: '#888' }}>Game ID: <strong style={{ color: '#FFD700', fontFamily: 'Orbitron' }}>{gameId}</strong></p>
        <div style={{ background: '#111', padding: 16, borderRadius: 10 }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=000000`}
            alt="QR" style={{ display: 'block', width: 130 }} />
        </div>
        <button onClick={() => navigate('/games/sudoku')}
          style={{ background: 'transparent', border: '1px solid #555', color: '#aaa', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 12 }}>
          Cancel
        </button>
      </div>
    );
  }

  if (!board || !solution || !puzzle) return null;

  // Cell size — 6x6 fits nicely at 72px each
  const cellSize = 'min(72px, 13vw)';
  const fontSize = 'min(24px, 4.5vw)';

  return (
    <div style={{ minHeight: '90vh', padding: '32px 16px 80px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Orbitron', margin: 0 }}>
              Cyber <span style={{ color: '#00ffff' }}>Sudoku</span>
              {gameId && <span style={{ fontSize: 13, color: '#555', marginLeft: 12 }}>{gameId}</span>}
            </h2>
            <p style={{ color: '#666', margin: '4px 0 0', fontSize: 13 }}>
              {gameId ? '1v1 Match' : `${difficulty.toUpperCase()} · ${fmt(timer)}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!gameId && (
              <span style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#FFD700', padding: '6px 14px', border: '1px solid #333', borderRadius: 8 }}>
                {fmt(timer)}
              </span>
            )}
            <button onClick={() => gameId ? navigate('/games/sudoku') : initPuzzle(difficulty)}
              style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 11 }}>
              {gameId ? 'LEAVE' : '↺ NEW'}
            </button>
          </div>
        </div>

        {/* Multiplayer progress bars */}
        {gameId && gameDoc?.player2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: `${gameDoc?.player1Name}${gameDoc?.player1 === user?.uid ? ' (You)' : ''}`, prog: gameDoc?.p1Progress || 0, color: '#FFD700' },
              { label: `${gameDoc?.player2Name || 'Opponent'}${gameDoc?.player2 === user?.uid ? ' (You)' : ''}`, prog: gameDoc?.p2Progress || 0, color: '#00ffff' },
            ].map(({ label, prog, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color, fontFamily: 'Orbitron', fontSize: 11 }}>{label}</span>
                  <span style={{ color, fontFamily: 'Orbitron', fontSize: 11 }}>{prog}/{SIZE * SIZE}</span>
                </div>
                <div style={{ background: '#1a1a1a', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: color, height: '100%', width: `${(prog / (SIZE * SIZE)) * 100}%`, transition: 'width 0.3s', borderRadius: 4, boxShadow: `0 0 8px ${color}88` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Board + controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* 6x6 Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${SIZE}, ${cellSize})`,
              gridTemplateRows: `repeat(${SIZE}, ${cellSize})`,
              border: '3px solid #00ffff',
              borderRadius: 10,
              boxShadow: '0 0 40px rgba(0,255,255,0.15)',
              overflow: 'hidden',
              background: '#050505',
            }}>
              {board.map((val, idx) => {
                const row = Math.floor(idx / SIZE);
                const col = idx % SIZE;
                const isFixed = puzzle[idx] !== 0;
                const isSel = selected === idx;
                const isWrong = val !== 0 && val !== solution[idx];
                const rowDone = completedRows[row];
                const sameNum = selected !== null && val !== 0 && board[selected] !== 0 && val === board[selected] && !isSel;

                // Box borders: 2-row × 3-col boxes
                const borderRight = (col + 1) % BOX_COLS === 0 && col !== SIZE - 1
                  ? '2px solid rgba(0,255,255,0.6)' : '1px solid rgba(0,255,255,0.1)';
                const borderBottom = (row + 1) % BOX_ROWS === 0 && row !== SIZE - 1
                  ? '2px solid rgba(0,255,255,0.6)' : '1px solid rgba(0,255,255,0.1)';

                let bg = 'transparent';
                if (rowDone) bg = 'rgba(255,215,0,0.1)';
                if (sameNum) bg = 'rgba(0,255,255,0.07)';
                if (isSel) bg = 'rgba(0,255,255,0.25)';

                return (
                  <div key={idx}
                    onClick={() => !isFixed && setSelected(idx)}
                    style={{
                      width: cellSize, height: cellSize,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Orbitron',
                      fontSize,
                      color: isWrong ? '#ff4444' : isFixed ? '#ffffff' : rowDone ? '#FFD700' : '#00ffff',
                      fontWeight: isFixed ? 700 : 400,
                      background: bg,
                      borderRight, borderBottom,
                      cursor: isFixed ? 'default' : 'pointer',
                      transition: 'background 0.2s, color 0.3s',
                      boxSizing: 'border-box',
                      boxShadow: rowDone && !isSel ? 'inset 0 0 16px rgba(255,215,0,0.12)' : 'none',
                      textShadow: rowDone && !isWrong ? '0 0 14px #FFD700' : isSel ? '0 0 14px #00ffff' : 'none',
                      userSelect: 'none',
                    }}>
                    {val !== 0 ? val : ''}
                  </div>
                );
              })}
            </div>

            {/* Number pad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 20, width: `min(${SIZE * 72 + 8}px, 95vw)` }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => handleInput(n)}
                  style={{ padding: '12px 0', background: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.2)', color: '#00ffff', fontFamily: 'Orbitron', fontSize: 18, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,255,255,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(0,255,255,0.05)'}>
                  {n}
                </button>
              ))}
              <button onClick={() => handleInput(0)}
                style={{ padding: '12px 0', background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.25)', color: '#ff4444', fontFamily: 'Orbitron', fontSize: 18, borderRadius: 8, cursor: 'pointer' }}>
                ⌫
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ minWidth: 200, flex: 1, maxWidth: 280 }}>

            {/* Stats */}
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Orbitron', color: '#00ffff', fontSize: 12, marginBottom: 16, letterSpacing: 2 }}>STATS</h3>
              {[
                { label: 'Filled', value: `${totalCorrect} / ${SIZE * SIZE}`, color: '#fff' },
                { label: 'Mistakes', value: mistakes, color: mistakes > 2 ? '#ff4444' : '#fff' },
                { label: 'Rows Done', value: `${completedRows.filter(Boolean).length} / ${SIZE}`, color: '#FFD700' },
                ...(!gameId ? [{ label: 'Time', value: fmt(timer), color: '#FFD700' }] : []),
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#666', fontSize: 13 }}>{label}</span>
                  <span style={{ color, fontFamily: 'Orbitron', fontSize: 13 }}>{value}</span>
                </div>
              ))}
              <div style={{ background: '#1a1a1a', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ background: 'linear-gradient(90deg, #00ffff, #0088aa)', height: '100%', width: `${(totalCorrect / (SIZE * SIZE)) * 100}%`, transition: 'width 0.3s', borderRadius: 3 }} />
              </div>
            </div>

            {/* Row tracker */}
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontFamily: 'Orbitron', color: '#00ffff', fontSize: 12, marginBottom: 16, letterSpacing: 2 }}>ROWS</h3>
              {completedRows.map((done, r) => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: '#555', fontFamily: 'Orbitron', fontSize: 11, width: 48 }}>Row {r + 1}</span>
                  <div style={{ flex: 1, height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: done ? '100%' : '0%',
                      background: done ? 'linear-gradient(90deg, #FFD700, #FFF176)' : 'transparent',
                      borderRadius: 4,
                      boxShadow: done ? '0 0 10px rgba(255,215,0,0.7)' : 'none',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  {done && <span style={{ color: '#FFD700', fontSize: 16 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Solved / Game over banner */}
        {(solved || gameDoc?.status === 'completed') && (
          <div style={{ marginTop: 32, background: '#0a0a0a', border: '2px solid #FFD700', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 0 50px rgba(255,215,0,0.2)' }}>
            <h2 style={{ fontFamily: 'Orbitron', color: '#FFD700', fontSize: 30, marginBottom: 8 }}>
              {gameDoc?.status === 'completed' && gameDoc?.winner !== user?.uid ? '❌ Opponent Won!' : '🏆 Puzzle Solved!'}
            </h2>
            {gameDoc?.winnerName && (
              <p style={{ color: '#aaa', marginBottom: 12 }}>
                Winner: <strong style={{ color: '#FFD700' }}>{gameDoc.winnerName}</strong>
              </p>
            )}
            {!gameId && (
              <p style={{ color: '#aaa', marginBottom: 24 }}>
                Time: <strong style={{ color: '#FFD700', fontFamily: 'Orbitron' }}>{fmt(timer)}</strong>
                &nbsp;·&nbsp; Mistakes: <strong style={{ color: mistakes > 2 ? '#ff4444' : '#FFD700', fontFamily: 'Orbitron' }}>{mistakes}</strong>
              </p>
            )}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {!gameId && (
                <button onClick={() => initPuzzle(difficulty)}
                  style={{ padding: '10px 28px', background: '#FFD700', color: '#000', border: 'none', borderRadius: 8, fontFamily: 'Orbitron', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                  ▶ New Puzzle
                </button>
              )}
              <button onClick={() => navigate('/games/sudoku')}
                style={{ padding: '10px 28px', background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: 8, fontFamily: 'Orbitron', fontSize: 13, cursor: 'pointer' }}>
                Back to Lobby
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
