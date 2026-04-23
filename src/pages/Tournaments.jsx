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
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      }

      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (reset) {
        setTournaments(docs);
      } else {
        setTournaments(prev => [...prev, ...docs]);
      }

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

function TournamentCard({ tournament: t }) {
  const color = GAME_COLORS[t.gameType] || '#FFD700';
  const now = new Date();
  const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
  const isLive = tDate <= now && now <= new Date(tDate.getTime() + 3600000);
  const isPast = tDate < now && !isLive;

  return (
    <Link to={`/tournaments/${t.id}`} className="t-card" style={{ '--t-color': color }}>
      <div className="t-card-top">
        <div className="t-card-game">
          {GAME_IMGS[t.gameType] ? (
             <img src={GAME_IMGS[t.gameType]} alt="" className="t-card-icon-img" style={{width: 24, height: 24, objectFit: 'cover', borderRadius: 4, filter: `drop-shadow(0 0 4px ${color})`}} />
          ) : <span className="t-card-icon">🎮</span>}
          <span className="t-card-type">{t.gameType}</span>
        </div>
        <span className={`badge ${isLive ? 'badge-success' : isPast ? 'badge-grey' : 'badge-primary'}`}>
          {isLive ? '🔴 LIVE' : isPast ? 'ENDED' : 'UPCOMING'}
        </span>
      </div>

      <h3 className="t-card-title">{t.title}</h3>

      <div className="t-card-meta">
        <div className="t-meta-item">
          <span className="t-meta-label">📅 DATE & TIME</span>
          <span className="t-meta-value">
            {tDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="t-card-footer">
        <span className="t-card-cta">View Details →</span>
      </div>
    </Link>
  );
}
