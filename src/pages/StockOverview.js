import React, { useState, useEffect } from 'react';
import { getCompanyInfo, getQuarterly, getMonthly, getAnnual, getDividend, getEstEps, addWatchlist, removeWatchlist } from '../api';

const API_URL = 'https://stock-api-production-913a.up.railway.app';

export default function StockOverview({ ticker }) {
  const [info, setInfo] = useState(null);
  const [quarterly, setQuarterly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [annual, setAnnual] = useState([]);
  const [dividend, setDividend] = useState([]);
  const [estEps, setEstEps] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [closePrice, setClosePrice] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setClosePrice(null);
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
    fetch(`${API_URL}/api/company/${ticker}/close-price`)
      .then(r => r.json())
      .then(d => { if (d.close) setClosePrice(d); })
      .catch(() => {});
  }, [ticker]);

  if (!ticker) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
      <div style={{ fontSize: 18 }}>請從左側輸入股票代號或名稱</div>
    </div>
  );
  if (loading) return <div className="loading">⏳ 載入中...</div>;
  if (!info) return <div className="loading">找不到股票資料</div>;

  const qData = [...quarterly].sort((a, b) => b['期別'] > a['期別'] ? 1 : -1);
  const qHeaders = qData.map(r => r['期別']);
  const mData = [...monthly].sort((a, b) => b.period > a.period ? 1 : -1);
  const aData = [...annual].sort((a, b) => b.year > a.year ? 1 : -1);

  const fmt = (v, dec=2) => (v === '' || v == null || isNaN(Number(v))) ? '-' : Number(v).toFixed(dec);
  const fmtN = (v, dec=2) => (v === '' || v == null || isNaN(Number(v))) ? '-' : Number(v).toFixed(dec);
  const colorPos = (v) => (v === '' || v == null || isNaN(Number(v))) ? '#ccc' : Number(v) > 0 ? '#4ec94e' : Number(v) < 0 ? '#e05c5c' : '#ccc';
  const colorNeg = (v) => (v === '' || v == null || isNaN(Number(v))) ? '#ccc' : Number(v) > 0 ? '#e05c5c' : Number(v) < 0 ? '#4ec94e' : '#ccc';

  const sectionTitle = (title) => (
    <div style={{ background: '#1a2a3a', color: '#4C9BB8', padding: '8px 12px', fontWeight: 700, fontSize: 15, marginTop: 24, marginBottom: 4, borderLeft: '4px solid #4C9BB8' }}>
      {title}
    </div>
  );

  const renderQTable = (rows) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#1e2a3a' }}>
            <th style={{ ...th, textAlign: 'left', minWidth: 220 }}>項目</th>
            {qHeaders.map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
              <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontWeight: 600 }}>{row.label}</td>
              {qData.map(q => {
                const val = row.calc ? row.calc(q) : (row.key ? q[row.key] : null);
                return (
                  <td key={q['期別']} style={{ ...td, color: row.cf ? row.cf(val) : '#555' }}>
                    {fmt(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderATable = (rows) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#1e2a3a' }}>
            <th style={{ ...th, textAlign: 'left', minWidth: 220 }}>項目</th>
            {aData.map(r => <th key={r.year} style={th}>{r.year}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
              <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontWeight: 600 }}>{row.label}</td>
              {aData.map(r => {
                const val = row.key ? r[row.key] : null;
                return (
                  <td key={r.year} style={{ ...td, color: row.cf ? row.cf(val) : '#555' }}>
                    {fmt(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '8px' }}>
      {/* 標題 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a7a3a', marginBottom: 4 }}>
            {ticker} {info.name}
            {closePrice && <span style={{ fontSize: 18, color: '#c8a200', marginLeft: 16, fontWeight: 400 }}>
              收盤價 <b style={{ color: '#b8860b' }}>{closePrice.close}</b>
              <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{closePrice.date}</span>
            </span>}
          </h2>
          {info.sub_industry && <span style={{ background: '#2a3a4a', color: '#4C9BB8', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{info.sub_industry}</span>}
        </div>
        <button onClick={() => inWatchlist ? removeWatchlist(ticker).then(() => setInWatchlist(false)) : addWatchlist(ticker, info?.name || '').then(() => setInWatchlist(true))}
          style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #4C9BB8', background: inWatchlist ? '#4C9BB8' : 'transparent', color: inWatchlist ? '#fff' : '#4C9BB8', cursor: 'pointer', fontWeight: 600 }}>
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

      {/* ── 季度損益表 (圖2) ── */}
      {sectionTitle('📊 季度損益表（單位：億 / %）')}
      {renderQTable([
        { label: '營業收入(億)',      key: '營業收入_億',  cf: colorPos },
        { label: '營收年增率(%)',     key: '營收年增率',   cf: colorPos },
        { label: '毛利率(%)',         key: '毛利率',        cf: colorPos },
        { label: '營益率(%)',         key: '營益率',        cf: colorPos },
        { label: '稅前淨利率(%)',     key: '稅前淨利率',    cf: colorPos },
        { label: '稅後淨利率(%)',     key: '稅後淨利率',    cf: colorPos },
        { label: '每股盈餘(元)',      key: '每股盈餘',      cf: colorPos },
        { label: '銷貨成本率(%)',     key: null, calc: (q) => q['毛利率'] != null ? +(100 - q['毛利率']).toFixed(2) : null, cf: colorNeg },
        { label: '推銷費用率(%)',     key: '推銷費用率',    cf: colorNeg },
        { label: '管理費用率(%)',     key: '管理費用率',    cf: colorNeg },
        { label: '研發費用率(%)',     key: '研發費用率',    cf: colorNeg },
        { label: '營業費用率(%)',     key: '營業費用率',    cf: colorNeg },
      ])}

      {/* ── 季度資產負債表 (圖1) ── */}
      {sectionTitle('🏦 季度資產負債表（單位：億）')}
      {renderQTable([
        { label: '約當現金(億)',               key: '現金_億',           cf: colorPos },
        { label: '備供出售金融資產-流動(億)',  key: null,                cf: null },
        { label: '應收帳款(億)',               key: '應收帳款_億',       cf: () => '#ccc' },
        { label: '存貨(億)',                   key: '存貨_億',           cf: () => '#ccc' },
        { label: '備供出售金融資產-非流動(億)',key: null,                cf: null },
        { label: '採權益法之長期投資(億)',     key: '採權益法投資_億',   cf: () => '#ccc' },
        { label: '不動產機器設備(億)',         key: '不動產廠房設備_億', cf: () => '#ccc' },
        { label: '無形資產(億)',               key: null,                cf: null },
        { label: '資產總額(億)',               key: '資產總額_億',       cf: colorPos },
        { label: '短期借款(億)',               key: '短期借款_億',       cf: colorNeg },
        { label: '應付承兌匯票(億)',           key: null,                cf: null },
        { label: '合約負債(億)',               key: null,                cf: null },
        { label: '應付帳款(億)',               key: '應付帳款_億',       cf: () => '#ccc' },
        { label: '一年到期長期負債(億)',       key: null,                cf: null },
        { label: '應付公司債(億)',             key: null,                cf: null },
        { label: '長期借款(億)',               key: null,                cf: null },
        { label: '負債總額(億)',               key: '負債總額_億',       cf: colorNeg },
        { label: '股本(億)',                   key: '股本_億',           cf: () => '#ccc' },
        { label: '母公司股東權益(億)',         key: '股東權益_億',       cf: colorPos },
        { label: '土地(億)',                   key: null,                cf: null },
        { label: '廠房(億)',                   key: null,                cf: null },
        { label: '設備(億)',                   key: null,                cf: null },
        { label: '原料(億)',                   key: null,                cf: null },
        { label: '在製品(億)',                 key: null,                cf: null },
        { label: '製成品(億)',                 key: null,                cf: null },
        { label: '有息負債(億)',               key: null,                cf: null },
        { label: '財務透明度',                key: null,                cf: null },
        { label: '應收帳款週轉天數',           key: null,                cf: null },
        { label: '存貨週轉天數',               key: null,                cf: null },
      ])}

      {/* ── 季度現金流量表 (圖3) ── */}
      {sectionTitle('💵 季度現金流量表（單位：億）')}
      {renderQTable([
        { label: '稅前淨利(億)',               key: '稅前淨利_億',       cf: colorPos },
        { label: '應收帳款(增)減(億)',         key: null,                cf: null },
        { label: '存貨(增)減(億)',             key: null,                cf: null },
        { label: '應付帳款增(減)(億)',         key: null,                cf: null },
        { label: '營業活動現金流入(出)(億)',   key: '營業CF_億',         cf: colorPos },
        { label: '(買)賣擁銷後金融資產(億)',  key: null,                cf: null },
        { label: '購置不動產設備(億)',         key: '購置不動產設備_億', cf: colorNeg },
        { label: '處分不動產設備(億)',         key: null,                cf: null },
        { label: '投資活動現金流入(出)(億)',   key: '投資CF_億',         cf: () => '#ccc' },
        { label: '支付現金股利(億)',           key: null,                cf: null },
        { label: '短期借款增(減)(億)',         key: null,                cf: null },
        { label: '應付票券增(減)(億)',         key: null,                cf: null },
        { label: '發行公司債(億)',             key: null,                cf: null },
        { label: '舉借長期借款(億)',           key: null,                cf: null },
        { label: '償還長期借款(億)',           key: null,                cf: null },
        { label: '現金增資(億)',               key: null,                cf: null },
        { label: '籌資活動現金流入(出)(億)',   key: '籌資CF_億',         cf: () => '#ccc' },
        { label: '自由現金流量(億)',           key: '自由CF_億',         cf: colorPos },
        { label: '餘絀現金流量(億)',           key: '餘絀CF_億',         cf: colorPos },
        { label: '盈餘含金量(營業CF/稅前淨利%)', key: '盈餘含金量',     cf: colorPos },
      ])}

      {/* ── 年度財務 (圖4) ── */}
      {sectionTitle('📈 年度財務（單位：億）')}
      {renderATable([
        { label: '資產總額(億)',               key: 'total_assets',      cf: colorPos },
        { label: '負債總額(億)',               key: 'total_liab',        cf: colorNeg },
        { label: '母公司股東權益總額(億)',     key: 'total_equity',      cf: colorPos },
        { label: '股本(億)',                   key: 'common_stock',      cf: () => '#ccc' },
        { label: '營業收入(億)',               key: 'revenue',           cf: () => '#ccc' },
        { label: '銷貨成本(億)',               key: 'cost',              cf: colorNeg },
        { label: '營業毛利(億)',               key: 'gross_profit',      cf: colorPos },
        { label: '營業費用(億)',               key: 'op_expense',        cf: colorNeg },
        { label: '營業利益(億)',               key: 'op_income',         cf: colorPos },
        { label: '營外收支(億)',               key: 'non_op_income',     cf: colorPos },
        { label: '稅前淨利(億)',               key: 'pretax_income',     cf: colorPos },
        { label: '母公司淨利(億)',             key: 'net_income',        cf: colorPos },
        { label: '每股盈餘(元)',               key: 'eps',               cf: colorPos },
        { label: '營業活動現金流入(出)(億)',   key: 'op_cashflow',       cf: colorPos },
        { label: '投資活動現金流入(出)(億)',   key: 'inv_cashflow',      cf: () => '#ccc' },
        { label: '籌資活動現金流入(出)(億)',   key: 'fin_cashflow',      cf: () => '#ccc' },
        { label: '支付現金股利(億)',           key: null,                cf: null },
        { label: '自由現金流量(億)',           key: 'free_cashflow',     cf: colorPos },
        { label: '餘絀現金流量(億)',           key: 'surplus_cf',        cf: colorPos },
        { label: '業外收支/營收(%)',           key: 'non_op_rev_ratio',  cf: colorPos },
      ])}

      {/* ── 月營收 ── */}
      {sectionTitle('📅 月營收')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a' }}>
              <th style={{ ...th, textAlign: 'left', minWidth: 220 }}>項目</th>
              {mData.map(r => <th key={r.period} style={th}>{r.period}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: '月營收(億)',               fn: (r) => fmtN(Number(r.revenue)/100000), cf: () => '#ccc' },
              { label: '與上月營收成長(%)',         fn: (r) => r.mom_pct != null ? Number(r.mom_pct) : null, cf: colorPos },
              { label: '營收年增率(%)',             fn: (r) => r.yoy_pct != null ? Number(r.yoy_pct) : null, cf: colorPos },
              { label: '累計營收年增率(%)',         fn: (r) => r.cum_yoy_pct != null ? Number(r.cum_yoy_pct) : null, cf: colorPos },
              { label: '近3個月累計營收年增率(%)',  fn: (r) => r.cum_3m_pct != null ? Number(r.cum_3m_pct) : null, cf: colorPos },
              { label: '近12個月累計營收年增率(%)', fn: (r) => r.cum_12m_pct != null ? Number(r.cum_12m_pct) : null, cf: colorPos },
            ].map((row, ri) => (
              <tr key={row.label} style={{ background: ri % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontWeight: 600 }}>{row.label}</td>
                {mData.map((r, i) => {
                  const val = row.fn(r, i);
                  const display = val == null ? '-' : (typeof val === 'string' ? val : val.toFixed(2) + (row.label.includes('億') ? '' : '%'));
                  return <td key={r.period} style={{ ...td, color: val == null ? '#666' : row.cf(val) }}>{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 股利 ── */}
      {sectionTitle('💰 股利')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e2a3a' }}>
              <th style={{ ...th, textAlign: 'left', minWidth: 220 }}>項目</th>
              {dividend.map(r => <th key={r.year} style={th}>{r.year}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: '現金股利',  key: 'cash_dividend',    cf: colorPos },
              { label: 'EPS',       key: 'eps_prev_year',    cf: colorPos },
              { label: '發放率(%)', key: 'payout_ratio_pct', cf: () => '#ccc' },
            ].map((row, i) => (
              <tr key={row.key} style={{ background: i % 2 === 0 ? '#151f2e' : '#1a2535' }}>
                <td style={{ ...td, textAlign: 'left', color: '#f5c518', fontWeight: 600 }}>{row.label}</td>
                {dividend.map(r => (
                  <td key={r.year} style={{ ...td, color: row.cf(r[row.key]) }}>{fmt(r[row.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #2a3a4a', color: '#ddd', whiteSpace: 'nowrap', background: '#1e2a3a' };
const td = { padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid #1e2a3a', whiteSpace: 'nowrap' };
