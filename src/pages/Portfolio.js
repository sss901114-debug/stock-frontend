import React, { useState, useEffect } from 'react';
import { getCompanies } from '../api';

export default function Portfolio({ setTicker, watchlist, addToWatchlist, removeFromWatchlist }) {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);

  useEffect(() => {
    if (!search) { setResults([]); return; }
    const q = search.toLowerCase();
    setResults(companies.filter(c =>
      c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 6));
  }, [search, companies]);

  const handleAdd = (ticker, name) => {
    addToWatchlist(ticker, name);
    setSearch('');
    setResults([]);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>⭐ 私房股</h2>

      <div style={{ marginBottom: 16, color: '#888', fontSize: 13 }}>
        最多追蹤 10 檔，可在全市場排名或類股比較中直接勾選加入，或用下方搜尋加入。
      </div>

      <div className="card">
        <div className="section-title">🔍 搜尋加入個股</div>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="輸入代號或名稱..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
          {results.length > 0 && (
            <div style={{ position: 'absolute', top: 42, left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 100 }}>
              {results.map(c => (
                <div key={c.ticker} onClick={() => handleAdd(c.ticker, c.name)}
                  style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, borderBottom: '1px solid #f0f0f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <span style={{ color: '#4C9BE8', fontWeight: 700 }}>{c.ticker}</span>
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">📋 目前私房股（{watchlist.length}/30）</div>
        {watchlist.length === 0
          ? <div style={{ color: '#888', padding: '20px 0' }}>尚無個股，請用上方搜尋或在排名頁面勾選加入</div>
          : <table>
              <thead><tr><th>代號</th><th>名稱</th><th>操作</th></tr></thead>
              <tbody>
                {watchlist.map(s => (
                  <tr key={s.ticker}>
                    <td style={{ color: '#4C9BE8', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setTicker(s.ticker)}>{s.ticker}</td>
                    <td>{s.name}</td>
                    <td>
                      <button onClick={() => removeFromWatchlist(s.ticker)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E63946', background: 'white', color: '#E63946', cursor: 'pointer', fontSize: 13 }}>
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}
