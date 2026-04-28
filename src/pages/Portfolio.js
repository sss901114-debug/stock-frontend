import React, { useState, useEffect } from 'react';
import { getPortfolioGroups, getPortfolioStocks, addPortfolio, removePortfolio, getCompanies } from '../api';

export default function Portfolio({ setTicker }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(1);
  const [stocks, setStocks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    getPortfolioGroups().then(g => { setGroups(g); });
    getCompanies().then(setCompanies);
  }, []);

  useEffect(() => {
    getPortfolioStocks(selectedGroup).then(setStocks);
  }, [selectedGroup]);

  useEffect(() => {
    if (!search) { setResults([]); return; }
    const q = search.toLowerCase();
    setResults(companies.filter(c =>
      c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 6));
  }, [search, companies]);

  const handleAdd = (ticker, name) => {
    addPortfolio(selectedGroup, ticker, name).then(() => {
      getPortfolioStocks(selectedGroup).then(setStocks);
      setSearch(''); setResults([]);
    });
  };

  const handleRemove = (ticker) => {
    removePortfolio(selectedGroup, ticker).then(() => {
      getPortfolioStocks(selectedGroup).then(setStocks);
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>⭐ 私房股</h2>

      {/* 組別選擇 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {groups.map(g => (
          <button key={g.group_no} onClick={() => setSelectedGroup(g.group_no)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer',
              background: selectedGroup === g.group_no ? 'var(--blue)' : 'white',
              color: selectedGroup === g.group_no ? 'white' : '#333', fontWeight: 600
            }}>
            {g.group_name}
          </button>
        ))}
      </div>

      {/* 搜尋加入 */}
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

      {/* 股票清單 */}
      <div className="card">
        <div className="section-title">📋 目前持股</div>
        {stocks.length === 0
          ? <div style={{ color: '#888', padding: '20px 0' }}>尚無個股，請用上方搜尋加入</div>
          : <table>
              <thead><tr><th>代號</th><th>名稱</th><th>操作</th></tr></thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.ticker}>
                    <td style={{ color: '#4C9BE8', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setTicker(s.ticker)}>{s.ticker}</td>
                    <td>{s.name}</td>
                    <td>
                      <button onClick={() => handleRemove(s.ticker)}
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
