import React from 'react';
import './PlayerCard.css';

const GAME_CONFIGS = {
  BGMI: {
    color: '#FFD700',
    bg: 'linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(26,18,0,0.95) 50%, rgba(10,10,10,0.95) 100%), url(/bgmi.png) center/cover',
    accent: '#FFD700',
    label: 'BATTLE ROYALE',
    icon: '/bgmi.png',
    style: 'aggressive',
  },
  'Free Fire': {
    color: '#FF6B35',
    bg: 'linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(26,8,0,0.95) 50%, rgba(10,10,10,0.95) 100%), url(/freefire.png) center/cover',
    accent: '#FF6B35',
    label: 'SURVIVAL',
    icon: '/freefire.png',
    style: 'aggressive',
  },
  Chess: {
    color: '#A8D8EA',
    bg: 'linear-gradient(135deg, rgba(5,5,16,0.95) 0%, rgba(10,10,26,0.95) 50%, rgba(5,5,16,0.95) 100%), url(/chess.png) center/cover',
    accent: '#A8D8EA',
    label: 'STRATEGY',
    icon: '/chess.png',
    style: 'elegant',
  },
  Sudoku: {
    color: '#C7F2A4',
    bg: 'linear-gradient(135deg, rgba(3,10,3,0.95) 0%, rgba(7,18,7,0.95) 50%, rgba(3,10,3,0.95) 100%), url(/sudoku.png) center/cover',
    accent: '#C7F2A4',
    label: 'PUZZLE',
    icon: '/sudoku.png',
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
          <span className="pc-icon">
            <img src={config.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
          </span>
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
