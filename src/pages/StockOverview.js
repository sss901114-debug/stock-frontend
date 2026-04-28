import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getCompanyInfo, getPrice, getAnnual, getMonthly, getQuarterly, getDividend, getEstEps, addWatchlist, removeWatchlist } from '../api';

export default function StockOverview({ ticker }) {
  const [info, setInfo] = useState(null);
  const [price, setPrice] = useState([]);
  const [annual, setAnnual] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [quarterly, setQuarterly] = useState([]);
  const [dividend, setDividend] = useState([]);
  const [estEps, setEstEps] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    Promise.all([
      getCompanyInfo(ticker).catch(() => null),
      getPrice(ticker).catch(() => []),
      getAnnual(ticker).catch(() => []),
      getMonthly(ticker).catch(() => []),
      getQuarterly(ticker).catch(() => []),
      getDividend(ticker).catch(() => []),
      getEstEps(ticker).catch(() => null),
    ]).then(([i, p, a, m, q, d, e]) => {
      setInfo(i); setPrice(p); setAnnual(a);
      setMonthly(m); setQuarterly(q); setDividend(d); setEstEps(e);
      setLoading(false);
    });
  }, [ticker]);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeWatchlist(ticker).then(() => setInWatchlist(false));
    } else {
      addWatchlist(ticker, info?.name || '').then(() => setInWatchlist(true));
    }
  };

  if (loading) return <div className="loading">⏳ 載入中...</div>;
  if (!info) return <div className="loading">找不到股票資料</div>;

  const latestPrice = price[price.length - 1]?.close;
  const latestQ = quarterly[quarterly.length - 1];

  return (
    <div>
      {/* 標題列 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>{ticker} {info.name}</h2>
          {info.sub_industry && <span className="tag">{info.sub_industry}</span>}
        </div>
        <button onClick={toggleWatchlist} style={{
          padding: '8px 20px', borderRadius: 8, border: '1px solid var(--blue)',
          background: inWatchlist ? 'var(--blue)' : 'white',
          color: inWatchlist ? 'white' : 'var(--blue)', cursor: 'pointer', fontWeight: 600
        }}>
          {inWatchlist ? '★ 已追蹤' : '☆ 加入追蹤'}
        </button>
      </div>

      {/* 指標卡片 */}
      <div className="metric-grid">
        <MetricCard label="收盤價" value={latestPrice ? `${latestPrice}` : 'N/A'} />
        <MetricCard label="本益比 PE" value={info.pe ? `${info.pe}x` : 'N/A'} />
        <MetricCard label="股價淨值比 PB" value={info.pb ? `${info.pb}x` : 'N/A'} />
        <MetricCard label="市值（億）" value={info.market_cap_b ? Math.round(info.market_cap_b) : 'N/A'} />
        <MetricCard label="現金股利" value={info.cash_dividend ? `${info.cash_dividend}元` : 'N/A'} />
        <MetricCard label="現金發放率" value={info.payout_ratio ? `${info.payout_ratio}%` : 'N/A'} />
        <MetricCard label="近5年平均殖利率" value={info.avg_yield_5y ? `${info.avg_yield_5y}%` : 'N/A'} />
        <MetricCard label="近5年平均發放率" value={info.avg_payout_5y ? `${info.avg_payout_5y}%` : 'N/A'} />
      </div>

      {/* 預估EPS */}
      {estEps && (
        <div className="card">
          <div className="section-title">🔮 預估下一季 EPS</div>
          <div className="metric-grid">
            <MetricCard label="近3月營收合計（億）" value={estEps.rev_3m} />
            <MetricCard label="預估毛利率" value={`${estEps.est_gpm}%`} />
            <MetricCard label="預估EPS（元）" value={estEps.est_eps ?? 'N/A'} />
          </div>
        </div>
      )}

      {/* 股價走勢 */}
      {price.length > 0 && (
        <div className="card">
          <div className="section-title">📈 股價走勢</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={price.slice(-120)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} interval={19} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip formatter={v => [`${v}`, '收盤價']} />
              <Line type="monotone" dataKey="close" stroke="#4C9BE8" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 年度財務 */}
      {annual.length > 0 && (
        <div className="card">
          <div className="section-title">📊 年度財務</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={annual.slice(-8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="revenue" name="營業收入" fill="#4C9BE8" />
              <Bar dataKey="net_income" name="稅後淨利" fill="#2A9D8F" />
            </BarChart>
          </ResponsiveContainer>
          <table style={{ marginTop: 12 }}>
            <thead><tr>
              <th>年度</th><th>EPS</th><th>毛利率</th><th>自由現金流（億）</th>
            </tr></thead>
            <tbody>
              {annual.slice(-6).reverse().map(r => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td className={r.eps > 0 ? 'positive' : 'negative'}>{r.eps || '-'}</td>
                  <td>{r.revenue && r.gross_profit ? `${(r.gross_profit/r.revenue*100).toFixed(1)}%` : '-'}</td>
                  <td className={r.free_cashflow > 0 ? 'positive' : 'negative'}>{r.free_cashflow ? r.free_cashflow.toFixed(1) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 月營收 */}
      {monthly.length > 0 && (
        <div className="card">
          <div className="section-title">📅 月營收</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly.slice(-24)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} interval={5} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [(v/100000).toFixed(1) + ' 億', '月營收']} />
              <Bar dataKey="revenue" fill="#F4A261" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 股利表 */}
      {dividend.length > 0 && (
        <div className="card">
          <div className="section-title">💰 歷年現金股利</div>
          <table>
            <thead><tr><th>年度</th><th>現金股利</th><th>EPS</th><th>發放率</th></tr></thead>
            <tbody>
              {dividend.slice(0, 10).map(r => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td>{r.cash_dividend || '-'}</td>
                  <td>{r.eps_prev_year || '-'}</td>
                  <td>{r.payout_ratio_pct ? `${r.payout_ratio_pct}%` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
