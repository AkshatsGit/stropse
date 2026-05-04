import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Games.css';

// ─── Sudoku Generator ───────────────────────────────────────────────
function generateSolved() {
  const board = Array(81).fill(0);
  function isValid(b, pos, num) {
    const row = Math.floor(pos / 9), col = pos % 9;
    for (let i = 0; i < 9; i++) {
      if (b[row * 9 + i] === num) return false;
      if (b[i * 9 + col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (b[r * 9 + c] === num) return false;
    return true;
  }
  function solve(b) {
    const pos = b.indexOf(0);
    if (pos === -1) return true;
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    for (const n of nums) {
      if (isValid(b, pos, n)) {
        b[pos] = n;
        if (solve(b)) return true;
        b[pos] = 0;
      }
    }
    return false;
  }
  solve(board);
  return board;
}

function generatePuzzle(difficulty = 'hard') {
  const solved = generateSolved();
  const puzzle = [...solved];
  // hard: remove 55-58 clues, medium: 45-50
  const removes = difficulty === 'hard'
    ? 52 + Math.floor(Math.random() * 5)
    : 44 + Math.floor(Math.random() * 6);
  const indices = Array.from({length:81},(_,i)=>i).sort(() => Math.random()-0.5);
  let removed = 0;
  for (const idx of indices) {
    if (removed >= removes) break;
    const backup = puzzle[idx];
    puzzle[idx] = 0;
    // Quick check: still solvable (simplified – just ensure not trivially broken)
    removed++;
    // Restore if too many removed in same row to keep it medium-hard
    const row = Math.floor(idx / 9);
    const rowCells = puzzle.slice(row*9, row*9+9).filter(v => v !== 0);
    if (rowCells.length < 1) { puzzle[idx] = backup; removed--; }
  }
  return { puzzle, solution: solved };
}

// ─── Row / Col / Box validation helpers ─────────────────────────────
function isRowComplete(board, solution, row) {
  for (let c = 0; c < 9; c++) {
    const i = row * 9 + c;
    if (board[i] !== solution[i]) return false;
  }
  return true;
}

function isBoardSolved(board, solution) {
  return board.every((v, i) => v === solution[i]);
}

// ─── Component ───────────────────────────────────────────────────────
export default function SudokuGame() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('id');

  // Local solo state
  const [puzzle, setPuzzle]     = useState(null);
  const [solution, setSolution] = useState(null);
  const [board, setBoard]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [timer, setTimer]       = useState(0);
  const [running, setRunning]   = useState(false);
  const [solved, setSolved]     = useState(false);
  const [difficulty, setDifficulty] = useState('hard');

  // Multiplayer state
  const [gameDoc, setGameDoc]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId]     = useState('');

  // ── Init puzzle (solo) ──
  const initPuzzle = useCallback((diff = difficulty) => {
    const { puzzle: p, solution: s } = generatePuzzle(diff);
    setPuzzle(p);
    setSolution(s);
    setBoard([...p]);
    setSelected(null);
    setMistakes(0);
    setTimer(0);
    setSolved(false);
    setRunning(true);
  }, [difficulty]);

  useEffect(() => { if (!gameId) initPuzzle(); }, []);

  // ── Timer ──
  useEffect(() => {
    if (!running || solved) return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running, solved]);

  // ── Multiplayer listener ──
  useEffect(() => {
    if (!gameId || !user) return;
    const unsub = onSnapshot(doc(db, 'sudokuGames', gameId), snap => {
      if (!snap.exists()) { toast('Game not found', 'error'); navigate('/games/sudoku'); return; }
      const data = snap.data();
      // Auto-join as p2
      if (!data.player2 && data.player1 !== user.uid) {
        updateDoc(doc(db, 'sudokuGames', gameId), {
          player2: user.uid,
          player2Name: user.displayName || 'Player 2',
          status: 'playing',
        });
        toast('Joined Sudoku match!', 'success');
      }
      setGameDoc(data);
      if (!puzzle && data.puzzle) {
        setPuzzle(data.puzzle);
        setSolution(data.solution);
        setBoard(data.puzzle.map ? [...data.puzzle] : Object.values(data.puzzle));
        setRunning(true);
      }
    });
    return () => unsub();
  }, [gameId, user]);

  // ── Create multiplayer game ──
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
        status: 'waiting', isSolo: false,
        winner: null, createdAt: serverTimestamp(),
      });
      navigate(`/games/sudoku?id=${id}`);
    } catch (e) { toast(e.message, 'error'); }
    finally { setCreating(false); }
  }

  // ── Number input ──
  function handleInput(num) {
    if (selected === null || !board || !solution) return;
    if (puzzle && puzzle[selected] !== 0) return; // fixed cell
    const newBoard = [...board];
    newBoard[selected] = num;
    setBoard(newBoard);

    if (num !== 0 && num !== solution[selected]) {
      setMistakes(m => m + 1);
    }

    if (isBoardSolved(newBoard, solution)) {
      setSolved(true);
      setRunning(false);
      toast('🎉 Sudoku Solved!', 'success');
      if (gameId && gameDoc) {
        updateDoc(doc(db, 'sudokuGames', gameId), {
          status: 'completed',
          winner: user.uid,
          winnerName: user.displayName || 'Player',
        });
      }
    }

    // Sync progress to Firebase (multiplayer)
    if (gameId) {
      const isP1 = gameDoc?.player1 === user?.uid;
      const filled = newBoard.filter((v, i) => v !== 0 && v === solution[i]).length;
      updateDoc(doc(db, 'sudokuGames', gameId), {
        [isP1 ? 'p1Progress' : 'p2Progress']: filled,
        [isP1 ? 'p1Board' : 'p2Board']: newBoard,
      });
    }
  }

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── LOBBY (no gameId, no local puzzle yet) ──
  if (!gameId && !puzzle) {
    return (
      <div style={{ minHeight: '90vh', padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: 42, marginBottom: 8 }}>
            Cyber <span style={{ color: '#00ffff' }}>Sudoku</span>
          </h1>
          <p style={{ color: '#888', marginBottom: 40 }}>9×9 · Medium / Hard · 1v1 or Solo</p>

          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 40, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Orbitron', color: '#00ffff', marginBottom: 24 }}>Solo Play</h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
              {['medium','hard'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${difficulty===d ? '#00ffff' : '#333'}`, background: difficulty===d ? 'rgba(0,255,255,0.1)' : 'transparent', color: difficulty===d ? '#00ffff' : '#666', fontFamily: 'Orbitron', fontSize: 12, cursor: 'pointer', textTransform: 'uppercase' }}>
                  {d}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ borderColor: '#00ffff', color: '#00ffff', background: 'rgba(0,255,255,0.08)' }}
              onClick={() => initPuzzle(difficulty)}>
              ▶ Start Solo
            </button>
          </div>

          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 40 }}>
            <h3 style={{ fontFamily: 'Orbitron', color: '#FFD700', marginBottom: 24 }}>1v1 Challenge</h3>
            <button className="btn btn-primary btn-lg" style={{ marginBottom: 20 }}
              onClick={createMultiGame} disabled={creating || !user}>
              {creating ? 'Creating...' : '⚡ Create 1v1 Game'}
            </button>
            <p style={{ color: '#666', margin: '16px 0 12px', fontFamily: 'Orbitron', fontSize: 11 }}>— OR JOIN —</p>
            <form onSubmit={e => { e.preventDefault(); navigate(`/games/sudoku?id=${joinId}`); }}
              style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <input className="form-input" placeholder="Enter Game ID" value={joinId}
                onChange={e => setJoinId(e.target.value)} style={{ maxWidth: 200 }} />
              <button type="submit" className="btn btn-outline" disabled={!user}>Join</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting for opponent ──
  if (gameId && gameDoc?.status === 'waiting') {
    return (
      <div style={{ minHeight: '90vh', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', gap: 20 }}>
        <h2 style={{ fontFamily: 'Orbitron', color: '#FFD700' }}>Waiting for opponent...</h2>
        <p style={{ color: '#888' }}>Share the Game ID: <strong style={{ color: '#FFD700', fontFamily: 'Orbitron' }}>{gameId}</strong></p>
        <div style={{ background: '#111', padding: 16, borderRadius: 10, display: 'inline-block' }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=000000`}
            alt="QR" style={{ display: 'block', width: 130 }} />
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/games/sudoku')}>Cancel</button>
      </div>
    );
  }

  if (!board || !solution || !puzzle) return null;

  const completedRows = Array.from({length:9},(_,r) => isRowComplete(board, solution, r));
  const isP1 = gameDoc?.player1 === user?.uid;
  const myProgress = gameDoc ? (isP1 ? gameDoc.p1Progress : gameDoc.p2Progress) : null;
  const oppProgress = gameDoc ? (isP1 ? gameDoc.p2Progress : gameDoc.p1Progress) : null;
  const totalCorrect = board.filter((v,i) => v !== 0 && v === solution[i]).length;

  return (
    <div style={{ minHeight: '90vh', padding: '32px 16px 80px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Orbitron', margin: 0 }}>
              Cyber <span style={{ color: '#00ffff' }}>Sudoku</span>
              {gameId && <span style={{ fontSize: 14, color: '#555', marginLeft: 12 }}>{gameId}</span>}
            </h2>
            <p style={{ color: '#666', margin: '4px 0 0', fontSize: 13 }}>
              {gameId ? (gameDoc?.isSolo ? 'Solo' : '1v1 Match') : `${difficulty.toUpperCase()} • ${fmt(timer)}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {!gameId && <span style={{ fontFamily: 'Orbitron', fontSize: 13, color: timer > 0 ? '#FFD700' : '#555', padding: '6px 14px', border: '1px solid #222', borderRadius: 8 }}>{fmt(timer)}</span>}
            <button onClick={() => gameId ? navigate('/games/sudoku') : initPuzzle()}
              style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 11 }}>
              {gameId ? 'LEAVE' : '↺ NEW'}
            </button>
          </div>
        </div>

        {/* Multiplayer Progress */}
        {gameId && gameDoc?.player2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: `${gameDoc?.player1Name} ${gameDoc?.player1 === user?.uid ? '(You)' : ''}`, prog: gameDoc?.p1Progress || 0, color: '#FFD700' },
              { label: `${gameDoc?.player2Name || 'Opponent'} ${gameDoc?.player2 === user?.uid ? '(You)' : ''}`, prog: gameDoc?.p2Progress || 0, color: '#00ffff' },
            ].map(({ label, prog, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color, fontFamily: 'Orbitron', fontSize: 12 }}>{label}</span>
                  <span style={{ color, fontFamily: 'Orbitron', fontSize: 12 }}>{prog}/81</span>
                </div>
                <div style={{ background: '#1a1a1a', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: color, height: '100%', width: `${(prog/81)*100}%`, transition: 'width 0.3s', borderRadius: 4, boxShadow: `0 0 8px ${color}66` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Board */}
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)',
              border: '3px solid #00ffff', borderRadius: 8,
              boxShadow: '0 0 30px rgba(0,255,255,0.12)',
              width: 'min(504px, 95vw)', height: 'min(504px, 95vw)',
              overflow: 'hidden', background: '#050505'
            }}>
              {board.map((val, idx) => {
                const row = Math.floor(idx / 9), col = idx % 9;
                const isFixed = puzzle[idx] !== 0;
                const isSel = selected === idx;
                const isWrong = val !== 0 && val !== solution[idx];
                const rowGlow = completedRows[row];
                const sameNum = selected !== null && val !== 0 && val === board[selected];

                // Box borders
                const borderRight = (col + 1) % 3 === 0 && col !== 8 ? '2px solid rgba(0,255,255,0.5)' : '1px solid rgba(0,255,255,0.08)';
                const borderBottom = (row + 1) % 3 === 0 && row !== 8 ? '2px solid rgba(0,255,255,0.5)' : '1px solid rgba(0,255,255,0.08)';

                let bg = 'transparent';
                if (rowGlow) bg = 'rgba(255,215,0,0.08)';
                if (sameNum && !isSel) bg = 'rgba(0,255,255,0.08)';
                if (isSel) bg = 'rgba(0,255,255,0.22)';

                return (
                  <div key={idx}
                    onClick={() => !isFixed && setSelected(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Orbitron', fontSize: 'min(18px, 2.5vw)',
                      color: isWrong ? '#ff4444' : isFixed ? '#fff' : rowGlow ? '#FFD700' : '#00ffff',
                      fontWeight: isFixed ? 700 : 400,
                      background: bg,
                      borderRight, borderBottom,
                      cursor: isFixed ? 'default' : 'pointer',
                      transition: 'background 0.2s, color 0.3s',
                      boxShadow: rowGlow ? 'inset 0 0 12px rgba(255,215,0,0.15)' : 'none',
                      textShadow: rowGlow && !isWrong ? '0 0 12px #FFD700' : isSel ? '0 0 12px #00ffff' : 'none',
                      userSelect: 'none',
                    }}>
                    {val !== 0 ? val : ''}
                  </div>
                );
              })}
            </div>

            {/* Number pad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, marginTop: 16, width: 'min(504px, 95vw)' }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => handleInput(n)}
                  style={{ padding: '10px 0', background: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.15)', color: '#00ffff', fontFamily: 'Orbitron', fontSize: 16, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background='rgba(0,255,255,0.18)'}
                  onMouseOut={e => e.currentTarget.style.background='rgba(0,255,255,0.05)'}>
                  {n}
                </button>
              ))}
              <button onClick={() => handleInput(0)}
                style={{ padding: '10px 0', background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.2)', color: '#ff4444', fontFamily: 'Orbitron', fontSize: 16, borderRadius: 8, cursor: 'pointer' }}>
                ⌫
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Orbitron', color: '#00ffff', fontSize: 13, marginBottom: 16, letterSpacing: 2 }}>PROGRESS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: 13 }}>Filled</span>
                  <span style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 13 }}>{totalCorrect} / 81</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: 13 }}>Mistakes</span>
                  <span style={{ color: mistakes > 3 ? '#ff4444' : '#fff', fontFamily: 'Orbitron', fontSize: 13 }}>{mistakes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: 13 }}>Rows Done</span>
                  <span style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: 13 }}>{completedRows.filter(Boolean).length} / 9</span>
                </div>
                <div style={{ background: '#1a1a1a', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ background: 'linear-gradient(90deg, #00ffff, #0088aa)', height: '100%', width: `${(totalCorrect/81)*100}%`, transition: 'width 0.3s', borderRadius: 3 }} />
                </div>
              </div>
            </div>

            {/* Row status */}
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontFamily: 'Orbitron', color: '#00ffff', fontSize: 13, marginBottom: 16, letterSpacing: 2 }}>ROWS</h3>
              {completedRows.map((done, r) => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: '#555', fontFamily: 'Orbitron', fontSize: 11, width: 50 }}>Row {r+1}</span>
                  <div style={{ flex: 1, height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: done ? '100%' : '0%', background: done ? 'linear-gradient(90deg, #FFD700, #FFF176)' : 'transparent', borderRadius: 3, boxShadow: done ? '0 0 8px rgba(255,215,0,0.6)' : 'none', transition: 'width 0.4s ease' }} />
                  </div>
                  {done && <span style={{ color: '#FFD700', fontSize: 14 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Solved Banner */}
        {(solved || gameDoc?.status === 'completed') && (
          <div style={{ marginTop: 32, background: '#0a0a0a', border: '2px solid #FFD700', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 0 50px rgba(255,215,0,0.2)' }}>
            <h2 style={{ fontFamily: 'Orbitron', color: '#FFD700', fontSize: 32, marginBottom: 8 }}>
              {gameDoc?.status === 'completed' && gameDoc?.winner !== user?.uid ? '❌ Opponent Won!' : '🏆 Puzzle Solved!'}
            </h2>
            {gameDoc?.winnerName && <p style={{ color: '#aaa', marginBottom: 16 }}>Winner: <strong style={{ color: '#FFD700' }}>{gameDoc.winnerName}</strong></p>}
            {!gameId && <p style={{ color: '#aaa', marginBottom: 24 }}>Time: <strong style={{ color: '#FFD700', fontFamily: 'Orbitron' }}>{fmt(timer)}</strong> · Mistakes: <strong style={{ color: mistakes > 3 ? '#ff4444' : '#FFD700', fontFamily: 'Orbitron' }}>{mistakes}</strong></p>}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {!gameId && <button onClick={() => initPuzzle()} className="btn btn-primary" style={{ background: '#FFD700', color: '#000', border: 'none' }}>▶ New Puzzle</button>}
              <button onClick={() => navigate('/games/sudoku')} className="btn btn-outline">Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
