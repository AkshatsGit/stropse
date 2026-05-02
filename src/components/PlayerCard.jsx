import React from 'react';
import './PlayerCard.css';

/* ── Inline SVG icons per game type ─────────────────── */
function IconCrosshair() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: 'none', stroke: 'var(--card-accent)', strokeWidth: 1.5 }}>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1" fill="var(--card-accent)" stroke="none" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: 'none', stroke: 'var(--card-accent)', strokeWidth: 1.5, strokeLinejoin: 'round' }}>
      <path d="M12 2l3 6.5 7 1-5 5 1.5 7-6.5-3.5-6.5 3.5 1.5-7-5-5 7-1z" />
    </svg>
  );
}

function IconGamepad() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: 'var(--card-accent)' }}>
      <path d="M21.5 9.5c-1-4.5-3-6.5-9.5-6.5S3.5 5 2.5 9.5C2 12 1.5 15.5 1.5 17c0 1.5 1 2 2.5 1s2.5-3 5.5-3h5c3 0 4 2 5.5 3s2.5-.5 2.5-2c0-1.5-.5-5-1-7.5zM7.5 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm9 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
      <circle cx="16.5" cy="10" r="1" fill="#111"/>
      <circle cx="7.5" cy="10" r="1" fill="#111"/>
    </svg>
  );
}

const GAME_COLOR = {
  'BGMI': '#FFD700',
  'Free Fire': '#FF3300',
  'Chess': '#00D0FF',
  'Sudoku': '#00FF66',
};

const BG_IMAGES = {
  'BGMI': '/bgmi.png',
  'Free Fire': '/freefire.png',
  'Chess': '/chess.png',
  'Sudoku': '/sudoku.png',
};

function TopSparkle() {
  return (
    <svg viewBox="0 0 16 16" style={{ width: '9px', height: '9px' }}>
      <path d="M8 0 Q8 6 14 8 Q8 10 8 16 Q8 10 2 8 Q8 6 8 0Z" fill="var(--card-accent)" />
      <circle cx="8" cy="8" r="3" fill="#fff" />
    </svg>
  );
}

export function PlayerCard({ profile }) {
  const gameKey = profile.gameType || 'BGMI';
  const accentColor = GAME_COLOR[gameKey] || '#FFD700';
  const bgImage = BG_IMAGES[gameKey] || '/bgmi.png';

  return (
    <div className="player-card scroll-reveal" style={{ '--card-accent': accentColor }}>
      {/* Background Graphic */}
      <div className="pc-hero-bg" style={{ backgroundImage: `url(${bgImage})` }} />
      
      {/* Border & Notch */}
      <div className="pc-frame-outer">
        <div className="pc-top-notch" />
      </div>

      <div className="pc-inner">
        {/* Header */}
        <div className="pc-header-title">
          <TopSparkle />
          {gameKey.toUpperCase()} PLAYER PROFILE
          <TopSparkle />
        </div>

        {/* Content body */}
        <div className="pc-body-wrap">
          {/* Left: ID & Name */}
          <div className="pc-left-col">
            <div className="pc-id-label">PLAYER USERNAME</div>
            <div className="pc-player-name" style={{ color: accentColor }}>{profile?.playerName || 'GAMER'}</div>
            
            <div className="pc-id-divider" />
            
            <div className="pc-id-label" style={{ marginTop: '2px' }}>PLAYER UID</div>
            <div className="pc-id-val">{profile?.playerId || '0000000000'}</div>
            
            <div className="pc-id-divider" />
            
            <div className="pc-id-label" style={{ marginTop: '2px' }}>PLAYER NAME</div>
            <div className="pc-player-fullname">{profile?.fullName || 'AKSHAT SRIVASTAVA'}</div>
          </div>

          {/* Right: QR & Seal */}
          <div className="pc-right-col">
            <div className="pc-qr-box">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://stropse.vercel.app/card/${encodeURIComponent(profile.playerId)}&bgcolor=ffffff&color=000000`}
                alt="QR"
              />
            </div>
            
            <img src="/stropse-seal.png" alt="Seal" className="pc-seal-img" />

            {profile.status === 'verified' ? (
              <div className="pc-verified-badge">
                <svg viewBox="0 0 24 24" fill="#00f260" width="6px" height="6px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                VERIFIED
              </div>
            ) : (
              <div className="pc-verified-badge" style={{ borderColor: '#666', color: '#666', background: 'rgba(100,100,100,0.1)' }}>
                PENDING
              </div>
            )}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="pc-stats-panel">
          {(gameKey === 'BGMI' || gameKey === 'Free Fire') ? (
            <>
              <div className="pc-stat-col">
                <div className="pc-stat-title">
                  <div className="pc-stat-icon"><IconCrosshair /></div> K/D RATIO
                </div>
                <div className="pc-stat-num">{profile.stats?.kd || '—'}</div>
              </div>
              <div className="pc-stat-col">
                <div className="pc-stat-title">
                  <div className="pc-stat-icon"><IconStar /></div> WIN RATE
                </div>
                <div className="pc-stat-num">{profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'}</div>
              </div>
              <div className="pc-stat-col">
                <div className="pc-stat-title">
                  <div className="pc-stat-icon"><IconGamepad /></div> GAMES PLAYED
                </div>
                <div className="pc-stat-num">{profile.stats?.matches || '—'}</div>
              </div>
            </>
          ) : (
            <>
              <div className="pc-stat-col">
                <div className="pc-stat-title">
                  <div className="pc-stat-icon"><IconStar /></div> ELO
                </div>
                <div className="pc-stat-num">{profile.stats?.elo || '—'}</div>
              </div>
              <div className="pc-stat-col">
                <div className="pc-stat-title">
                  <div className="pc-stat-icon"><IconStar /></div> WIN RATE
                </div>
                <div className="pc-stat-num">{profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'}</div>
              </div>
              <div className="pc-stat-col">
                <div className="pc-stat-title">
                  <div className="pc-stat-icon"><IconStar /></div> RANK
                </div>
                <div className="pc-stat-num">{profile.stats?.rank || '—'}</div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pc-footer">
          <div className="pc-footer-title">
            <span>✦</span> OFFICIAL {gameKey.toUpperCase()} CARD <span>✦</span>
          </div>
          <div className="pc-footer-id">
            ID: 8651{profile.playerId?.substring(0, 6) || 'XXXXXX'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlayerCardBack() {
  return (
    <div className="player-card pc-back">
      <div className="pc-watermark" style={{ opacity: 0.15, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/stropse-seal.png" alt="STROPSE" style={{ width: '110%', filter: 'drop-shadow(0 0 40px rgba(255,215,0,0.3))' }} />
      </div>
      <div className="pc-back-stripe" style={{ position: 'relative', zIndex: 2 }}>STROPSE</div>
      <div className="pc-back-footer" style={{ position: 'relative', zIndex: 2 }}>EST. 2026 - COMPETITIVE ESPORTS</div>
    </div>
  );
}

export default PlayerCard;
