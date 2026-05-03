import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';

const S = {
  root: { padding: '16px 20px', maxWidth: 900, fontFamily: "'Barlow',sans-serif" },
  header: { fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700,
    letterSpacing: 3, color: '#90c0dc', marginBottom: 4 },
  sub: { color: '#3a6080', fontSize: 11, letterSpacing: 2, marginBottom: 20,
    fontFamily: "'Rajdhani',sans-serif" },
  card: { background: '#080b10', border: '1px solid #1a2a3c', padding: '16px 20px', marginBottom: 1 },
  label: { color: '#6a98b8', fontSize: 9, letterSpacing: 2.5,
    fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, marginBottom: 4 },
  mono: { fontFamily: "'JetBrains Mono',monospace" },
  btn: { padding: '8px 20px', background: 'linear-gradient(135deg,#2e5872,#4080a0)',
    color: '#eef8ff', border: 'none', cursor: 'pointer',
    fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2 },
};

const scoreColor = (s) => {
  if (s === null || s === undefined) return '#3a6080';
  if (s >= 8) return '#3ed888';
  if (s >= 5) return '#90c0dc';
  if (s >= 0) return '#d8a840';
  return '#e05050';
};

const ScoreBar = ({ score }) => {
  if (score === null || score === undefined) return null;
  const pct = ((score + 10) / 20) * 100;
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
      <div style={{ flex: 1, height: 8, background: '#0d1820', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#1a3a52' }}/>
        <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.5s' }}/>
      </div>
      <span style={{ ...S.mono, fontSize: 20, fontWeight: 600, color, minWidth: 60, textAlign: 'right' }}>
        {score > 0 ? '+' : ''}{score?.toFixed(1)}
      </span>
      <span style={{ color: '#3a6080', fontSize: 10 }}>/ 10</span>
    </div>
  );
};

export default function Scoreboard() {
  const [inputTicker, setInputTicker] = useState('');
  const [ticker, setTicker] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // 統計隨查詢一起帶出

  const search = async (t) => {
    if (!t) return;
    setLoading(true); setDetail(null);
    try {
      const r = await fetch(`${API_URL}/api/scoreboard/monthly-rev/${t}`);
      const d = await r.json();
      setDetail(d);
      if (d.stats) {
        setStats({
          period: d.period,
          total: d.stats.total,
          scored: d.stats.scored,
          excluded_low: d.stats.excluded_low,
          excluded_zero: d.stats.excluded_zero,
          excluded_extreme_hi: d.stats.excluded_extreme_hi,
          excluded_extreme_lo: d.stats.excluded_extreme_lo,
        });
      }
    } catch(e) { setDetail({ error: '查詢失敗，請稍後再試' }); }
    setLoading(false);
  };

  const statusBadge = (status) => {
    const map = {
      scored: { label: '✅ 有效評分', color: '#3ed888' },
      scored_over200: { label: '✅ 有效評分（>200%）', color: '#3ed888' },
      zero_base: { label: '🔘 基期為零', color: '#3a6080' },
      low_base: { label: '🔘 基期太低', color: '#3a6080' },
      extreme: { label: '⚠️ 極端值剔除', color: '#d8a840' },
      no_data: { label: '❌ 無資料', color: '#e05050' },
    };
    const s = map[status] || { label: status, color: '#888' };
    return <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
  };

  return (
    <div style={S.root}>
      <div style={S.header}>📊 財務計分板</div>
      <div style={S.sub}>FINANCIAL SCORECARD — 公開版 · 月營收年增率評分</div>

      {/* 全體統計 */}
      {stats && (
        <div style={{ ...S.card, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1 }}>
          {[
            { label: '計算月份', value: stats.period, color: '#90c0dc' },
            { label: '全體股票數', value: stats.total?.toLocaleString(), color: '#c0d8ea' },
            { label: '有效評分', value: stats.scored?.toLocaleString(), color: '#3ed888' },
            { label: '剔除合計', value: (stats.excluded_low+stats.excluded_zero+stats.excluded_extreme_hi+stats.excluded_extreme_lo)?.toLocaleString(), color: '#d8a840' },
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 14px', borderRight: '1px solid #0f1c2a' }}>
              <div style={S.label}>{item.label}</div>
              <div style={{ ...S.mono, fontSize: 18, fontWeight: 600, color: item.color }}>{item.value}</div>
            </div>
          ))}
          <div style={{ gridColumn: '1/-1', borderTop: '1px solid #0f1c2a',
            padding: '8px 14px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ color: '#3a6080', fontSize: 11 }}>
              基期太低：<b style={{ color: '#6a8090' }}>{stats.excluded_low}</b> 家
            </span>
            <span style={{ color: '#3a6080', fontSize: 11 }}>
              基期為零：<b style={{ color: '#6a8090' }}>{stats.excluded_zero}</b> 家
            </span>
            <span style={{ color: '#3a6080', fontSize: 11 }}>
              極端值（高端）：<b style={{ color: '#6a8090' }}>{stats.excluded_extreme_hi}</b> 家
            </span>
            <span style={{ color: '#3a6080', fontSize: 11 }}>
              極端值（低端）：<b style={{ color: '#6a8090' }}>{stats.excluded_extreme_lo}</b> 家
            </span>
          </div>
        </div>
      )}

      {/* 搜尋個股 */}
      <div style={S.card}>
        <div style={{ ...S.label, marginBottom: 10 }}>輸入股票代號查詢評分明細</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={inputTicker}
            onChange={e => setInputTicker(e.target.value.toUpperCase())}
            onKeyDown={e => { if(e.key==='Enter') { setTicker(inputTicker); search(inputTicker); }}}
            style={{ background: '#060910', border: '1px solid #2a5070', padding: '8px 14px',
              color: '#c0d8ea', fontSize: 14, outline: 'none', width: 130,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}
            placeholder="2330" />
          <button style={S.btn} onClick={() => { setTicker(inputTicker); search(inputTicker); }}
            disabled={loading}>
            {loading ? '計算中（約10秒）...' : '查詢'}
          </button>
        </div>

        {/* 結果 */}
        {detail && !detail.error && (
          <div style={{ marginTop: 20 }}>
            {/* 股票標題 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700,
                background: 'linear-gradient(135deg,#90c0dc,#d0eeff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {detail.ticker}
              </span>
              <span style={{ color: '#8ab0c8', fontSize: 15 }}>{detail.name}</span>
              <span style={{ color: '#3a6080', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                {detail.period}
              </span>
            </div>

            {/* 狀態 */}
            <div style={{ marginBottom: 12 }}>{statusBadge(detail.status)}</div>
            {detail.status_label && detail.status !== 'scored' && detail.status !== 'scored_over200' && (
              <div style={{ color: '#5a8090', fontSize: 12, marginBottom: 12 }}>{detail.status_label}</div>
            )}

            {/* 有效評分才顯示分數 */}
            {(detail.status === 'scored' || detail.status === 'scored_over200') && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginBottom: 12 }}>
                  {[
                    { label: '月營收年增率', value: detail.yoy != null ? `${detail.yoy > 0?'+':''}${detail.yoy?.toFixed(1)}%` : '-',
                      color: detail.yoy >= 0 ? '#3ed888' : '#e05050' },
                    { label: '評分排名', value: detail.rank ? `#${detail.rank}` : '-', color: '#d8a840' },
                    { label: '參與排名家數', value: detail.total_scored?.toLocaleString(), color: '#6a8090' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '10px 14px', background: '#070a0f',
                      border: '1px solid #0f1c2a' }}>
                      <div style={S.label}>{item.label}</div>
                      <div style={{ ...S.mono, fontSize: 17, fontWeight: 600, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a' }}>
                  <div style={S.label}>月營收年增率得分</div>
                  <ScoreBar score={detail.score} />
                  <div style={{ marginTop: 10, color: '#3a6080', fontSize: 11, lineHeight: 1.6 }}>
                    評分說明：-10分（年增率≤-50%）→ 0分（-20%）→ 10分（≥100%）
                    {detail.status === 'scored_over200' && (
                      <span style={{ color: '#d8a840' }}>
                        {detail.consec_over200 ? '　連續2個月>200%，給滿分10分' : '　單月>200%，給5分（半滿）'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {detail?.error && (
          <div style={{ color: '#e05050', fontSize: 12, marginTop: 12 }}>❌ {detail.error}</div>
        )}
      </div>

      {/* 評分規則說明 */}
      <div style={{ ...S.card, marginTop: 1 }}>
        <div style={{ ...S.label, marginBottom: 10 }}>評分規則 — 月營收年增率</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {[
            { range: '年增率 ≥ 100%', score: '10 分', color: '#3ed888' },
            { range: '年增率 -20% ~ 100%', score: '線性 0 ~ 10 分', color: '#90c0dc' },
            { range: '年增率 -20% ~ -50%', score: '線性 0 ~ -10 分', color: '#d8a840' },
            { range: '年增率 ≤ -50%', score: '-10 分', color: '#e05050' },
            { range: '連續 2 個月 > 200%', score: '10 分（滿分）', color: '#3ed888' },
            { range: '單月 > 200%', score: '5 分（半滿）', color: '#90c0dc' },
            { range: '本月或去年同月 < 3000萬', score: '🔘 基期太低，不評', color: '#3a6080' },
            { range: '極端值（各1.5%）', score: '⚠️ 剔除，不評', color: '#d8a840' },
          ].map((r, i) => (
            <div key={i} style={{ padding: '7px 12px', background: '#070a0f',
              border: '1px solid #0a1420', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6a90a8', fontSize: 12 }}>{r.range}</span>
              <span style={{ color: r.color, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{r.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
