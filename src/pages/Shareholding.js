import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts';
import './Shareholding.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';
const WHALE_THRESHOLD = 13;

export default function Shareholding({ initialTicker }) {
  const [ticker, setTicker] = useState(initialTicker || '2330');
  const [inputTicker, setInputTicker] = useState(initialTicker || '2330');
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [data, setData] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('distribution');

  const fetchDates = useCallback(async (t) => {
    try {
      const res = await fetch(`${API_BASE}/api/shareholding/${t}/dates`);
      const json = await res.json();
      if (json.dates && json.dates.length > 0) { setDates(json.dates); setSelectedDate(json.dates[0]); return json.dates[0]; }
      else { setDates([]); setSelectedDate(''); return null; }
    } catch { return null; }
  }, []);

  const fetchData = useCallback(async (t, date) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(date ? `${API_BASE}/api/shareholding/${t}?date=${date}` : `${API_BASE}/api/shareholding/${t}`);
      const json = await res.json();
      if (json.error) { setError(json.error); setData([]); } else setData(json.data || []);
    } catch { setError('連線失敗'); setData([]); }
    setLoading(false);
  }, []);

  const fetchTrend = useCallback(async (t) => {
    try {
      const res = await fetch(`${API_BASE}/api/shareholding/${t}/trend`);
      const json = await res.json();
      if (json.trend) setTrend([...json.trend].reverse());
    } catch { setTrend([]); }
  }, []);

  useEffect(() => {
    const init = async () => {
      const firstDate = await fetchDates(ticker);
      if (firstDate) fetchData(ticker, firstDate);
      fetchTrend(ticker);
    };
    init();
  }, [ticker, fetchDates, fetchData, fetchTrend]);

  const stats = React.useMemo(() => {
    if (!data.length) return null;
    const total_holders = data.reduce((s, d) => s + (d.holders || 0), 0);
    const whale_pct = data.filter(d => d.level >= WHALE_THRESHOLD).reduce((s, d) => s + d.pct, 0);
    const retail_pct = data.filter(d => d.level < WHALE_THRESHOLD).reduce((s, d) => s + d.pct, 0);
    const whale_holders = data.filter(d => d.level >= WHALE_THRESHOLD).reduce((s, d) => s + (d.holders || 0), 0);
    const concentration = data.slice(-3).reduce((s, d) => s + d.pct, 0);
    return { total_holders, whale_pct, retail_pct, whale_holders, concentration };
  }, [data]);

  const getBarColor = (level) => { if (level >= 15) return '#3ed888'; if (level >= 13) return '#5bc8f0'; if (level >= 10) return '#d8a840'; return '#4a6080'; };
  const fmtDate = (d) => d ? `${d.slice(0,4)}/${d.slice(4,6)}` : '';

  return (
    <div className="sh-container">
      <div className="sh-header">
        <h1 className="sh-title"><span className="sh-title-icon">🔬</span>籌碼分析</h1>
        <p className="sh-subtitle">股權分散表 · 大戶動向追蹤</p>
      </div>
      <div className="sh-search-bar">
        <input className="sh-input" value={inputTicker} onChange={e => setInputTicker(e.target.value)} onKeyDown={e => e.key === 'Enter' && setTicker(inputTicker.trim())} placeholder="輸入股票代號，如 2330" />
        <button className="sh-btn-search" onClick={() => setTicker(inputTicker.trim())}>查詢</button>
        {dates.length > 0 && (
          <select className="sh-date-select" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); fetchData(ticker, e.target.value); }}>
            {dates.map(d => <option key={d} value={d}>{`${d.slice(0,4)}/${d.slice(4,6)}/${d.slice(6,8)}`}</option>)}
          </select>
        )}
      </div>
      {error && <div className="sh-error">⚠ {error}</div>}
      {loading && <div className="sh-loading"><span className="sh-spinner" />載入中...</div>}
      {stats && !loading && (
        <>
          <div className="sh-stats-grid">
            <div className="sh-stat-card sh-whale"><div className="sh-stat-label">大戶持股</div><div className="sh-stat-value">{stats.whale_pct.toFixed(1)}<span>%</span></div><div className="sh-stat-sub">{stats.whale_holders.toLocaleString()} 人（400張以上）</div></div>
            <div className="sh-stat-card sh-retail"><div className="sh-stat-label">散戶持股</div><div className="sh-stat-value">{stats.retail_pct.toFixed(1)}<span>%</span></div><div className="sh-stat-sub">400張以下</div></div>
            <div className="sh-stat-card sh-holders"><div className="sh-stat-label">總股東人數</div><div className="sh-stat-value">{stats.total_holders.toLocaleString()}</div><div className="sh-stat-sub">人</div></div>
            <div className="sh-stat-card sh-conc"><div className="sh-stat-label">前3大區間集中度</div><div className="sh-stat-value">{stats.concentration.toFixed(1)}<span>%</span></div><div className="sh-stat-sub">{stats.concentration > 60 ? '⚡ 籌碼高度集中' : stats.concentration > 40 ? '📊 籌碼適度集中' : '🌊 籌碼較分散'}</div></div>
          </div>
          <div className="sh-tabs">
            <button className={`sh-tab ${activeTab==='distribution'?'active':''}`} onClick={() => setActiveTab('distribution')}>持股分布</button>
            <button className={`sh-tab ${activeTab==='trend'?'active':''}`} onClick={() => setActiveTab('trend')}>大戶趨勢</button>
            <button className={`sh-tab ${activeTab==='table'?'active':''}`} onClick={() => setActiveTab('table')}>明細表</button>
          </div>
          {activeTab === 'distribution' && (
            <div className="sh-chart-wrap">
              <div className="sh-chart-title">各區間持股比例（%）</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data} margin={{ top:10, right:20, left:0, bottom:80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
                  <XAxis dataKey="level_name" tick={{ fill:'#7a9bb5', fontSize:11 }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill:'#7a9bb5', fontSize:12 }} unit="%" />
                  <Tooltip contentStyle={{ background:'#0d1520', border:'1px solid #1e3a5a', borderRadius:8 }} formatter={(v) => [`${Number(v).toFixed(2)}%`, '持股比例']} />
                  <Bar dataKey="pct" radius={[4,4,0,0]}>{data.map(e => <Cell key={e.level} fill={getBarColor(e.level)} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="sh-chart-title" style={{marginTop:32}}>各區間股東人數</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top:10, right:20, left:0, bottom:80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
                  <XAxis dataKey="level_name" tick={{ fill:'#7a9bb5', fontSize:11 }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill:'#7a9bb5', fontSize:12 }} />
                  <Tooltip contentStyle={{ background:'#0d1520', border:'1px solid #1e3a5a', borderRadius:8 }} formatter={(v) => [v.toLocaleString(), '股東人數']} />
                  <Bar dataKey="holders" radius={[4,4,0,0]}>{data.map(e => <Cell key={e.level} fill={getBarColor(e.level)} opacity={0.75} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="sh-legend">
                <span className="sh-legend-item"><span style={{background:'#3ed888'}} />超大戶（800張+）</span>
                <span className="sh-legend-item"><span style={{background:'#5bc8f0'}} />大戶（400-800張）</span>
                <span className="sh-legend-item"><span style={{background:'#d8a840'}} />中實戶（50-400張）</span>
                <span className="sh-legend-item"><span style={{background:'#4a6080'}} />散戶（50張以下）</span>
              </div>
            </div>
          )}
          {activeTab === 'trend' && (
            <div className="sh-chart-wrap">
              {trend.length > 1 ? (
                <>
                  <div className="sh-chart-title">大戶 vs 散戶持股比例趨勢</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={trend} margin={{ top:10, right:20, left:0, bottom:10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
                      <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill:'#7a9bb5', fontSize:11 }} />
                      <YAxis tick={{ fill:'#7a9bb5', fontSize:12 }} unit="%" domain={['auto','auto']} />
                      <Tooltip contentStyle={{ background:'#0d1520', border:'1px solid #1e3a5a', borderRadius:8 }} labelFormatter={fmtDate} formatter={(v,n) => [`${Number(v).toFixed(2)}%`, n==='whale_pct'?'大戶持股':'散戶持股']} />
                      <Legend formatter={v => v==='whale_pct'?'大戶持股%':'散戶持股%'} />
                      <Line type="monotone" dataKey="whale_pct" stroke="#3ed888" strokeWidth={2} dot={{r:3}} />
                      <Line type="monotone" dataKey="retail_pct" stroke="#e05050" strokeWidth={2} dot={{r:3}} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : <div className="sh-no-data">歷史資料不足</div>}
            </div>
          )}
          {activeTab === 'table' && (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead><tr><th>持股區間</th><th>股東人數</th><th>持股股數</th><th>持股比例</th><th>類型</th></tr></thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.level} className={row.level >= WHALE_THRESHOLD ? 'sh-row-whale' : ''}>
                      <td>{row.level_name}</td><td>{(row.holders||0).toLocaleString()}</td><td>{(row.shares||0).toLocaleString()}</td>
                      <td><div className="sh-pct-bar-wrap"><div className="sh-pct-bar" style={{width:`${Math.min(row.pct,100)}%`,background:getBarColor(row.level)}} /><span>{row.pct.toFixed(2)}%</span></div></td>
                      <td><span className={`sh-badge ${row.level>=15?'super':row.level>=13?'whale':row.level>=10?'mid':'retail'}`}>{row.level>=15?'超大戶':row.level>=13?'大戶':row.level>=10?'中實戶':'散戶'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {!loading && !error && !stats && <div className="sh-empty">請輸入股票代號查詢籌碼分析</div>}
    </div>
  );
}
