import React from 'react';
import './PlayerCard.css';

/* ── Inline SVG icons per game type ─────────────────── */
function IconBGMI() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="12" cy="12" r="11" stroke="#FFD700" strokeWidth="1.2" fill="none"/>
      <path d="M7 12h10M12 7v10" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2.5" fill="#FFD700" opacity="0.8"/>
      <path d="M4 9l2 3-2 3M20 9l-2 3 2 3" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  );
}

function IconFreeFire() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <path d="M12 3 C10 7 7 8 8 12 C9 15 11 15 11 18 C13 15 15 14 14 10 C17 12 16 17 14 19 C18 17 20 13 18 9 C16 5 12 3 12 3Z" fill="#FF3300" opacity="0.9"/>
      <path d="M11 18 C11 20.5 12.5 21.5 12.5 21.5 C12.5 21.5 14 20 14 18" stroke="#FF6600" strokeWidth="1" fill="none" opacity="0.7"/>
    </svg>
  );
}

function IconChess() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="8" y="17" width="8" height="2.5" rx="1" fill="#00D0FF" opacity="0.8"/>
      <rect x="9.5" y="14.5" width="5" height="2.5" rx="0.8" fill="#00D0FF" opacity="0.8"/>
      <path d="M10 14.5 V10 M14 14.5 V10" stroke="#00D0FF" strokeWidth="1" opacity="0.5"/>
      <rect x="10" y="7" width="4" height="3.5" rx="0.5" fill="#00D0FF" opacity="0.9"/>
      <path d="M12 4 V7 M10 5.5 H14" stroke="#00D0FF" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="5" y="19.5" width="14" height="1" rx="0.5" fill="#00D0FF" opacity="0.4"/>
    </svg>
  );
}

function IconSudoku() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#00FF66" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <line x1="9" y1="3" x2="9" y2="21" stroke="#00FF66" strokeWidth="0.7" opacity="0.4"/>
      <line x1="15" y1="3" x2="15" y2="21" stroke="#00FF66" strokeWidth="0.7" opacity="0.4"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="#00FF66" strokeWidth="0.7" opacity="0.4"/>
      <line x1="3" y1="15" x2="21" y2="15" stroke="#00FF66" strokeWidth="0.7" opacity="0.4"/>
      <circle cx="6" cy="6" r="1.2" fill="#00FF66"/>
      <circle cx="12" cy="12" r="1.2" fill="#00FF66"/>
      <circle cx="18" cy="18" r="1.2" fill="#00FF66"/>
      <circle cx="18" cy="6" r="1.2" fill="#00FF66" opacity="0.5"/>
      <circle cx="6" cy="18" r="1.2" fill="#00FF66" opacity="0.5"/>
    </svg>
  );
}

const GAME_ICON = {
  'BGMI': IconBGMI,
  'Free Fire': IconFreeFire,
  'Chess': IconChess,
  'Sudoku': IconSudoku,
};

const GAME_COLOR = {
  'BGMI': '#FFD700',
  'Free Fire': '#FF3300',
  'Chess': '#00D0FF',
  'Sudoku': '#00FF66',
};

function StatIcon({ type }) {
  const s = { width: 10, height: 10, marginRight: 3 };
  if (type === 'kd') return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <path d="M3 13 L8 3 L13 13" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="5" y1="10" x2="11" y2="10" stroke="#FFD700" strokeWidth="1" opacity="0.6"/>
    </svg>
  );
  if (type === 'win') return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <path d="M8 2 L10 6 L14 6.5 L11 9.5 L11.8 14 L8 11.8 L4.2 14 L5 9.5 L2 6.5 L6 6 Z" stroke="#FFD700" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'match') return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="#FFD700" strokeWidth="1.2"/>
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="#FFD700" strokeWidth="1.2" opacity="0.5"/>
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="#FFD700" strokeWidth="1.2" opacity="0.5"/>
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="#FFD700" strokeWidth="1.2"/>
    </svg>
  );
  if (type === 'elo') return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <polyline points="2,12 5,7 8,9 11,4 14,6" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'rank') return (
    <svg viewBox="0 0 16 16" fill="none" style={s}>
      <rect x="2" y="8" width="3" height="6" rx="0.5" fill="#FFD700" opacity="0.5"/>
      <rect x="6.5" y="5" width="3" height="9" rx="0.5" fill="#FFD700" opacity="0.8"/>
      <rect x="11" y="2" width="3" height="12" rx="0.5" fill="#FFD700"/>
    </svg>
  );
  return null;
}

