import React, { useState, useEffect } from 'react';
import { getCompanies } from '../api';
import './Sidebar.css';

export default function Sidebar({ ticker, setTicker, watchlist, removeFromWatchlist, onLogoClick }) {
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

  // Enter 鍵直接選第一筆，或精確比對代號
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const exact = companies.find(c => c.ticker === search.trim());
    const target = exact || results[0];
    if (target) { setTicker(target.ticker); setSearch(''); setResults([]); }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={onLogoClick} style={{ cursor: 'default', userSelect: 'none' }}>
        <span className="sidebar-logo">📈</span>
        <span className="sidebar-title" style={{ lineHeight: 1.3, fontSize: 13 }}>
          AI WINTIME<br/>
          <span style={{ fontSize: 11, color: '#7abcd4' }}>台股財務健診系統</span>
        </span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">🔍 選擇股票</div>
        <div className="search-box">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
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
        {/* 目前股票做成可點擊按鈕 */}
        <div className="current-stock" onClick={() => setTicker(ticker)}
          style={{ cursor: 'pointer', borderRadius: 6, padding: '6px 10px',
            background: '#1e3a5a', border: '1px solid #4C9BB8', marginTop: 4,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{companies.find(c => c.ticker === ticker)?.name || ticker}</span>
          <span className="current-ticker" style={{ background: '#4C9BB8', color: '#fff',
            padding: '2px 7px', borderRadius: 4, fontSize: 12 }}>{ticker}</span>
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
