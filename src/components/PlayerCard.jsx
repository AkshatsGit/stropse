import React from 'react';
import './PlayerCard.css';

const GAME_CONFIGS = {
  BGMI: {
    color: '#FFD700',
    bg: 'linear-gradient(135deg, rgba(20,15,0,1) 0%, rgba(5,5,5,1) 40%, rgba(40,30,0,1) 100%)',
    accent: '#FFD700',
    label: 'BATTLE ROYALE',
    icon: '🔫',
    style: 'aggressive',
  },
  'Free Fire': {
    color: '#FF3300',
    bg: 'linear-gradient(135deg, rgba(30,5,0,1) 0%, rgba(5,5,5,1) 40%, rgba(40,10,0,1) 100%)',
    accent: '#FF3300',
    label: 'SURVIVAL',
    icon: '🔥',
    style: 'aggressive',
  },
  Chess: {
    color: '#00D0FF',
    bg: 'linear-gradient(135deg, rgba(0,10,25,1) 0%, rgba(5,5,5,1) 40%, rgba(0,25,50,1) 100%)',
    accent: '#00D0FF',
    label: 'STRATEGY',
    icon: '♟️',
    style: 'elegant',
  },
  Sudoku: {
    color: '#00FF66',
    bg: 'linear-gradient(135deg, rgba(0,20,5,1) 0%, rgba(5,5,5,1) 40%, rgba(0,40,10,1) 100%)',
    accent: '#00FF66',
    label: 'PUZZLE',
    icon: '🔢',
    style: 'elegant',
  },
};

export default function PlayerCard({ profile, compact = false }) {
  const config = GAME_CONFIGS[profile.gameType] || GAME_CONFIGS.BGMI;
  const isAggressive = config.style === 'aggressive';

  return (
    <div
      className={`player-card player-card-${config.style} ${compact ? 'player-card-compact' : ''}`}
      style={{
        '--card-color': config.color,
        '--card-accent': config.accent,
        background: config.bg,
      }}
    >
      {/* Scanline Effect */}
      <div className="pc-scanlines" />

      {/* Corner Decorations */}
      <div className="pc-corner pc-corner-tl" />
      <div className="pc-corner pc-corner-tr" />
      <div className="pc-corner pc-corner-bl" />
      <div className="pc-corner pc-corner-br" />

      {/* Header */}
      <div className="pc-header">
        <div className="pc-game-info">
          <span className="pc-icon" style={{ fontSize: 32 }}>{config.icon}</span>
          <div>
            <div className="pc-game-label">{config.label}</div>
            <div className="pc-game-name">{profile.gameType}</div>
          </div>
        </div>
        <div className={`pc-status badge ${profile.status === 'verified' ? 'badge-success' : 'badge-grey'}`}>
          {profile.status === 'verified' ? '✓ VERIFIED' : 'PENDING'}
        </div>
      </div>

      {/* Player ID */}
      <div className="pc-player-id">
        <div className="pc-id-label">PLAYER ID</div>
        <div className="pc-id-value">{profile.playerId}</div>
      </div>

      {/* Divider */}
      <div className="pc-divider" />

      {/* Stats */}
      <div className="pc-stats">
        {profile.gameType === 'BGMI' || profile.gameType === 'Free Fire' ? (
          <>
            <StatItem label="K/D" value={profile.stats?.kd || '—'} color={config.color} />
            <StatItem label="WIN%" value={profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'} color={config.color} />
            <StatItem label="MATCHES" value={profile.stats?.matches || '—'} color={config.color} />
          </>
        ) : (
          <>
            <StatItem label="ELO" value={profile.stats?.elo || '—'} color={config.color} />
            <StatItem label="WIN%" value={profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'} color={config.color} />
            <StatItem label="RANK" value={profile.stats?.rank || '—'} color={config.color} />
          </>
        )}
      </div>

      {/* Logo Watermark (fills empty space) */}
      <div className="pc-watermark">
        <img src="https://www.nesabamedia.com/apps/wp-content/uploads/2025/05/BGMI-Logo.png" alt="BGMI" />
      </div>

      {/* STROPSE brand */}
      <div className="pc-brand">
        <span className="pc-brand-text">STROPSE</span>
        <div className="pc-brand-line" />
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="pc-stat">
      <div className="pc-stat-label">{label}</div>
      <div className="pc-stat-value" style={{ color }}>{value}</div>
    </div>
  );
}
