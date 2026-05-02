import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, query, orderBy, limit, startAfter, getDocs, where
} from 'firebase/firestore';
import { db } from '../firebase';
import './Tournaments.css';

const GAME_FILTERS = ['All', 'BGMI', 'Free Fire', 'Chess', 'Sudoku'];

const GAME_IMGS = { BGMI: '/bgmi.png', 'Free Fire': '/freefire.png', Chess: '/chess.png', Sudoku: '/sudoku.png' };
const GAME_COLORS = { BGMI: '#FFD700', 'Free Fire': '#FF6B35', Chess: '#A8D8EA', Sudoku: '#C7F2A4' };

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('All');
  const PAGE_SIZE = 9;

  const fetchTournaments = useCallback(async (reset = false) => {
    const isFirst = reset || tournaments.length === 0;
    if (!isFirst) setLoadingMore(true);
    else setLoading(true);

    try {
      let q = query(
        collection(db, 'tournaments'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (filter !== 'All') {
        q = query(
          collection(db, 'tournaments'),
          where('gameType', '==', filter),
          limit(PAGE_SIZE)
        );
      }

      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      let newDocs = reset ? docs : [...prev, ...docs];
      // Sort in JS to avoid missing composite index errors on filtered queries
      newDocs.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setTournaments(newDocs);

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter, lastDoc, tournaments.length]);

  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchTournaments(true);
    // eslint-disable-next-line
  }, [filter]);

  return (
    <div className="tournaments-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <p className="section-tag">⚡ TOURNAMENT HUB</p>
          <h1>Active <span className="text-glow">Tournaments</span></h1>
          <p className="page-header-sub">Register. Compete. Win. — New events every week.</p>
        </div>

        {/* Filters */}
        <div className="tournament-filters">
          {GAME_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {GAME_IMGS[f] ? <img src={GAME_IMGS[f]} alt="" style={{width:16, height:16, objectFit:'cover', borderRadius:2}} /> : '🎮'} {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <p style={{ color: 'var(--grey-600)', fontFamily: 'Orbitron,sans-serif', fontSize: 12, letterSpacing: '0.2em' }}>
              LOADING TOURNAMENTS...
            </p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <h3>No Tournaments Found</h3>
            <p>Check back soon or try a different filter.</p>
          </div>
        ) : (
          <div className="tournaments-grid">
            {tournaments.map(t => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && tournaments.length > 0 && (
          <div className="load-more-wrapper">
            <button
              className="btn btn-outline"
              onClick={() => fetchTournaments(false)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TournamentCard({ tournament: t }) {
  const color = GAME_COLORS[t.gameType] || '#FFD700';
  const now = new Date();
  const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
  const isLive = tDate <= now && now <= new Date(tDate.getTime() + 3600000);
  const isPast = tDate < now && !isLive;

  return (
    <Link to={`/tournaments/${t.id}`} className="t-card scroll-reveal" style={{ '--t-color': color }}>
      {t.bannerUrl && (
        <div className="t-card-bg" style={{ backgroundImage: `url(${t.bannerUrl})` }}></div>
      )}
      <div className="t-card-content">
        <div className="t-card-top">
          <div className="t-card-game">
            {GAME_IMGS[t.gameType] ? (
               <img src={GAME_IMGS[t.gameType]} alt="" className="t-card-icon-img" style={{width: 28, height: 28, objectFit: 'cover', borderRadius: 4, filter: `drop-shadow(0 0 8px ${color})`}} />
            ) : <span className="t-card-icon">🎮</span>}
            <span className="t-card-type">{t.gameType}</span>
          </div>
          <div className={`t-card-status ${isLive ? 'status-live' : isPast ? 'status-ended' : 'status-upcoming'}`}>
            {isLive ? 'LIVE' : isPast ? 'ENDED' : 'UPCOMING'}
          </div>
        </div>

        <h3 className="t-card-title">{t.title}</h3>
        <div className="t-card-tech-line">
          <div className="tech-line-solid"></div>
          <div className="tech-line-dashes"></div>
        </div>

        <div className="t-card-meta">
          <div className="t-meta-item">
            <div className="t-meta-left">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
              <span className="t-meta-label">DATE</span>
            </div>
            <div className="t-meta-right">
              <span className="t-meta-value">
                {tDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
              <span className="t-meta-arrow">»</span>
            </div>
          </div>
          
          <div className="t-meta-item">
            <div className="t-meta-left">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.69 2 6 4.69 6 8v2H5c-1.11 0-2 .89-2 2v8c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.89-2-2-2h-1V8c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4v2H8V8c0-2.21 1.79-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>
              <span className="t-meta-label">PRIZE</span>
            </div>
            <div className="t-meta-right">
              <span className="t-meta-value t-meta-highlight" style={{ color }}>{t.prizePool || '—'}</span>
              <span className="t-meta-arrow">»</span>
            </div>
          </div>
          
          <div className="t-meta-item">
            <div className="t-meta-left">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46s-.81-2.77-2-3.46V6h16v2.54zM11 15h2v2h-2zm0-4h2v2h-2zm0-4h2v2h-2z"/></svg>
              <span className="t-meta-label">ENTRY</span>
            </div>
            <div className="t-meta-right">
              <span className="t-meta-value">{t.entryFee || 'Free'}</span>
              <span className="t-meta-arrow">»</span>
            </div>
          </div>
        </div>

        <div className="t-card-footer">
          <span className="t-card-cta">VIEW DETAILS →</span>
          <svg className="t-card-share" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
        </div>
      </div>
    </Link>
  );
}
