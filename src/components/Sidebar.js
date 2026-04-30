import React, { useState, useEffect } from 'react';
import { getCompanies } from '../api';
import './Sidebar.css';

export default function Sidebar({ ticker, setTicker, watchlist, removeFromWatchlist }) {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [wlOpen, setWlOpen] = useState(false);

  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);

  useEffect(() => {
    if (!search) { setResults([]); return; }
    const q = search.toLowerCase();
    setResults(companies.filter(c =>
      c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 8));
  }, [search, companies]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">📈</span>
        <span className="sidebar-title">台股分析</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">🔍 選擇股票</div>
        <div className="search-box">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="代號或名稱..."
          />
          {results.length > 0 && (
            <div className="search-results">
              {results.map(c => (
                <div key={c.ticker} className="search-item"
                  onClick={() => { setTicker(c.ticker); setSearch(''); setResults([]); }}>
                  <span className="search-ticker">{c.ticker}</span>
                  <span className="search-name">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="current-stock">
          {companies.find(c => c.ticker === ticker)?.name || ticker}
          <span className="current-ticker">{ticker}</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={() => setWlOpen(o => !o)}>
          <span>⭐ 私房股 ({watchlist.length}/30)</span>
          <span style={{ fontSize: 11, color: '#aaa' }}>{wlOpen ? '▲' : '▼'}</span>
        </div>
        {wlOpen && (
          <div style={{ marginTop: 4, background: '#0d1a2a', borderRadius: 6, overflow: 'hidden' }}>
            {watchlist.length === 0
              ? <div className="empty-list">尚無追蹤</div>
              : watchlist.map(w => (
                <div key={w.ticker} className="watchlist-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <span onClick={() => setTicker(w.ticker)} style={{ cursor: 'pointer', flex: 1 }}>
                    <span>{w.ticker}</span>
                    <span className="wl-name">{w.name}</span>
                  </span>
                  <span onClick={() => removeFromWatchlist(w.ticker)}
                    style={{ cursor: 'pointer', color: '#e05c5c', marginLeft: 6, fontSize: 14, lineHeight: 1 }}>✕</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </aside>
  );
}
