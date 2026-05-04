import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import './Games.css';

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);

  // update board state
  const updateBoard = useCallback(() => {
    setBoard(game.board());
    setMoveHistory(game.history({ verbose: true }));
  }, [game]);

  function onSquareClick(square) {
    if (game.isGameOver()) return;

    if (selectedSquare) {
      // Try to move
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // always promote to queen for simplicity
        });
        if (move) {
          setSelectedSquare(null);
          setPossibleMoves([]);
          updateBoard();
          // Bot move simulation (random valid move)
          setTimeout(() => makeRandomMove(), 500);
          return;
        }
      } catch (e) {
        // Invalid move, select the new square instead if it's our piece
      }
    }

    // Select square
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setPossibleMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }

  function makeRandomMove() {
    if (game.isGameOver()) return;
    const moves = game.moves();
    if (moves.length === 0) return;
    const move = moves[Math.floor(Math.random() * moves.length)];
    game.move(move);
    updateBoard();
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveHistory([]);
  }

  const columns = ['a','b','c','d','e','f','g','h'];
  const rows = [8,7,6,5,4,3,2,1];

  const pieceUnicode = {
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
  };

  return (
    <div className="chess-page">
      <div className="container">
        <div className="chess-layout">
          <div className="chess-board-container">
            <div className="chess-header">
              <h2>Neo <span className="text-glow">Chess</span></h2>
              <button className="btn btn-outline btn-sm" onClick={resetGame}>↺ Restart</button>
            </div>
            
            <div className="chess-board">
              {rows.map((row, rIndex) => (
                <div key={row} className="chess-row">
                  {columns.map((col, cIndex) => {
                    const square = `${col}${row}`;
                    const isDark = (rIndex + cIndex) % 2 === 1;
                    const piece = board[rIndex][cIndex];
                    const isSelected = selectedSquare === square;
                    const isPossible = possibleMoves.includes(square);
                    const isCheck = piece && piece.type === 'k' && piece.color === game.turn() && game.inCheck();

                    return (
                      <div 
                        key={square} 
                        className={`chess-square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isPossible ? 'possible' : ''} ${isCheck ? 'in-check' : ''}`}
                        onClick={() => onSquareClick(square)}
                      >
                        {isPossible && !piece && <div className="possible-dot" />}
                        {piece && (
                          <span className={`chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}>
                            {pieceUnicode[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {game.isGameOver() && (
              <div className="chess-game-over">
                <h3>Game Over</h3>
                <p>{
                  game.isCheckmate() ? 'Checkmate!' : 
                  game.isDraw() ? 'Draw!' : 
                  game.isStalemate() ? 'Stalemate!' : 'Game Ended'
                }</p>
                <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
              </div>
            )}
          </div>

          <div className="chess-sidebar">
            <h3 className="sidebar-title">Move History</h3>
            <div className="move-history-list">
              {moveHistory.length === 0 ? <p className="empty-moves">No moves yet</p> : null}
              {/* Group by pairs */}
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                <div key={i} className="move-row">
                  <span className="move-num">{i + 1}.</span>
                  <span className="move-w">{moveHistory[i * 2]?.san}</span>
                  <span className="move-b">{moveHistory[i * 2 + 1]?.san || ''}</span>
                </div>
              ))}
            </div>
            <div className="chess-status">
              <p>Turn: <strong>{game.turn() === 'w' ? 'White' : 'Black'}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
