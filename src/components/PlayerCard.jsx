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
        </div>

        <div className="pc-mid">
          <div className="pc-qr">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=stropse_verify_${profile.playerId}`} alt="QR Code" />
          </div>
          <div className="pc-seal-container">
            <div className={`pc-seal-hologram ${profile.status === 'verified' ? 'verified' : 'pending'}`}>
              <span>OFFICIAL</span>
              <span>STROPSE</span>
              <span>SEAL</span>
            </div>
            <div className="pc-verified-text">
              {profile.status === 'verified' ? 'VERIFIED BY STROPSE' : 'PENDING APPROVAL'}
            </div>
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
      <div className="pc-back-stripe">
        STROPSE
      </div>
      <div className="pc-back-footer">EST. 2024 - COMPETITIVE ESPORTS</div>
    </div>
  );
}

// Keep default export for backwards compatibility
export default PlayerCard;
