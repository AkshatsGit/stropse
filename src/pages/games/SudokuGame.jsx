import React, { useState } from 'react';
import './Games.css';

const PUZZLES = [
  {
    initial: [
      1, 0, 0, 0, 0, 6,
      0, 0, 6, 0, 3, 0,
      0, 2, 0, 0, 0, 0,
      0, 0, 0, 5, 0, 0,
      0, 6, 0, 2, 0, 0,
      4, 0, 0, 0, 0, 1
    ],
    solution: [
      1, 5, 3, 4, 2, 6,
      2, 4, 6, 1, 3, 5,
      6, 2, 5, 3, 1, 4,
      3, 1, 4, 5, 6, 2,
      5, 6, 1, 2, 4, 3,
      4, 3, 2, 6, 5, 1
    ]
  }
];

export default function SudokuGame() {
  const [board, setBoard] = useState(PUZZLES[0].initial);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [moves, setMoves] = useState([]);

  function handleCellClick(idx) {
    if (PUZZLES[0].initial[idx] !== 0) return; // fixed cell
    setSelectedIdx(idx);
  }

  function handleNumberInput(num) {
    if (selectedIdx === null) return;
    const newBoard = [...board];
    newBoard[selectedIdx] = num;
    setBoard(newBoard);
    
    // Add to history
    const row = Math.floor(selectedIdx / 6) + 1;
    const col = (selectedIdx % 6) + 1;
    setMoves([{ text: `Placed ${num !== 0 ? num : 'blank'} at R${row}C${col}` }, ...moves]);
  }

  function checkWin() {
    return board.every((val, i) => val === PUZZLES[0].solution[i]);
  }

  function resetGame() {
    setBoard(PUZZLES[0].initial);
    setSelectedIdx(null);
    setMoves([]);
  }

  return (
    <div className="sudoku-page">
      <div className="container">
        <div className="chess-layout">
          <div className="chess-board-container" style={{ alignItems: 'center' }}>
            <div className="chess-header" style={{ width: '100%', maxWidth: 400 }}>
              <h2>Cyber <span className="text-glow" style={{ color: '#00ffff' }}>Sudoku</span></h2>
              <button className="btn btn-outline btn-sm" onClick={resetGame}>↺ Restart</button>
            </div>
            
            <div className="sudoku-board-6x6">
              {board.map((val, idx) => {
                const isFixed = PUZZLES[0].initial[idx] !== 0;
                const isSelected = selectedIdx === idx;
                const row = Math.floor(idx / 6);
                const col = idx % 6;
                // 6x6 usually has 2x3 blocks: blocks are every 2 rows, and every 3 cols.
                const isBottomBorder = row === 1 || row === 3;
                const isRightBorder = col === 2;

                return (
                  <div 
                    key={idx} 
                    className={`sudoku-cell ${isFixed ? 'fixed' : ''} ${isSelected ? 'selected' : ''} ${isBottomBorder ? 'border-b' : ''} ${isRightBorder ? 'border-r' : ''}`}
                    onClick={() => handleCellClick(idx)}
                  >
                    {val !== 0 ? val : ''}
                  </div>
                );
              })}
            </div>

            <div className="sudoku-controls" style={{ gridTemplateColumns: 'repeat(7, 1fr)', width: 'min(400px, 90vw)' }}>
              {[1,2,3,4,5,6].map(num => (
                <button key={num} className="sudoku-num-btn" onClick={() => handleNumberInput(num)}>{num}</button>
              ))}
              <button className="sudoku-num-btn erase" onClick={() => handleNumberInput(0)}>⌫</button>
            </div>

            {checkWin() && (
              <div className="chess-game-over" style={{ marginTop: 24, position: 'relative', top: 'auto', left: 'auto', transform: 'none' }}>
                <h3 style={{ color: '#00ffff' }}>Puzzle Solved!</h3>
                <p>Impressive logic.</p>
              </div>
            )}
          </div>

          <div className="chess-sidebar">
            <h3 className="sidebar-title" style={{ color: '#00ffff' }}>Action Log</h3>
            <div className="move-history-list">
              {moves.length === 0 ? <p className="empty-moves">No actions yet</p> : null}
              {moves.map((m, i) => (
                <div key={i} className="move-row" style={{ color: 'var(--grey-300)' }}>
                  <span className="move-num" style={{ color: '#00ffff' }}>{moves.length - i}.</span>
                  <span>{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