export function PlayerCard({ profile }) {
  const gameKey = profile.gameType || 'BGMI';
  const Icon = GAME_ICON[gameKey] || IconBGMI;
  const accentColor = GAME_COLOR[gameKey] || '#FFD700';

  return (
    <div className="player-card" style={{ '--card-accent': accentColor }}>
      <div className="pc-frame" />
      <div className="pc-inner">
        <div className="pc-header-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14 }}><Icon /></div>
          {gameKey.toUpperCase()} PLAYER PROFILE
          <div style={{ width: 14, height: 14 }}><Icon /></div>
        </div>

        <div className="pc-id-section">
          <div className="pc-id-label">PLAYER ID</div>
          <div className="pc-id-val">{profile.playerId || '0000000000'}</div>
          <div className="pc-player-name" style={{ color: accentColor }}>{profile.playerName || 'GAMER'}</div>
        </div>

        <div className="pc-mid">
          <div className="pc-qr">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://stropse.vercel.app/card/${encodeURIComponent(profile.playerId)}&bgcolor=ffffff&color=000000`}
              alt="QR Code"
            />
          </div>
          <div className="pc-seal-container">
            {profile.status === 'verified' ? (
              <>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden' }}>
                  <img src="/stropse-seal.png" alt="Seal" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen' }} />
                </div>
                <div className="pc-verified-text">VERIFIED BY STROPSE</div>
              </>
            ) : (
              <div className="pc-verified-text" style={{ background: '#333', color: '#aaa' }}>PENDING APPROVAL</div>
            )}
          </div>
        </div>

        <div className="pc-stats-row">
          {(gameKey === 'BGMI' || gameKey === 'Free Fire') ? (
            <>
              <div className="pc-stat">
                <div className="pc-stat-lbl"><StatIcon type="kd" />KD</div>
                <div className="pc-stat-val" style={{ color: accentColor }}>{profile.stats?.kd || '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl"><StatIcon type="win" />WIN%</div>
                <div className="pc-stat-val" style={{ color: accentColor }}>{profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl"><StatIcon type="match" />GAMES</div>
                <div className="pc-stat-val" style={{ color: accentColor }}>{profile.stats?.matches || '—'}</div>
              </div>
            </>
          ) : (
            <>
              <div className="pc-stat">
                <div className="pc-stat-lbl"><StatIcon type="elo" />ELO</div>
                <div className="pc-stat-val" style={{ color: accentColor }}>{profile.stats?.elo || '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl"><StatIcon type="win" />WIN%</div>
                <div className="pc-stat-val" style={{ color: accentColor }}>{profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl"><StatIcon type="rank" />RANK</div>
                <div className="pc-stat-val" style={{ color: accentColor }}>{profile.stats?.rank || '—'}</div>
              </div>
            </>
          )}
        </div>

        <div className="pc-footer-text">
          OFFICIAL {gameKey.toUpperCase()} CARD · ID: 8651{profile.playerId?.substring(0, 6) || 'XXXXXX'}
        </div>
      </div>
    </div>
  );
}

export function PlayerCardBack() {
  return (
    <div className="player-card pc-back">
      <div className="pc-watermark" style={{ opacity: 0.2, mixBlendMode: 'screen', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/stropse-seal.png" alt="STROPSE" style={{ width: '120%', filter: 'drop-shadow(0 0 100px rgba(255,215,0,0.5))', mixBlendMode: 'screen' }} />
      </div>
      <div className="pc-back-stripe" style={{ position: 'relative', zIndex: 2 }}>STROPSE</div>
      <div className="pc-back-footer" style={{ position: 'relative', zIndex: 2 }}>EST. 2026 - COMPETITIVE ESPORTS</div>
    </div>
  );
}

export default PlayerCard;
