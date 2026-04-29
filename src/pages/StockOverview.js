import React, { useState, useEffect } from 'react';
import { getCompanyInfo, getQuarterly, getMonthly, getAnnual, getDividend, getEstEps, addWatchlist, removeWatchlist } from '../api';

export default function StockOverview({ ticker }) {
  const [info, setInfo] = useState(null);
  const [quarterly, setQuarterly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [annual, setAnnual] = useState([]);
  const [dividend, setDividend] = useState([]);
  const [estEps, setEstEps] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    Promise.all([
      getCompanyInfo(ticker).catch(() => null),
      getQuarterly(ticker).catch(() => []),
      getMonthly(ticker).catch(() => []),
      getAnnual(ticker).catch(() => []),
      getDividend(ticker).catch(() => []),
      getEstEps(ticker).catch(() => null),
    ]).then(([i, q, m, a, d, e]) => {
      setInfo(i); setQuarterly(q); setMonthly(m);
      setAnnual(a); setDividend(d); setEstEps(e);
      setLoading(false);
    });
  }, [ticker]);

  if (!ticker) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
      <div style={{ fontSize: 18 }}>請從左側輸入股票代號或名稱</div>
    </div>
  );
  if (loading) return <div className="loading">⏳ 載入中...</div>;
  if (!info) return <div className="loading">找不到股票資料</div>;

  const qData = [...quarterly].sort((a, b) => b['期別'] > a['期別'] ? 1 : -1).slice(0, 16);
  const qHeaders = qData.map(r => r['期別']);
  const mData = [...monthly].sort((a, b) => b.period > a.period ? 1 : -1).slice(0, 24);

  const fmt = (v, dec=2) => (v === '' || v == null || isNaN(Number(v))) ? '-' : Number(v).toFixed(dec);
  const colorPos = (v) => (v === '' || v == null || isNaN(Number(v))) ? '#ccc' : Number(v) > 0 ? '#4ec94e' : Number(v) < 0 ? '#e05c5c' : '#ccc';
  const colorNeg = (v) => (v === '' || v == null || isNaN(Number(v))) ? '#ccc' : Number(v) > 0 ? '#e05c5c' : Number(v) < 0 ? '#4ec94e' : '#ccc';

  const sectionTitle = (title) => (
    <div style={{ background: '#1a2a3a', color: '#4C9BB8', padding: '8px 12px', fontWeight: 700, fontSize: 15, marginTop: 24, marginBottom: 4, borderLeft: '4px solid #4C9BB8' }}>
      {title}
    </div>
  );

  return (
    <div style={{ padding: '8px' }}>
      {/* 標題 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{ticker} {info.name}</h2>
          {info.sub_industry && <span style={{ background: '#2a3a4a', color: '#4C9BB8', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{info.sub_industry}</span>}
        </div>
        <button onClick={() => inWatchlist ? removeWatchlist(ticker).then(() => setInWatchlist(false)) : addWatchlist(ticker, info?.name || '').then(() => setInWatchlist(true))}
          style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #4C9BB8', background: inWatchlist ? '#4C9BB8' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          {inWatchlist ? '★ 已追蹤' : '☆ 加入追蹤'}
        </button>
      </div>

      {/* 預估EPS */}
      {estEps && (
        <div style={{ background: '#1e2a3a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <span style={{ color: '#aaa', fontSize: 13 }}>🔮 預估下季EPS</span>
          <span style={{ color: '#fff' }}>近3月營收：<b style={{ color: '#4ec94e' }}>{estEps.rev_3m}億</b></span>
          <span style={{ color: '#fff' }}>預估毛利率：<b style={{ color: '#4ec94e' }}>{estEps.est_gpm}%</b></span>
          <span style={{ color: '#fff' }}>預估EPS：<b style={{ color: '#f5c518', fontSize: 18 }}>{estEps.est_eps ?? 'N/A'}</b></span>
        </div>
      )}

      {/* 季度損益表 */}
      {sectionTitle('📊 季度損益表')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a' }}>
              <th style={{ ...th, textAlign: 'left', minWidth: 160 }}>項目</th>
              {qHeaders.map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: '營業收入(億)', key: '營業收入_億', cf: colorPos },
              { label: '毛利率(%)', key: '毛利率', cf: colorPos },
              { label: '營益率(%)', key: '營益率', cf: colorPos },
              { label: '業外收支率(%)', key: '業外收支率', cf: colorPos },
              { label: '稅前淨利率(%)', key: '稅前淨利率', cf: colorPos },
              { label: '稅後淨利率(%)', key: '稅後淨利率', cf: colorPos },
              { label: '每股盈餘(元)', key: '每股盈餘', cf: colorPos },
              { label: '推銷費用率(%)', key: '推銷費用率', cf: colorNeg },
              { label: '管理費用率(%)', key: '管理費用率', cf: colorNeg },
              { label: '研發費用率(%)', key: '研發費用率', cf: colorNeg },
              { label: '營收年增率(%)', key: '營收年增率', cf: colorPos },
            ].map((row, i) => (
              <tr key={row.key} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontWeight: 600 }}>{row.label}</td>
                {qData.map(q => <td key={q['期別']} style={{ ...td, color: row.cf(q[row.key]) }}>{fmt(q[row.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 季度資產負債表 */}
      {sectionTitle('🏦 季度資產負債表')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a' }}>
              <th style={{ ...th, textAlign: 'left', minWidth: 160 }}>項目</th>
              {qHeaders.map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: '資產總額(億)', key: '資產總額_億', cf: colorPos },
              { label: '負債總額(億)', key: '負債總額_億', cf: colorNeg },
              { label: '股東權益(億)', key: '股東權益_億', cf: colorPos },
              { label: '現金(億)', key: '現金_億', cf: colorPos },
              { label: '存貨(億)', key: '存貨_億', cf: () => '#ccc' },
              { label: '每股淨值', key: '每股淨值', cf: colorPos },
              { label: '負債比率(%)', key: '負債比率', cf: colorNeg },
            ].map((row, i) => (
              <tr key={row.key} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontWeight: 600 }}>{row.label}</td>
                {qData.map(q => <td key={q['期別']} style={{ ...td, color: row.cf(q[row.key]) }}>{fmt(q[row.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 月營收 */}
      {sectionTitle('📅 月營收')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a', color: '#ddd' }}>
              <th style={th}>月份</th>
              <th style={th}>月營收(億)</th>
            </tr>
          </thead>
          <tbody>
            {mData.map((r, i) => (
              <tr key={r.period} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, color: '#f5c518' }}>{r.period}</td>
                <td style={{ ...td, color: '#ccc' }}>{(Number(r.revenue) / 100000).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 年度財務 */}
      {sectionTitle('📈 年度財務')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a', color: '#ddd' }}>
              <th style={{ ...th, textAlign: 'left' }}>年度</th>
              <th style={th}>營收(億)</th>
              <th style={th}>毛利(億)</th>
              <th style={th}>營業利益(億)</th>
              <th style={th}>稅後淨利(億)</th>
              <th style={th}>EPS</th>
              <th style={th}>營業CF(億)</th>
              <th style={th}>自由CF(億)</th>
            </tr>
          </thead>
          <tbody>
            {[...annual].reverse().map((r, i) => (
              <tr key={r.year} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, textAlign: 'left', color: '#f5c518' }}>{r.year}</td>
                <td style={{ ...td, color: '#ccc' }}>{fmt(r.revenue)}</td>
                <td style={{ ...td, color: colorPos(r.gross_profit) }}>{fmt(r.gross_profit)}</td>
                <td style={{ ...td, color: colorPos(r.op_income) }}>{fmt(r.op_income)}</td>
                <td style={{ ...td, color: colorPos(r.net_income) }}>{fmt(r.net_income)}</td>
                <td style={{ ...td, color: colorPos(r.eps) }}>{fmt(r.eps)}</td>
                <td style={{ ...td, color: colorPos(r.op_cashflow) }}>{fmt(r.op_cashflow)}</td>
                <td style={{ ...td, color: colorPos(r.free_cashflow) }}>{fmt(r.free_cashflow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 股利 */}
      {sectionTitle('💰 股利')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a', color: '#ddd' }}>
              <th style={{ ...th, textAlign: 'left' }}>年度</th>
              <th style={th}>現金股利</th>
              <th style={th}>EPS</th>
              <th style={th}>發放率(%)</th>
            </tr>
          </thead>
          <tbody>
            {dividend.map((r, i) => (
              <tr key={r.year} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, textAlign: 'left', color: '#f5c518' }}>{r.year}</td>
                <td style={{ ...td, color: colorPos(r.cash_dividend) }}>{fmt(r.cash_dividend)}</td>
                <td style={{ ...td, color: colorPos(r.eps_prev_year) }}>{fmt(r.eps_prev_year)}</td>
                <td style={{ ...td, color: '#ccc' }}>{fmt(r.payout_ratio_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #2a3a4a', color: '#ddd', whiteSpace: 'nowrap' };
const td = { padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid #1e2a3a', whiteSpace: 'nowrap' };
