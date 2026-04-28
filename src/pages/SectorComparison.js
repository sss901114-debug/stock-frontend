import React, { useState, useEffect } from 'react';
import { getRanking } from '../api';

const SORT_FIELDS = [
  { key: 'monthly_revenue_growth', label: '月營收年增率' },
  { key: 'gross_rate', label: '毛利率季增' },
  { key: 'operating_rate', label: '營益率季增' },
  { key: 'revenue_growth', label: '營業利益年增率' },
];

export default function SectorComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('monthly_revenue_growth');
  const [sortDir, setSortDir] = useState('desc');
  const [filterIndustry, setFilterIndustry] = useState('');

  useEffect(() => {
    getRanking().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">⏳ 載入類股資料...</div>;

  // 按子產業分組
  const industries = {};
  data.forEach(row => {
    const key = row.sub_industry || row.industry || '其他';
    if (!industries[key]) industries[key] = [];
    industries[key].push(row);
  });

  // 計算每個產業的平均值
  const avg = (arr, field) => {
    const vals = arr.filter(s => s[field] != null && !isNaN(s[field]));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + Number(b[field]), 0) / vals.length;
  };

  let sectorRows = Object.entries(industries).map(([name, stocks]) => ({
    name,
    count: stocks.length,
    monthly_revenue_growth: avg(stocks, 'monthly_revenue_growth'),
    gross_rate: avg(stocks, 'gross_rate'),
    operating_rate: avg(stocks, 'operating_rate'),
    revenue_growth: avg(stocks, 'revenue_growth'),
  }));

  // 篩選
  if (filterIndustry.trim()) {
    sectorRows = sectorRows.filter(r => r.name.includes(filterIndustry.trim()));
  }

  // 排序
  sectorRows.sort((a, b) => {
    const va = a[sortField] ?? -Infinity;
    const vb = b[sortField] ?? -Infinity;
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const fmt = v => v == null || isNaN(v) ? 'N/A' : v.toFixed(2) + '%';

  return (
    <div style={{ padding: '8px' }}>
      <h2 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>🏭 全市場類股排名</h2>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="篩選產業（可留空）"
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #333', background: '#1e2a3a', color: '#fff', width: 200 }}
        />
        <span style={{ color: '#888', fontSize: 13 }}>共 {sectorRows.length} 個子產業</span>
      </div>

      {/* 排序按鈕 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {SORT_FIELDS.map(f => (
          <button
            key={f.key}
            onClick={() => {
              if (sortField === f.key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
              else { setSortField(f.key); setSortDir('desc'); }
            }}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: sortField === f.key ? '#4C9BB8' : '#2a3a4a',
              color: '#fff', fontSize: 13, fontWeight: sortField === f.key ? 700 : 400,
            }}
          >
            {f.label} {sortField === f.key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
          </button>
        ))}
      </div>

      {/* 排序方向 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        {['desc', 'asc'].map(d => (
          <label key={d} style={{ cursor: 'pointer', color: sortDir === d ? '#4C9BB8' : '#888', fontSize: 14 }}>
            <input type="radio" checked={sortDir === d} onChange={() => setSortDir(d)} style={{ marginRight: 4 }} />
            {d === 'desc' ? '由高到低' : '由低到高'}
          </label>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#1e2a3a', color: '#aaa' }}>
              <th style={th}>子產業</th>
              <th style={th}>家數</th>
              <th style={th}>月營收年增率(%)</th>
              <th style={th}>本季毛利率(%)</th>
              <th style={th}>本季營益率(%)</th>
              <th style={th}>營業利益年增率(%)</th>
            </tr>
          </thead>
          <tbody>
            {sectorRows.map((row, i) => (
              <tr key={row.name} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={td}>{row.name}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.count}</td>
                <td style={{ ...td, color: colorVal(row.monthly_revenue_growth) }}>{fmt(row.monthly_revenue_growth)}</td>
                <td style={{ ...td, color: colorVal(row.gross_rate) }}>{fmt(row.gross_rate)}</td>
                <td style={{ ...td, color: colorVal(row.operating_rate) }}>{fmt(row.operating_rate)}</td>
                <td style={{ ...td, color: colorVal(row.revenue_growth) }}>{fmt(row.revenue_growth)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #2a3a4a' };
const td = { padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #1e2a3a' };
const colorVal = v => v == null ? '#888' : v > 0 ? '#4ec94e' : v < 0 ? '#e05c5c' : '#888';
