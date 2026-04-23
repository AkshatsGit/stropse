import React from 'react';
import './PlayerCard.css';

export function PlayerCard({ profile }) {
  const gameKey = profile.gameType || 'BGMI';
  
  return (
    <div className="player-card">
      <div className="pc-frame" />
      <div className="pc-inner">
        <div className="pc-header-title">{gameKey.toUpperCase()} PLAYER PROFILE</div>
        
        <div className="pc-id-section">
          <div className="pc-id-label">PLAYER ID</div>
          <div className="pc-id-val">{profile.playerId || '0000000000'}</div>
          <div className="pc-player-name">{profile.playerName || 'GAMER'}</div>
        </div>

        <div className="pc-mid">
          <div className="pc-qr">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=stropse_verify_${profile.playerId}`} alt="QR Code" />
          </div>
          <div className="pc-seal-container">
            {profile.status === 'verified' ? (
              <>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden' }}>
                  <img src="/stropse-seal.png" alt="Seal" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen' }} />
                </div>
                <div className="pc-verified-text">
                  VERIFIED BY STROPSE
                </div>
              </>
            ) : (
              <div className="pc-verified-text" style={{ background: '#333', color: '#aaa' }}>
                PENDING APPROVAL
              </div>
            )}
          </div>
        </div>

        <div className="pc-stats-row">
          {(gameKey === 'BGMI' || gameKey === 'Free Fire') ? (
            <>
              <div className="pc-stat">
                <div className="pc-stat-lbl">KD RATIO</div>
                <div className="pc-stat-val">{profile.stats?.kd || '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl">WIN RATE</div>
                <div className="pc-stat-val">{profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl">MATCHES</div>
                <div className="pc-stat-val">{profile.stats?.matches || '—'}</div>
              </div>
            </>
          ) : (
            <>
              <div className="pc-stat">
                <div className="pc-stat-lbl">ELO RATING</div>
                <div className="pc-stat-val">{profile.stats?.elo || '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl">WIN RATE</div>
                <div className="pc-stat-val">{profile.stats?.winRate ? `${profile.stats.winRate}%` : '—'}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-lbl">RANK</div>
                <div className="pc-stat-val">{profile.stats?.rank || '—'}</div>
              </div>
            </>
          )}
        </div>

        <div className="pc-footer-text">
          THIS CARD IS OFFICIAL FOR {gameKey.toUpperCase()} EVENTS. CARD ID: 8651{profile.playerId?.substring(0,6) || 'XXXXXX'}
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
      <div className="pc-back-stripe" style={{ position: 'relative', zIndex: 2 }}>
        STROPSE
      </div>
      <div className="pc-back-footer" style={{ position: 'relative', zIndex: 2 }}>EST. 2026 - COMPETITIVE ESPORTS</div>
    </div>
  );
}

// Keep default export for backwards compatibility
export default PlayerCard;
