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
  const [activeTab, setActiveTab] = useState('quarterly');

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

  // 季度資料（最近16季，由新到舊）
  const qData = [...quarterly].sort((a, b) => b['期別'] > a['期別'] ? 1 : -1);
  const qShow = qData.slice(0, 16);
  const qHeaders = qShow.map(r => r['期別']);

  // 月營收（最近24個月）
  const mData = [...monthly].sort((a, b) => b.period > a.period ? 1 : -1).slice(0, 24);

  const fmt = (v, dec=2) => (v === '' || v == null || isNaN(Number(v))) ? '-' : Number(v).toFixed(dec);
  const fmtPct = (v) => (v === '' || v == null || isNaN(Number(v))) ? '-' : Number(v).toFixed(2) + '%';
  const color = (v) => (v === '' || v == null || isNaN(Number(v))) ? '#ccc' : Number(v) > 0 ? '#e05c5c' : Number(v) < 0 ? '#4ec94e' : '#ccc';
  const colorPos = (v) => (v === '' || v == null || isNaN(Number(v))) ? '#ccc' : Number(v) > 0 ? '#4ec94e' : Number(v) < 0 ? '#e05c5c' : '#ccc';

  const tabs = ['quarterly', 'monthly', 'annual', 'dividend'];
  const tabLabels = { quarterly: '季度財務', monthly: '月營收', annual: '年度財務', dividend: '股利' };

  return (
    <div style={{ padding: '8px' }}>
      {/* 標題 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{ticker} {info.name}</h2>
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

      {/* Tab */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: activeTab === t ? '#4C9BB8' : '#2a3a4a', color: '#fff', fontSize: 13, fontWeight: activeTab === t ? 700 : 400 }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* 季度財務 */}
      {activeTab === 'quarterly' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1e2a3a' }}>
                <th style={{ ...th, textAlign: 'left', minWidth: 140 }}>項目</th>
                {qHeaders.map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: '營業收入(億)', key: '營業收入_億', color: 'pos' },
                { label: '毛利率(%)', key: '毛利率', color: 'pos' },
                { label: '營益率(%)', key: '營益率', color: 'pos' },
                { label: '業外收支率(%)', key: '業外收支率', color: 'pos' },
                { label: '稅前淨利率(%)', key: '稅前淨利率', color: 'pos' },
                { label: '稅後淨利率(%)', key: '稅後淨利率', color: 'pos' },
                { label: '每股盈餘(元)', key: '每股盈餘', color: 'pos' },
                { label: '推銷費用率(%)', key: '推銷費用率', color: 'neg' },
                { label: '管理費用率(%)', key: '管理費用率', color: 'neg' },
                { label: '研發費用率(%)', key: '研發費用率', color: 'neg' },
                { label: '營收年增率(%)', key: '營收年增率', color: 'pos' },
                { label: '─────────', key: null },
                { label: '資產總額(億)', key: '資產總額_億', color: 'pos' },
                { label: '負債總額(億)', key: '負債總額_億', color: 'neg' },
                { label: '股東權益(億)', key: '股東權益_億', color: 'pos' },
                { label: '現金(億)', key: '現金_億', color: 'pos' },
                { label: '存貨(億)', key: '存貨_億', color: 'neutral' },
                { label: '每股淨值', key: '每股淨值', color: 'pos' },
                { label: '負債比率(%)', key: '負債比率', color: 'neg' },
              ].map((row, i) => {
                if (!row.key) return (
                  <tr key={i} style={{ background: '#0d1822' }}>
                    <td colSpan={qHeaders.length + 1} style={{ padding: '4px 12px', color: '#333', fontSize: 11 }}>{row.label}</td>
                  </tr>
                );
                return (
                  <tr key={row.key} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                    <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontWeight: 600 }}>{row.label}</td>
                    {qShow.map(q => {
                      const v = q[row.key];
                      const c = row.color === 'pos' ? colorPos(v) : row.color === 'neg' ? color(v) : '#ccc';
                      return <td key={q['期別']} style={{ ...td, color: c }}>{fmt(v)}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 月營收 */}
      {activeTab === 'monthly' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1e2a3a', color: '#ddd' }}>
                <th style={th}>月份</th>
                <th style={th}>月營收(億)</th>
                <th style={th}>月增率(%)</th>
                <th style={th}>年增率(%)</th>
              </tr>
            </thead>
            <tbody>
              {mData.map((r, i) => {
                const rev = Number(r.revenue) / 100000;
                return (
                  <tr key={r.period} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                    <td style={{ ...td, color: '#f5c518' }}>{r.period}</td>
                    <td style={{ ...td, color: '#ccc' }}>{rev.toFixed(2)}</td>
                    <td style={{ ...td, color: '#ccc' }}>-</td>
                    <td style={{ ...td, color: '#ccc' }}>-</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 年度財務 */}
      {activeTab === 'annual' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1e2a3a', color: '#ddd' }}>
                <th style={{ ...th, textAlign: 'left' }}>年度</th>
                <th style={th}>營業收入(億)</th>
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
      )}

      {/* 股利 */}
      {activeTab === 'dividend' && (
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
      )}
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #2a3a4a', color: '#ddd', whiteSpace: 'nowrap' };
const td = { padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid #1e2a3a', whiteSpace: 'nowrap' };
