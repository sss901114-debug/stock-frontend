import React, { useState, useEffect } from 'react';
import { getCompanies } from '../api';
import './Sidebar.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';

export default function Sidebar({ ticker, setTicker, watchlist, removeFromWatchlist, onLogoClick }) {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [wlOpen, setWlOpen] = useState(false);
  const [pgGroups, setPgGroups] = useState([]);
  const [activePg, setActivePg] = useState(null);
  const [pgStocks, setPgStocks] = useState([]);

  useEffect(() => {
    getCompanies().then(setCompanies);
    fetch(`${API_URL}/api/portfolio-groups`)
      .then(r => r.json()).then(setPgGroups).catch(() => {});
  }, []);

  useEffect(() => {
    if (!search) { setResults([]); return; }
    const q = search.toLowerCase();
    setResults(companies.filter(c =>
      c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 8));
  }, [search, companies]);

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const exact = companies.find(c => c.ticker === search.trim());
    const target = exact || results[0];
    if (target) { setTicker(target.ticker); setSearch(''); setResults([]); }
  };

  const selectPg = (g) => {
    if (activePg === g.group_no) { setActivePg(null); setPgStocks([]); return; }
    setActivePg(g.group_no);
    fetch(`${API_URL}/api/portfolio-groups/${g.group_no}/stocks`)
      .then(r => r.json()).then(setPgStocks).catch(() => setPgStocks([]));
  };

  return (
    <aside className="sidebar">
      {/* LOGO 區 */}
      <div className="sidebar-header" onClick={onLogoClick}>
        <span className="sidebar-logo">📈</span>
        <div className="sidebar-title-block">
          <div className="sidebar-title-main">AI WINTIME</div>
          <div className="sidebar-title-sub">台股財務健診系統</div>
        </div>
      </div>

      {/* 搜尋區 */}
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
        <div className="current-stock" onClick={() => setTicker(ticker)}>
          <span>{companies.find(c => c.ticker === ticker)?.name || ticker}</span>
          <span className="current-ticker">{ticker}</span>
        </div>
      </div>

      {/* 私房股群組 */}
      <div className="sidebar-section">
        <div className="sidebar-label">⭐ 私房股 ({watchlist.length}/30)</div>

        {/* 群組下拉按鈕 */}
        {pgGroups.length > 0 && (
          <div className="pg-groups">
            {pgGroups.map(g => (
              <div key={g.group_no}>
                <div className={`pg-btn ${activePg === g.group_no ? 'active' : ''}`}
                  onClick={() => selectPg(g)}>
                  <span>{g.group_name || `私房股${g.group_no}`}</span>
                  <span className="pg-arrow">{activePg === g.group_no ? '▲' : '▼'}</span>
                </div>
                {activePg === g.group_no && (
                  <div className="pg-stocks">
                    {pgStocks.length === 0
                      ? <div className="empty-list">尚無股票</div>
                      : pgStocks.map(s => (
                        <div key={s.ticker} className="watchlist-item"
                          onClick={() => setTicker(s.ticker)}>
                          <span className="search-ticker">{s.ticker}</span>
                          <span className="wl-name">{s.name}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 追蹤清單 */}
        <div className="pg-btn" style={{ marginTop: 4 }}
          onClick={() => setWlOpen(o => !o)}>
          <span>追蹤清單</span>
          <span className="pg-arrow">{wlOpen ? '▲' : '▼'}</span>
        </div>
        {wlOpen && (
          <div className="pg-stocks">
            {watchlist.length === 0
              ? <div className="empty-list">尚無追蹤</div>
              : watchlist.map(w => (
                <div key={w.ticker} className="watchlist-item">
                  <span onClick={() => setTicker(w.ticker)} style={{ flex: 1, display: 'flex', gap: 6, cursor: 'pointer' }}>
                    <span className="search-ticker">{w.ticker}</span>
                    <span className="wl-name">{w.name}</span>
                  </span>
                  <span onClick={() => removeFromWatchlist(w.ticker)}
                    style={{ color: '#e05050', cursor: 'pointer', fontSize: 13 }}>✕</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </aside>
  );
}
