import React, { useState, useEffect } from 'react';
import { getRanking } from '../api';

const SORT_FIELDS = [
  { key: 'monthly_revenue_growth', label: '月營收年增率' },
  { key: 'gross_rate_chg', label: '毛利率季增百分點' },
  { key: 'op_rate_chg', label: '營益率季增百分點' },
  { key: 'op_income_yoy', label: '營業利益年增率' },
];

export default function SectorComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('monthly_revenue_growth');
  const [sortDir, setSortDir] = useState('desc');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [expandedSector, setExpandedSector] = useState(null);

  useEffect(() => {
    getRanking().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">⏳ 載入類股資料...</div>;

  const industries = {};
  data.forEach(row => {
    const key = row.sub_industry || row.industry || '其他';
    if (!industries[key]) industries[key] = [];
    industries[key].push(row);
  });

  const sumField = (arr, field) =>
    arr.filter(s => s[field] != null && s[field] !== '' && !isNaN(Number(s[field])))
       .reduce((a, b) => a + Number(b[field]), 0);

  const hasValid = (arr, field) =>
    arr.some(s => s[field] != null && s[field] !== '' && !isNaN(Number(s[field])));

  const calcSector = (stocks) => {
    const cur_rev_total = sumField(stocks, 'cur_rev');
    const prev_rev_total = sumField(stocks, 'prev_rev');
    const monthly_revenue_growth = (hasValid(stocks, 'cur_rev') && prev_rev_total !== 0)
      ? (cur_rev_total - prev_rev_total) / Math.abs(prev_rev_total) * 100 : null;

    const gS = stocks.filter(s => s.gross_rate != null && s.gross_rate !== '' && s.rev != null && s.rev !== '');
    const rev_sum = gS.reduce((a, b) => a + Number(b.rev), 0);
    const gp_sum = gS.reduce((a, b) => a + Number(b.gross_rate) / 100 * Number(b.rev), 0);
    const cur_grate = rev_sum > 0 ? gp_sum / rev_sum * 100 : null;

    const pgS = stocks.filter(s => s.prev_gross_rate != null && s.prev_gross_rate !== '' && s.rev != null && s.rev !== '');
    const prev_rev_sum = pgS.reduce((a, b) => a + Number(b.rev), 0);
    const pgp_sum = pgS.reduce((a, b) => a + Number(b.prev_gross_rate) / 100 * Number(b.rev), 0);
    const prev_grate = prev_rev_sum > 0 ? pgp_sum / prev_rev_sum * 100 : null;
    const gross_rate_chg = (cur_grate != null && prev_grate != null) ? cur_grate - prev_grate : null;

    const opS = stocks.filter(s => s.op_income != null && s.op_income !== '' && s.rev != null && s.rev !== '');
    const op_sum = opS.reduce((a, b) => a + Number(b.op_income), 0);
    const op_rev_sum = opS.reduce((a, b) => a + Number(b.rev), 0);
    const cur_oprate = op_rev_sum > 0 ? op_sum / op_rev_sum * 100 : null;

    const popS = stocks.filter(s => s.prev_op_income != null && s.prev_op_income !== '' && s.rev != null && s.rev !== '');
    const pop_sum = popS.reduce((a, b) => a + Number(b.prev_op_income), 0);
    const pop_rev_sum = popS.reduce((a, b) => a + Number(b.rev), 0);
    const prev_oprate = pop_rev_sum > 0 ? pop_sum / pop_rev_sum * 100 : null;
    const op_rate_chg = (cur_oprate != null && prev_oprate != null) ? cur_oprate - prev_oprate : null;

    const op_income_sum = sumField(stocks, 'op_income');
    const prev_year_op_sum = sumField(stocks, 'prev_year_op_income');
    const op_income_yoy = (hasValid(stocks, 'op_income') && hasValid(stocks, 'prev_year_op_income') && prev_year_op_sum !== 0)
      ? (op_income_sum - prev_year_op_sum) / Math.abs(prev_year_op_sum) * 100 : null;

    return { monthly_revenue_growth, gross_rate_chg, op_rate_chg, op_income_yoy };
  };

  const calcCompany = (s) => {
    const cur_rev = Number(s.cur_rev);
    const prev_rev = Number(s.prev_rev);
    const monthly_revenue_growth = (s.cur_rev != null && s.cur_rev !== '' && s.prev_rev != null && s.prev_rev !== '' && prev_rev !== 0)
      ? (cur_rev - prev_rev) / Math.abs(prev_rev) * 100 : null;

    const gross_rate_chg = (s.gross_rate != null && s.gross_rate !== '' && s.prev_gross_rate != null && s.prev_gross_rate !== '')
      ? Number(s.gross_rate) - Number(s.prev_gross_rate) : null;

    const rev = Number(s.rev);
    const cur_oprate = (s.op_income != null && s.op_income !== '' && rev !== 0) ? Number(s.op_income) / rev * 100 : null;
    const prev_oprate = (s.prev_op_income != null && s.prev_op_income !== '' && rev !== 0) ? Number(s.prev_op_income) / rev * 100 : null;
    const op_rate_chg = (cur_oprate != null && prev_oprate != null) ? cur_oprate - prev_oprate : null;

    const op_income_yoy = (s.op_income != null && s.op_income !== '' && s.prev_year_op_income != null && s.prev_year_op_income !== '' && Number(s.prev_year_op_income) !== 0)
      ? (Number(s.op_income) - Number(s.prev_year_op_income)) / Math.abs(Number(s.prev_year_op_income)) * 100 : null;

    return { monthly_revenue_growth, gross_rate_chg, op_rate_chg, op_income_yoy };
  };

  let sectorRows = Object.entries(industries).map(([name, stocks]) => ({
    name, count: stocks.length, stocks, ...calcSector(stocks)
  }));

  if (filterIndustry.trim()) {
    sectorRows = sectorRows.filter(r => r.name.includes(filterIndustry.trim()));
  }

  sectorRows.sort((a, b) => {
    const va = a[sortField] ?? -Infinity;
    const vb = b[sortField] ?? -Infinity;
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const fmt = v => v == null || isNaN(v) ? 'N/A' : v.toFixed(2) + '%';
  const colorVal = v => v == null ? '#aaa' : v > 0 ? '#4ec94e' : v < 0 ? '#e05c5c' : '#aaa';

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
        <span style={{ color: '#ccc', fontSize: 13 }}>共 {sectorRows.length} 個子產業</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {SORT_FIELDS.map(f => (
          <button key={f.key}
            onClick={() => { if (sortField === f.key) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortField(f.key); setSortDir('desc'); } }}
            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: sortField === f.key ? '#4C9BB8' : '#2a3a4a', color: '#fff', fontSize: 13, fontWeight: sortField === f.key ? 700 : 400 }}>
            {f.label} {sortField === f.key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        {['desc', 'asc'].map(d => (
          <label key={d} style={{ cursor: 'pointer', color: sortDir === d ? '#4C9BB8' : '#aaa', fontSize: 14 }}>
            <input type="radio" checked={sortDir === d} onChange={() => setSortDir(d)} style={{ marginRight: 4 }} />
            {d === 'desc' ? '由高到低' : '由低到高'}
          </label>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#1e2a3a', color: '#ddd' }}>
              <th style={th}>子產業</th>
              <th style={{ ...th, textAlign: 'center' }}>家數</th>
              <th style={th}>月營收年增率(%)</th>
              <th style={th}>本季毛利率季增(百分點)</th>
              <th style={th}>本季營益率季增(百分點)</th>
              <th style={th}>營業利益年增率(%)</th>
            </tr>
          </thead>
          <tbody>
            {sectorRows.map((row, i) => (
              <React.Fragment key={row.name}>
                {/* 類股列 */}
                <tr
                  onClick={() => setExpandedSector(expandedSector === row.name ? null : row.name)}
                  style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535', cursor: 'pointer' }}
                >
                  <td style={{ ...td, color: '#fff', textAlign: 'left' }}>
                    <span style={{ marginRight: 8, color: '#4C9BB8', fontSize: 11 }}>
                      {expandedSector === row.name ? '▼' : '▶'}
                    </span>
                    {row.name}
                  </td>
                  <td style={{ ...td, textAlign: 'center', color: '#ddd' }}>{row.count}</td>
                  <td style={{ ...td, color: colorVal(row.monthly_revenue_growth) }}>{fmt(row.monthly_revenue_growth)}</td>
                  <td style={{ ...td, color: colorVal(row.gross_rate_chg) }}>{fmt(row.gross_rate_chg)}</td>
                  <td style={{ ...td, color: colorVal(row.op_rate_chg) }}>{fmt(row.op_rate_chg)}</td>
                  <td style={{ ...td, color: colorVal(row.op_income_yoy) }}>{fmt(row.op_income_yoy)}</td>
                </tr>

                {/* 展開的個別公司 */}
                {expandedSector === row.name && row.stocks.map(s => {
                  const c = calcCompany(s);
                  return (
                    <tr key={s.ticker} style={{ background: '#0d1822' }}>
                      <td style={{ ...td, paddingLeft: 36, color: '#ccc', textAlign: 'left' }}>
                        <span style={{ color: '#666', marginRight: 6 }}>{s.ticker}</span>
                        {s.name}
                      </td>
                      <td style={{ ...td, textAlign: 'center', color: '#555' }}>—</td>
                      <td style={{ ...td, color: colorVal(c.monthly_revenue_growth) }}>{fmt(c.monthly_revenue_growth)}</td>
                      <td style={{ ...td, color: colorVal(c.gross_rate_chg) }}>{fmt(c.gross_rate_chg)}</td>
                      <td style={{ ...td, color: colorVal(c.op_rate_chg) }}>{fmt(c.op_rate_chg)}</td>
                      <td style={{ ...td, color: colorVal(c.op_income_yoy) }}>{fmt(c.op_income_yoy)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #2a3a4a' };
const td = { padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #1e2a3a' };
