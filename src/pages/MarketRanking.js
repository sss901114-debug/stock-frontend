import React, { useState, useEffect } from 'react';
import { getRanking } from '../api';

const SORT_FIELDS = [
  { key: 'rev_yoy', label: '月營收年增率' },
  { key: 'gross_rate_chg', label: '毛利率季增' },
  { key: 'op_rate_chg', label: '營益率季增' },
  { key: 'op_income_yoy', label: '營業利益年增率' },
];

export default function MarketRanking({ setTicker, watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('rev_yoy');
  const [sortDir, setSortDir] = useState('desc');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [displayCount, setDisplayCount] = useState(100);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    getRanking().then(rows => {
      const processed = rows.map(s => ({
        ...s,
        gross_rate_chg: (s.gross_rate != null && s.prev_gross_rate != null)
          ? Number(s.gross_rate) - Number(s.prev_gross_rate) : null,
        op_rate_chg: (s.op_income != null && s.prev_op_income != null && s.rev != null && Number(s.rev) !== 0)
          ? (Number(s.op_income) - Number(s.prev_op_income)) / Math.abs(Number(s.rev)) * 100 : null,
        op_income_yoy: (s.op_income != null && s.prev_year_op_income != null && Number(s.prev_year_op_income) !== 0)
          ? (Number(s.op_income) - Number(s.prev_year_op_income)) / Math.abs(Number(s.prev_year_op_income)) * 100 : null,
        cur_rev_b: s.cur_rev != null ? (Number(s.cur_rev) / 100000).toFixed(2) : null,
        prev_rev_b: s.prev_rev != null ? (Number(s.prev_rev) / 100000).toFixed(2) : null,
      }));
      setData(processed);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">⏳ 載入全市場資料...</div>;

  // 篩選：剔除本月或去年同月營收未達0.3億(30000千元)的個股，無資料者也剔除
  let filtered = data.filter(r => {
    if (r.cur_rev == null || r.prev_rev == null) return false;
    return Number(r.cur_rev) >= 30000 && Number(r.prev_rev) >= 30000;
  });
  if (filterIndustry.trim()) {
    filtered = filtered.filter(r =>
      (r.sub_industry || '').includes(filterIndustry.trim()) ||
      (r.name || '').includes(filterIndustry.trim())
    );
  }

  // 排序
  filtered = [...filtered].sort((a, b) => {
    const va = a[sortField] ?? -Infinity;
    const vb = b[sortField] ?? -Infinity;
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const displayed = filtered.slice(0, displayCount);

  const fmt = v => v == null || v === '' || isNaN(Number(v)) ? '-' : Number(v).toFixed(2) + '%';
  const colorVal = v => (v == null || isNaN(v)) ? '#ccc' : v > 0 ? '#4ec94e' : v < 0 ? '#e05c5c' : '#ccc';

  return (
    <div style={{ padding: '8px' }}>
      <h2 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>🏆 全市場排名</h2>

      {/* 排序按鈕 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {SORT_FIELDS.map(f => (
          <button key={f.key}
            onClick={() => { if (sortField === f.key) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortField(f.key); setSortDir('desc'); } }}
            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: sortField === f.key ? '#4C9BB8' : '#2a3a4a', color: '#fff', fontSize: 13, fontWeight: sortField === f.key ? 700 : 400 }}>
            {f.label} {sortField === f.key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
          </button>
        ))}
      </div>

      {/* 篩選 + 顯示筆數 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="產業篩選（可留空）"
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #333', background: '#1e2a3a', color: '#fff', width: 200 }}
        />
        <div style={{ display: 'flex', gap: 16 }}>
          {['desc', 'asc'].map(d => (
            <label key={d} style={{ cursor: 'pointer', color: sortDir === d ? '#4C9BB8' : '#aaa', fontSize: 14 }}>
              <input type="radio" checked={sortDir === d} onChange={() => setSortDir(d)} style={{ marginRight: 4 }} />
              {d === 'desc' ? '由高到低' : '由低到高'}
            </label>
          ))}
        </div>
        <select value={displayCount} onChange={e => setDisplayCount(Number(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #333', background: '#1e2a3a', color: '#fff' }}>
          {[50, 100, 200, 500].map(n => <option key={n} value={n}>顯示 {n} 筆</option>)}
        </select>
        <span style={{ color: '#aaa', fontSize: 13 }}>共 {filtered.length} 筆</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a', color: '#ddd' }}>
              <th style={th}>私房股</th>
              <th style={th}>代號</th>
              <th style={{ ...th, textAlign: 'left' }}>名稱</th>
              <th style={{ ...th, textAlign: 'left' }}>子產業</th>
              <th style={th}>月營收年增率(%)</th>
              <th style={th}>本月營收(億)</th>
              <th style={th}>去年同月(億)</th>
              <th style={th}>毛利率季增(百分點)</th>
              <th style={th}>營益率季增(百分點)</th>
              <th style={th}>營業利益年增率(%)</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr key={row.ticker}
                style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, textAlign: 'center' }}>
                  <input type="checkbox"
                    checked={isInWatchlist ? isInWatchlist(row.ticker) : false}
                    onChange={e => {
                      e.stopPropagation();
                      if (isInWatchlist && isInWatchlist(row.ticker)) {
                        removeFromWatchlist && removeFromWatchlist(row.ticker);
                      } else {
                        addToWatchlist && addToWatchlist(row.ticker, row.name);
                      }
                    }}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                </td>
                <td style={{ ...td, color: '#4C9BB8', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setTicker && setTicker(row.ticker)}>{row.ticker}</td>
                <td style={{ ...td, textAlign: 'left', color: '#fff' }}>{row.name}</td>
                <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontSize: 12 }}>{row.sub_industry || '-'}</td>
                <td style={{ ...td, color: colorVal(row.rev_yoy) }}>{fmt(row.rev_yoy)}</td>
                <td style={{ ...td, color: '#ccc' }}>{row.cur_rev_b ?? '-'}</td>
                <td style={{ ...td, color: '#ccc' }}>{row.prev_rev_b ?? '-'}</td>
                <td style={{ ...td, color: colorVal(row.gross_rate_chg) }}>{fmt(row.gross_rate_chg)}</td>
                <td style={{ ...td, color: colorVal(row.op_rate_chg) }}>{fmt(row.op_rate_chg)}</td>
                <td style={{ ...td, color: colorVal(row.op_income_yoy) }}>{fmt(row.op_income_yoy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #2a3a4a' };
const td = { padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #1e2a3a' };
