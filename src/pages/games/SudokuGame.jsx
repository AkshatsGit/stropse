import React, { useState } from 'react';
import './Games.css';

const PUZZLES = [
  {
    initial: [
      5,3,0,0,7,0,0,0,0,
      6,0,0,1,9,5,0,0,0,
      0,9,8,0,0,0,0,6,0,
      8,0,0,0,6,0,0,0,3,
      4,0,0,8,0,3,0,0,1,
      7,0,0,0,2,0,0,0,6,
      0,6,0,0,0,0,2,8,0,
      0,0,0,4,1,9,0,0,5,
      0,0,0,0,8,0,0,7,9
    ],
    solution: [
      5,3,4,6,7,8,9,1,2,
      6,7,2,1,9,5,3,4,8,
      1,9,8,3,4,2,5,6,7,
      8,5,9,7,6,1,4,2,3,
      4,2,6,8,5,3,7,9,1,
      7,1,3,9,2,4,8,5,6,
      9,6,1,5,3,7,2,8,4,
      2,8,7,4,1,9,6,3,5,
      3,4,5,2,8,6,1,7,9
    ]
  }
];

export default function SudokuGame() {
  const [board, setBoard] = useState(PUZZLES[0].initial);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [moves, setMoves] = useState([]); // to note moves

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
    const row = Math.floor(selectedIdx / 9) + 1;
    const col = (selectedIdx % 9) + 1;
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
            <div className="chess-header" style={{ width: '100%', maxWidth: 450 }}>
              <h2>Cyber <span className="text-glow" style={{ color: '#00ffff' }}>Sudoku</span></h2>
              <button className="btn btn-outline btn-sm" onClick={resetGame}>↺ Restart</button>
            </div>
            
            <div className="sudoku-board">
              {board.map((val, idx) => {
                const isFixed = PUZZLES[0].initial[idx] !== 0;
                const isSelected = selectedIdx === idx;
                const row = Math.floor(idx / 9);
                const col = idx % 9;
                const isBottomBorder = row === 2 || row === 5;
                const isRightBorder = col === 2 || col === 5;

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

            <div className="sudoku-controls">
              {[1,2,3,4,5,6,7,8,9].map(num => (
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
