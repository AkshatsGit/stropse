import React from 'react';
import { Link } from 'react-router-dom';
import './Games.css';

export default function GamesLobby() {
  const games = [
    { id: 'chess', name: 'Neo Chess', desc: 'Classic strategy, neon arena. Play against an AI or analyze positions.', icon: '♟️', color: '#FFD700' },
    { id: 'sudoku', name: 'Cyber Sudoku', desc: 'Number logic puzzle with dynamic difficulty and pristine styling.', icon: '🔢', color: '#00ffff' }
  ];

  return (
    <div className="games-lobby-page">
      <div className="container">
        <div className="page-header">
          <p className="section-tag">⚡ STROPSE ORIGINALS</p>
          <h1>Platform <span className="text-glow">Games</span></h1>
          <p className="section-subtitle">High-fidelity mini-games built directly into the Stropse ecosystem.</p>
        </div>
        
        <div className="games-lobby-grid">
          {games.map((g, i) => (
            <Link key={g.id} to={`/games/${g.id}`} className="lobby-card scroll-reveal visible" style={{'--card-color': g.color, transitionDelay: `${i * 0.1}s`}}>
              <div className="lobby-card-icon">{g.icon}</div>
              <h2 className="lobby-card-name">{g.name}</h2>
              <p className="lobby-card-desc">{g.desc}</p>
              <div className="lobby-card-cta">PLAY NOW →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
