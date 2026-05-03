import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reportDate, setReportDate] = useState('');
  const reportDateRef = React.useRef('');

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setClosePrice(null);
    setAiReport('');
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
          <tr style={{ background: '#070a0f' }}>
            <th style={{ ...th, textAlign: 'left', minWidth: 220 }}>項目</th>
            {qHeaders.map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#080b10' : '#070a0e' }}>
              <td style={{ ...td, textAlign: 'left', color: '#90c0dc', fontWeight: 600, ...(row.sep ? { borderBottom: '2px solid #ffffff' } : {}) }}>{row.label}</td>
              {qData.map(q => {
                const val = row.calc ? row.calc(q) : (row.key ? q[row.key] : null);
                const sepStyle = row.sep ? { borderBottom: '2px solid #ffffff' } : {};
                return (
                  <td key={q['期別']} style={{ ...td, ...sepStyle, color: row.cf ? row.cf(val) : '#555' }}>
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
          <tr style={{ background: '#070a0f' }}>
            <th style={{ ...th, textAlign: 'left', minWidth: 220 }}>項目</th>
            {aData.map(r => <th key={r.year} style={th}>{r.year}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#080b10' : '#070a0e' }}>
              <td style={{ ...td, textAlign: 'left', color: '#8ab8d0', fontWeight: 500, ...(row.sep ? { borderBottom: '2px solid #ffffff' } : {}) }}>{row.label}</td>
              {aData.map(r => {
                const val = row.key ? r[row.key] : null;
                const sepStyle = row.sep ? { borderBottom: '2px solid #ffffff' } : {};
                return (
                  <td key={r.year} style={{ ...td, ...sepStyle, color: row.cf ? row.cf(val) : '#555' }}>
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
            {closePrice && <span style={{ fontSize: 26, color: '#8B0000', marginLeft: 48, fontWeight: 400 }}>
              <span style={{ color: '#7a9ab8', fontSize: 13, marginRight: 6 }}>收盤價</span><b style={{ color: '#991b1b', fontSize: 42, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{closePrice.close}</b>
              <span style={{ fontSize: 18, color: '#8B0000', marginLeft: 12 }}>{closePrice.date}</span>
            </span>}
          </h2>
          {info.sub_industry && <span style={{ background: '#2a3a4a', color: '#4C9BB8', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{info.sub_industry}</span>}
          {info.product_mix && (
            <div style={{ color: '#90c8e8', fontSize: 11, marginTop: 4, lineHeight: 1.7, maxWidth: 900 }}>
              【{info.product_mix}】
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={async () => {
              setAiLoading(true); setAiReport('');
              const d=new Date();
              const ds=`${d.getFullYear()}年${String(d.getMonth()+1).padStart(2,'0')}月${String(d.getDate()).padStart(2,'0')}日`;
              reportDateRef.current = ds;
              setReportDate(ds);
              try {
                const res = await fetch(`${API_URL}/api/company/${ticker}/analysis`, { method: 'POST' });
                const data = await res.json();
                setAiReport(data.ok ? data.report : ('錯誤：' + data.error));
              } catch(e) { setAiReport('連線失敗：' + e.message); }
              setAiLoading(false);
            }}
            disabled={aiLoading}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #f5c518', background: aiLoading ? '#1a2a3c' : 'linear-gradient(135deg,#2e5872,#4080a0)', color: '#eef8ff', cursor: aiLoading ? 'default' : 'pointer', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: "'Rajdhani',sans-serif", letterSpacing: 2 }}>
            {aiLoading ? '⏳ 健診中...' : '🤖 AI個股財務健診'}
          </button>
          <button onClick={() => inWatchlist ? removeWatchlist(ticker).then(() => setInWatchlist(false)) : addWatchlist(ticker, info?.name || '').then(() => setInWatchlist(true))}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #2a4060', background: inWatchlist ? '#1e3a52' : 'transparent', color: inWatchlist ? '#90c0dc' : '#6a98b8', cursor: 'pointer', fontWeight: 600 }}>
            {inWatchlist ? '★ 已追蹤' : '☆ 加入追蹤'}
          </button>
        </div>
      </div>

      {/* 財務摘要列 */}
      {(() => {
        const q0 = qData[0] || {};
        const q4eps = qData.slice(0,4).reduce((s,q) => s + (Number(q['每股盈餘']) || 0), 0);
        const te = q0['股東權益_億']; const cs = q0['股本_億'];
        const bv = (te && cs && cs !== 0) ? te / cs * 10 : null;
        const cp = closePrice ? Number(closePrice.close) : null;
        const pe = (cp && q4eps && q4eps > 0) ? (cp / q4eps).toFixed(1) : null;
        const pb = (cp && bv) ? (cp / bv).toFixed(2) : null;
        const m0 = mData[0] || {};

        const C = ({ label, value, color, big }) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px', borderRight: '1px solid #0f1c2a', minWidth: 90 }}>
            <span style={{ color: '#8ab8d0', fontSize: 9, marginBottom: 4, whiteSpace: 'nowrap', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>{label}</span>
            <span style={{ color: color || '#8ab0cc', fontWeight: big ? 600 : 500, fontSize: big ? 16 : 14, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono',monospace" }}>{value ?? '-'}</span>
          </div>
        );

        return (
          <div style={{ background: '#080b10', borderRadius: 0, marginBottom: 1, overflow: 'hidden', borderBottom: '1px solid #1a2a3c' }}>
            {/* 第一行：現況 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #2a3a4a', padding: '4px 0' }}>
              <C label="最近4季EPS" value={q4eps ? q4eps.toFixed(2) : '-'} color="#c0e0f8" big />
              <C label="最近1季毛利率" value={q0['毛利率'] != null ? q0['毛利率']+'%' : '-'} color="#4ec94e" />
              <C label="最近1季營益率" value={q0['營益率'] != null ? q0['營益率']+'%' : '-'} color="#4ec94e" />
              <C label="最近1季營收年增率" value={q0['營收年增率'] != null ? q0['營收年增率']+'%' : '-'} color={Number(q0['營收年增率']) >= 0 ? '#4ec94e' : '#e05c5c'} />
              <C label="最近1月營收年增率" value={m0.yoy_pct != null ? Number(m0.yoy_pct).toFixed(1)+'%' : '-'} color={Number(m0.yoy_pct) >= 0 ? '#4ec94e' : '#e05c5c'} />
              <C label="目前本益比" value={pe ? pe+'x' : '-'} color="#c8a200" />
              <C label="股價淨值比" value={pb ? pb+'x' : '-'} color="#c8a200" />
            </div>
            {/* 第二行：預估 */}
            {estEps && (
              <div style={{ display: 'flex', flexWrap: 'wrap', padding: '4px 0', background: '#060910' }}>
                <div style={{ color: '#7aaac8', fontSize: 9, padding: '8px 12px', display: 'flex', alignItems: 'center', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 2 }}>🔮 預估</div>
                <C label="預估未來1季毛利率" value={estEps.est_gpm != null ? estEps.est_gpm+'%' : '-'} color="#7ec8e3" />
                <C label="預估未來1季營益率" value={estEps.est_opi != null ? estEps.est_opi+'%' : '-'} color="#7ec8e3" />
                <C label="預估未來1季EPS" value={estEps.est_eps ?? '-'} color="#c0e0f8" big />
                <C label="預估未來4季EPS" value={estEps.est_eps_4q ?? '-'} color="#c0e0f8" big />
                {(() => {
                  const eps3q = qData.slice(1,4).reduce((s,q) => s+(Number(q['每股盈餘'])||0), 0);
                  const base1q = eps3q + (estEps.est_eps || 0);
                  const pe1q = (cp && base1q > 0) ? (cp/base1q).toFixed(1)+'x' : '-';
                  const pe4q = (cp && estEps.est_eps_4q > 0) ? (cp/estEps.est_eps_4q).toFixed(1)+'x' : '-';
                  return (<>
                    <C label="預估未來1季本益比" value={pe1q} color="#c8a200" />
                    <C label="預估未來4季本益比" value={pe4q} color="#c8a200" />
                  </>);
                })()}
                <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', flex: 1 }}>
                  <span style={{ color: '#8ab8d0', fontSize: 9, lineHeight: 1.5 }}>
                    ⚠️ 本預估數據係依財務數據邏輯推演，僅供投資參考。<br/>預估結果不代表實際績效，投資人應審慎判斷，自負盈虧。
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })()}


      {/* ── AI 分析報告 ── */}
      {(aiReport || aiLoading) && (
        <div style={{ background: '#070a0f', border: '1px solid #1a2a3c', borderRadius: 0, padding: '20px 24px', marginBottom: 1 }}>
          {(() => {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth()+1).padStart(2,'0');
            const d = String(now.getDate()).padStart(2,'0');
            return (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
                <span style={{ color: '#a8d0e8', fontWeight: 700, fontSize: 15, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 2 }}>🤖 AI個股財務健診報告</span>
                <span style={{ color: '#6a98b8', fontSize: 12 }}>（報告日期：{y}年{m}月{d}日）</span>
              </div>
            );
          })()}
          {aiLoading ? (
            <div style={{ color: '#aaa', textAlign: 'center', padding: 32 }}>⏳ AI 正在分析中，約需 30-60 秒...</div>
          ) : (
            <div style={{ color: '#b8d4e8', fontSize: 15, lineHeight: 2.0, whiteSpace: 'pre-wrap' }}>
              {aiReport}
            </div>
          )}
          {!aiLoading && aiReport && (
            <button onClick={() => setAiReport('')}
              style={{ marginTop: 12, padding: '4px 14px', borderRadius: 6, border: '1px solid #555', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 12 }}>
              ✕ 關閉報告
            </button>
          )}
        </div>
      )}

      {/* ── 圖表區 ── */}
      {qData.length > 0 && (() => {
        // 圖表資料：由舊到新
        const chartData = [...qData].reverse().map(q => ({
          期別: q['期別'],
          營業收入: q['營業收入_億'],
          毛利率: q['毛利率'],
          營益率: q['營益率'],
          稅前淨利率: q['稅前淨利率'],
          推銷費用率: q['推銷費用率'],
          管理費用率: q['管理費用率'],
          研發費用率: q['研發費用率'],
          不透明資產: (() => {
            const a = q['備供出售流動_億'] || 0;
            const b = q['備供出售非流動_億'] || 0;
            const c = q['採權益法投資_億'] || 0;
            const d = q['無形資產_億'] || 0;
            return +(a+b+c+d).toFixed(2);
          })(),
          財務透明度: q['財務透明度'],
          稅前淨利億: q['稅前淨利_億'] ?? null,
          營業CF億: q['營業CF_億'] ?? null,
          餘絀CF億: q['餘絀CF_億'] ?? null,
          有息負債億: q['有息負債_億'] ?? null,
          存貨億: q['存貨_億'] ?? null,
          不動產設備億: q['不動產廠房設備_億'] ?? null,
          無形資產億: q['無形資產_億'] ?? null,
        }));

        const chartStyle = { background: '#080b10', padding: '10px', marginBottom: 1 };
        const chartTitle = (t) => <div style={{ color: '#8abcd8', fontWeight: 600, fontSize: 9, marginBottom: 6, paddingLeft: 4, letterSpacing: '2.5px', fontFamily: "'Rajdhani',sans-serif", display:'flex', alignItems:'center', gap:6 }}><span style={{display:'inline-block',width:14,height:1,background:'linear-gradient(90deg,#80b0d0,transparent)'}}></span>{t.toUpperCase()}</div>;
        const TT = ({ active, payload, label }) => active && payload?.length ? (
          <div style={{ background: '#0d1828', border: '1px solid #1e3040', borderRadius: 0, padding: '8px 12px', fontSize: 12 }}>
            <div style={{ color: '#90c0dc', marginBottom: 4, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1 }}>{label}</div>
            {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value != null ? p.value.toFixed(2) : '-'}</div>)}
          </div>
        ) : null;

        return (
          <div style={{ marginBottom: 8 }}>
            {/* 排1：獲利能力 + 費用率 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ ...chartStyle, flex: 1, minWidth: 0 }}>
                {chartTitle('📊 營業收入（億）vs 獲利能力（%）')}
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis dataKey="期別" tick={{ fill: '#aaa', fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#aaa', fontSize: 9 }} width={40} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#aaa', fontSize: 9 }} unit="%" width={36} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                    <Bar yAxisId="left" dataKey="營業收入" fill="#4C9BB8" opacity={0.8} name="營業收入(億)" />
                    <Line yAxisId="right" type="monotone" dataKey="毛利率" stroke="#4ec94e" strokeWidth={2} dot={false} name="毛利率%" />
                    <Line yAxisId="right" type="monotone" dataKey="營益率" stroke="#f5c518" strokeWidth={2} dot={false} name="營益率%" />
                    <Line yAxisId="right" type="monotone" dataKey="稅前淨利率" stroke="#ff7f50" strokeWidth={2} dot={false} name="稅前淨利率%" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...chartStyle, flex: 1, minWidth: 0 }}>
                {chartTitle('📊 營業收入（億）vs 費用率（%）')}
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis dataKey="期別" tick={{ fill: '#aaa', fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#aaa', fontSize: 9 }} width={40} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#aaa', fontSize: 9 }} unit="%" width={36} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                    <Bar yAxisId="left" dataKey="營業收入" fill="#4C9BB8" opacity={0.8} name="營業收入(億)" />
                    <Line yAxisId="right" type="monotone" dataKey="推銷費用率" stroke="#e05c5c" strokeWidth={2} dot={false} name="推銷費用率%" />
                    <Line yAxisId="right" type="monotone" dataKey="管理費用率" stroke="#ff9f40" strokeWidth={2} dot={false} name="管理費用率%" />
                    <Line yAxisId="right" type="monotone" dataKey="研發費用率" stroke="#b87fdb" strokeWidth={2} dot={false} name="研發費用率%" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* 排2：不透明資產 + 稅前淨利/營業CF */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ ...chartStyle, flex: 1, minWidth: 0 }}>
                {chartTitle('📊 不透明資產合計（億）vs 財務透明度（%）')}
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis dataKey="期別" tick={{ fill: '#aaa', fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#aaa', fontSize: 9 }} width={40} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#aaa', fontSize: 9 }} unit="%" domain={[0, 100]} width={36} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                    <Bar yAxisId="left" dataKey="不透明資產" fill="#e05c5c" opacity={0.8} name="不透明資產合計(億)" />
                    <Line yAxisId="right" type="monotone" dataKey="財務透明度" stroke="#4ec94e" strokeWidth={2} dot={false} name="財務透明度%" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...chartStyle, flex: 1, minWidth: 0 }}>
                {chartTitle('📊 稅前淨利 vs 營業活動現金流（億）')}
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis dataKey="期別" tick={{ fill: '#aaa', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#aaa', fontSize: 9 }} width={44} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                    <Bar dataKey="稅前淨利億" fill="#f5c518" opacity={0.85} name="稅前淨利(億)" />
                    <Bar dataKey="營業CF億" fill="#4C9BB8" opacity={0.85} name="營業活動現金(億)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* 排3：餘絀現金+有息負債 + 資產結構 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ ...chartStyle, flex: 1, minWidth: 0 }}>
                {chartTitle('📊 餘絀現金（億）vs 有息負債（億）')}
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis dataKey="期別" tick={{ fill: '#aaa', fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#aaa', fontSize: 9 }} width={44} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#aaa', fontSize: 9 }} width={44} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                    <Bar yAxisId="left" dataKey="餘絀CF億" fill="#4ec94e" opacity={0.85} name="餘絀現金(億)" />
                    <Line yAxisId="right" type="monotone" dataKey="有息負債億" stroke="#e05c5c" strokeWidth={2} dot={false} name="有息負債(億)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...chartStyle, flex: 1, minWidth: 0 }}>
                {chartTitle('📊 資產結構（億）vs 營業收入（億）')}
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis dataKey="期別" tick={{ fill: '#aaa', fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#aaa', fontSize: 9 }} width={44} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#aaa', fontSize: 9 }} width={44} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                    <Bar yAxisId="left" dataKey="存貨億" fill="#ff9f40" opacity={0.8} name="存貨(億)" />
                    <Bar yAxisId="left" dataKey="不動產設備億" fill="#4C9BB8" opacity={0.8} name="不動產機器設備(億)" />
                    <Bar yAxisId="left" dataKey="無形資產億" fill="#b87fdb" opacity={0.8} name="無形資產(億)" />
                    <Line yAxisId="right" type="monotone" dataKey="營業收入" stroke="#f5c518" strokeWidth={2} dot={false} name="營業收入(億)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 月營收圖表 ── */}
      {mData.length > 0 && (() => {
        const monthlyChart = [...mData].reverse().map(r => ({
          月份: r.period,
          月營收: r.revenue ? +(r.revenue/100000).toFixed(2) : null,
          營收年增率: r.yoy_pct != null ? +Number(r.yoy_pct).toFixed(1) : null,
          近3月累計年增率: r.cum_3m_pct != null ? +Number(r.cum_3m_pct).toFixed(1) : null,
          近12月累計年增率: r.cum_12m_pct != null ? +Number(r.cum_12m_pct).toFixed(1) : null,
        }));

        // 月營收標題含最新數值和環比箭頭
        const m0 = mData[0] || {}, m1 = mData[1] || {};
        const rev0 = m0.revenue ? +(m0.revenue/100000).toFixed(2) : null;
        const rev1 = m1.revenue ? +(m1.revenue/100000).toFixed(2) : null;
        const revArrow = (rev0 && rev1) ? (rev0 > rev1 ? '▲' : rev0 < rev1 ? '▼' : '─') : '';
        const revColor = revArrow === '▲' ? '#4ec94e' : revArrow === '▼' ? '#e05c5c' : '#888';
        const yoy0 = m0.yoy_pct != null ? +Number(m0.yoy_pct).toFixed(1) : null;
        const yoy1 = m1.yoy_pct != null ? +Number(m1.yoy_pct).toFixed(1) : null;
        const yoyArrow = (yoy0 != null && yoy1 != null) ? (yoy0 > yoy1 ? '▲' : yoy0 < yoy1 ? '▼' : '─') : '';
        const yoyColor = yoyArrow === '▲' ? '#4ec94e' : yoyArrow === '▼' ? '#e05c5c' : '#888';
        const c3m0 = m0.cum_3m_pct != null ? +Number(m0.cum_3m_pct).toFixed(1) : null;
        const c3m1 = m1.cum_3m_pct != null ? +Number(m1.cum_3m_pct).toFixed(1) : null;
        const c3mArrow = (c3m0 != null && c3m1 != null) ? (c3m0 > c3m1 ? '▲' : c3m0 < c3m1 ? '▼' : '─') : '';
        const c3mColor = c3mArrow === '▲' ? '#4ec94e' : c3mArrow === '▼' ? '#e05c5c' : '#888';
        const c12m0 = m0.cum_12m_pct != null ? +Number(m0.cum_12m_pct).toFixed(1) : null;
        const c12m1 = m1.cum_12m_pct != null ? +Number(m1.cum_12m_pct).toFixed(1) : null;
        const c12mArrow = (c12m0 != null && c12m1 != null) ? (c12m0 > c12m1 ? '▲' : c12m0 < c12m1 ? '▼' : '─') : '';
        const c12mColor = c12mArrow === '▲' ? '#4ec94e' : c12mArrow === '▼' ? '#e05c5c' : '#888';

        const chartStyle2 = { background: '#060910', borderRadius: 8, padding: '16px 8px', marginBottom: 16 };
        const TT2 = ({ active, payload, label }) => active && payload?.length ? (
          <div style={{ background: '#0d1828', border: '1px solid #1e3040', borderRadius: 0, padding: '8px 12px', fontSize: 12 }}>
            <div style={{ color: '#90c0dc', marginBottom: 4, fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1 }}>{label}</div>
            {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value != null ? p.value : '-'}</div>)}
          </div>
        ) : null;
        return (
          <div style={chartStyle2}>
            <div style={{ paddingLeft: 8, marginBottom: 8 }}>
                  <span style={{ color: '#4C9BB8', fontWeight: 700, fontSize: 13 }}>📅 </span>
                  <span style={{ color: '#4C9BB8', fontWeight: 700, fontSize: 13 }}>月營收 </span>
                  {rev0 != null && <span style={{ fontSize: 12 }}><span style={{ color: '#ddd' }}>{rev0}億 </span><span style={{ color: revColor, fontWeight: 700 }}>{revArrow}</span></span>}
                  <span style={{ color: '#90bcd8', fontSize: 12 }}> ｜ 年增率 </span>
                  {yoy0 != null && <span style={{ fontSize: 12 }}><span style={{ color: '#f5c518' }}>{yoy0}% </span><span style={{ color: yoyColor, fontWeight: 700 }}>{yoyArrow}</span></span>}
                  <span style={{ color: '#90bcd8', fontSize: 12 }}> ｜ 近3月 </span>
                  {c3m0 != null && <span style={{ fontSize: 12 }}><span style={{ color: '#4ec94e' }}>{c3m0}% </span><span style={{ color: c3mColor, fontWeight: 700 }}>{c3mArrow}</span></span>}
                  <span style={{ color: '#90bcd8', fontSize: 12 }}> ｜ 近12月 </span>
                  {c12m0 != null && <span style={{ fontSize: 12 }}><span style={{ color: '#ff7f50' }}>{c12m0}% </span><span style={{ color: c12mColor, fontWeight: 700 }}>{c12mArrow}</span></span>}
                </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={monthlyChart} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                <XAxis dataKey="月份" tick={{ fill: '#aaa', fontSize: 9 }} interval={2} />
                <YAxis yAxisId="left" tick={{ fill: '#aaa', fontSize: 9 }} width={44} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#aaa', fontSize: 9 }} unit="%" width={40} />
                <Tooltip content={<TT2 />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                <Bar yAxisId="left" dataKey="月營收" fill="#4C9BB8" opacity={0.8} name="月營收(億)" />
                <Line yAxisId="right" type="monotone" dataKey="營收年增率" stroke="#f5c518" strokeWidth={2} dot={false} name="營收年增率%" />
                <Line yAxisId="right" type="monotone" dataKey="近3月累計年增率" stroke="#4ec94e" strokeWidth={2} dot={false} name="近3月累計%" />
                <Line yAxisId="right" type="monotone" dataKey="近12月累計年增率" stroke="#ff7f50" strokeWidth={2} dot={false} name="近12月累計%" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* ── 季度損益表 (圖2) ── */}
      {sectionTitle('📊 季度損益表（單位：億 / %）')}
      {renderQTable([
        { label: '營業收入(億)',      key: '營業收入_億',  cf: colorPos },
        { label: '營收年增率(%)',     key: '營收年增率',   cf: colorPos },
        { label: '毛利率(%)',         key: '毛利率',        cf: colorPos },
        { label: '營益率(%)',         key: '營益率',        cf: colorPos },
        { label: '稅前淨利率(%)',     key: '稅前淨利率',    cf: colorPos },
        { label: '稅後淨利率(%)',     key: '稅後淨利率',    cf: colorPos },
        { label: '每股盈餘(元)',      key: '每股盈餘',      cf: colorPos, sep: true },
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
        { label: '備供出售金融資產-流動(億)',  key: '備供出售流動_億',    cf: () => '#ccc' },
        { label: '應收帳款(億)',               key: '應收帳款_億',       cf: () => '#ccc' },
        { label: '存貨(億)',                   key: '存貨_億',           cf: () => '#ccc' },
        { label: '備供出售金融資產-非流動(億)',key: '備供出售非流動_億',  cf: () => '#ccc' },
        { label: '採權益法之長期投資(億)',     key: '採權益法投資_億',   cf: () => '#ccc' },
        { label: '不動產機器設備(億)',         key: '不動產廠房設備_億', cf: () => '#ccc' },
        { label: '無形資產(億)',               key: '無形資產_億',        cf: () => '#ccc' },
        { label: '資產總額(億)',               key: '資產總額_億',       cf: colorPos, sep: true },
        { label: '短期借款(億)',               key: '短期借款_億',       cf: colorNeg },
        { label: '應付承兌匯票(億)',           key: '應付承兌匯票_億',    cf: colorNeg },
        { label: '合約負債(億)',               key: '合約負債_億',        cf: () => '#ccc' },
        { label: '應付帳款(億)',               key: '應付帳款_億',       cf: () => '#ccc' },
        { label: '一年到期長期負債(億)',       key: '一年到期長期負債_億', cf: colorNeg },
        { label: '應付公司債(億)',             key: '應付公司債_億',      cf: colorNeg },
        { label: '長期借款(億)',               key: '長期借款_億',        cf: colorNeg },
        { label: '負債總額(億)',               key: '負債總額_億',       cf: colorNeg, sep: true },
        { label: '股本(億)',                   key: '股本_億',           cf: () => '#ccc' },
        { label: '母公司股東權益(億)',         key: '股東權益_億',       cf: colorPos },
        { label: '土地(億)',                   key: '土地_億',            cf: () => '#ccc' },
        { label: '廠房(億)',                   key: '廠房_億',            cf: () => '#ccc' },
        { label: '設備(億)',                   key: '設備_億',            cf: () => '#ccc', sep: true },
        { label: '原料(億)',                   key: '原料_億',            cf: () => '#ccc' },
        { label: '在製品(億)',                 key: '在製品_億',          cf: () => '#ccc' },
        { label: '製成品(億)',                 key: '製成品_億',          cf: () => '#ccc', sep: true },
        { label: '有息負債(億)',               key: '有息負債_億',        cf: colorNeg },
        { label: '財務透明度(%)',              key: '財務透明度',         cf: colorPos, sep: true },
        { label: '應收帳款週轉天數',           key: '應收帳款週轉天數',   cf: () => '#ccc' },
        { label: '存貨週轉天數',               key: '存貨週轉天數',       cf: () => '#ccc' },
      ])}

      {/* ── 季度現金流量表 (圖3) ── */}
      {sectionTitle('💵 季度現金流量表（單位：億）')}
      {renderQTable([
        { label: '稅前淨利(億)',               key: '稅前淨利_億',       cf: colorPos },
        { label: '應收帳款(增)減(億)',         key: '應收帳款增減_億',    cf: colorPos },
        { label: '存貨(增)減(億)',             key: '存貨增減_億',        cf: colorPos },
        { label: '應付帳款增(減)(億)',         key: '應付帳款增減_億',    cf: colorPos },
        { label: '營業活動現金流入(出)(億)',   key: '營業CF_億',         cf: colorPos, sep: true },
        { label: '(買)賣攤銷後金融資產(億)',  key: '買賣金融資產_億',   cf: () => '#ccc' },
        { label: '購置不動產設備(億)',         key: '購置不動產設備_億', cf: colorNeg },
        { label: '處分不動產設備(億)',         key: '處分不動產_億',     cf: colorPos },
        { label: '投資活動現金流入(出)(億)',   key: '投資CF_億',         cf: () => '#ccc', sep: true },
        { label: '支付現金股利(億)',           key: '支付股利_億',       cf: colorNeg },
        { label: '短期借款增(減)(億)',         key: '短期借款增減_億',    cf: () => '#ccc' },
        { label: '應付票券增(減)(億)',         key: '應付票券增減_億',    cf: () => '#ccc' },
        { label: '發行公司債(億)',             key: '發行公司債_億',      cf: colorPos },
        { label: '舉借長期借款(億)',           key: '舉借長期借款_億',    cf: colorPos },
        { label: '償還長期借款(億)',           key: '償還長期借款_億',    cf: colorNeg },
        { label: '現金增(減)資(億)',           key: '現金增資_億',        cf: () => '#ccc' },
        { label: '籌資活動現金流入(出)(億)',   key: '籌資CF_億',         cf: () => '#ccc', sep: true },
        { label: '修正式自由現金流量(億)',      key: '自由CF_億',         cf: colorPos },
        { label: '餘絀現金流量(億)',           key: '餘絀CF_億',         cf: colorPos },
        { label: '盈餘含金量(營業CF/稅前淨利%)', key: '盈餘含金量',     cf: colorPos },
      ])}

      {/* ── 年度財務 (圖4) ── */}
      {sectionTitle('📈 年度財務（單位：億）')}
      {renderATable([
        { label: '資產總額(億)',               key: 'total_assets',      cf: colorPos },
        { label: '負債總額(億)',               key: 'total_liab',        cf: colorNeg },
        { label: '母公司股東權益總額(億)',     key: 'total_equity',      cf: colorPos },
        { label: '股本(億)',                   key: 'common_stock',      cf: () => '#ccc', sep: true },
        { label: '營業收入(億)',               key: 'revenue',           cf: () => '#ccc' },
        { label: '銷貨成本(億)',               key: 'cost',              cf: colorNeg },
        { label: '營業毛利(億)',               key: 'gross_profit',      cf: colorPos },
        { label: '營業費用(億)',               key: 'op_expense',        cf: colorNeg },
        { label: '營業利益(億)',               key: 'op_income',         cf: colorPos },
        { label: '營外收支(億)',               key: 'non_op_income',     cf: colorPos },
        { label: '稅前淨利(億)',               key: 'pretax_income',     cf: colorPos },
        { label: '母公司淨利(億)',             key: 'net_income',        cf: colorPos },
        { label: '每股盈餘(元)',               key: 'eps',               cf: colorPos, sep: true },
        { label: '營業活動現金流入(出)(億)',   key: 'op_cashflow',       cf: colorPos },
        { label: '投資活動現金流入(出)(億)',   key: 'inv_cashflow',      cf: () => '#ccc' },
        { label: '籌資活動現金流入(出)(億)',   key: 'fin_cashflow',      cf: () => '#ccc' },
        { label: '購置不動產及設備(億)',        key: 'capex',         cf: colorNeg },
        { label: '處分不動產及設備(億)',        key: 'ppe_disposal',      cf: colorPos },
        { label: '無形資產(商譽)(增)減(億)',   key: 'intangible_change', cf: () => '#ccc' },
        { label: '支付現金股利(億)',           key: 'dividend_paid',     cf: colorNeg },
        { label: '修正式自由現金流量(億)',      key: 'free_cashflow',     cf: colorPos },
        { label: '餘絀現金流量(億)',           key: 'surplus_cf',        cf: colorPos },
        { label: '業外收支/營收(%)',           key: 'non_op_rev_ratio',  cf: colorPos },
      ])}

      {/* ── 月營收 ── */}
      {sectionTitle('📅 月營收')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#070a0f' }}>
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
              <tr key={row.label} style={{ background: ri % 2 === 0 ? '#080b10' : '#070a0e' }}>
                <td style={{ ...td, textAlign: 'left', color: '#8ab8d0', fontWeight: 500, ...(row.sep ? { borderBottom: '2px solid #ffffff' } : {}) }}>{row.label}</td>
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
            <tr style={{ background: '#070a0f' }}>
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
              <tr key={row.key} style={{ background: i % 2 === 0 ? '#080b10' : '#070a0e' }}>
                <td style={{ ...td, textAlign: 'left', color: '#8ab8d0', fontWeight: 500, ...(row.sep ? { borderBottom: '2px solid #ffffff' } : {}) }}>{row.label}</td>
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

const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #2a3a4a', color: '#ddd', whiteSpace: 'nowrap', background: '#070a0f' };
const td = { padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid #1e2a3a', whiteSpace: 'nowrap' };
