import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';

const S = {
  root: { padding: '16px 20px', maxWidth: 900, fontFamily: "'Barlow',sans-serif" },
  header: { fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700,
    letterSpacing: 3, color: '#90c0dc', marginBottom: 4 },
  sub: { color: '#7ab0cc', fontSize: 11, letterSpacing: 2, marginBottom: 20,
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
  const [inputTicker, setInputTicker] = useState('2330');
  const [ticker, setTicker] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [gpmDetail, setGpmDetail] = useState(null);
  const [gpmLoading, setGpmLoading] = useState(false);
  const [opiDetail, setOpiDetail] = useState(null);
  const [opiLoading, setOpiLoading] = useState(false);
  const [nonOpDetail, setNonOpDetail] = useState(null);
  const [invDetail, setInvDetail] = useState(null);

  // 統計隨查詢一起帶出

  const search = async (t) => {
    const ticker_val = (t || inputTicker || '').trim();
    if (!ticker_val) { alert('請輸入股票代號'); return; }
    const t_use = ticker_val;
    if (!t) t = t_use;
    setLoading(true); setDetail(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const r = await fetch(`${API_URL}/api/scoreboard/monthly-rev/${ticker_val}`, { signal: controller.signal });
      clearTimeout(timeoutId);
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
    } catch(e) { setDetail({ error: `查詢失敗：${e.message}` }); }
    setLoading(false);
  };

  const searchGpm = async (t) => {
    const tv = (t || inputTicker || '').trim();
    if (!tv) return;
    setGpmLoading(true); setGpmDetail(null);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 30000);
      const r = await fetch(`${API_URL}/api/scoreboard/gpm/${tv}`, { signal: controller.signal });
      clearTimeout(tid);
      setGpmDetail(await r.json());
    } catch(e) { setGpmDetail({ error: `查詢失敗：${e.message}` }); }
    setGpmLoading(false);
  };

  const searchOpi = async (t) => {
    const tv = (t || inputTicker || '').trim();
    if (!tv) return;
    setOpiLoading(true); setOpiDetail(null);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 30000);
      const r = await fetch(`${API_URL}/api/scoreboard/opi/${tv}`, { signal: controller.signal });
      clearTimeout(tid);
      setOpiDetail(await r.json());
    } catch(e) { setOpiDetail({ error: `查詢失敗：${e.message}` }); }
    setOpiLoading(false);
  };

  const searchNonOp = async (t) => {
    const tv = (t || inputTicker || '').trim(); if (!tv) return;
    try {
      const r = await fetch(`${API_URL}/api/scoreboard/non-op/${tv}`);
      setNonOpDetail(await r.json());
    } catch(e) {}
  };
  const searchInv = async (t) => {
    const tv = (t || inputTicker || '').trim(); if (!tv) return;
    try {
      const r = await fetch(`${API_URL}/api/scoreboard/inv/${tv}`);
      setInvDetail(await r.json());
    } catch(e) {}
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
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
            {[
              { label: '計算月份', value: stats.period, color: '#90c0dc' },
              { label: '全體股票數', value: stats.total?.toLocaleString(), color: '#c0d8ea' },
              { label: '總得分（滿分120）',
                value: (() => {
                  const scores = [
                    detail?.score != null ? detail.score * 4 : null,
                    gpmDetail?.score != null ? gpmDetail.score * 2 : null,
                    opiDetail?.score != null ? opiDetail.score * 2 : null,
                    nonOpDetail?.score != null ? nonOpDetail.score * 1 : null,
                    invDetail?.score != null ? invDetail.score * 1 : null,
                  ];
                  const valid = scores.filter(s => s !== null);
                  if (valid.length === 0) return '-';
                  return valid.reduce((a,b) => a+b, 0).toFixed(1);
                })(),
                color: (() => {
                  const scores = [
                    detail?.score != null ? detail.score * 4 : null,
                    gpmDetail?.score != null ? gpmDetail.score * 2 : null,
                    opiDetail?.score != null ? opiDetail.score * 2 : null,
                    nonOpDetail?.score != null ? nonOpDetail.score * 1 : null,
                    invDetail?.score != null ? invDetail.score * 1 : null,
                  ];
                  const valid = scores.filter(s => s !== null);
                  if (valid.length === 0) return '#3a6080';
                  const total = valid.reduce((a,b) => a+b, 0);
                  return total >= 80 ? '#3ed888' : total >= 50 ? '#d8a840' : '#e05050';
                })()
              },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 14px', borderRight: '1px solid #0f1c2a' }}>
                <div style={S.label}>{item.label}</div>
                <div style={{ ...S.mono, fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          {(detail || gpmDetail || opiDetail || nonOpDetail || invDetail) && (
            <div style={{ borderTop: '1px solid #0f1c2a', padding: '8px 14px',
              display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11 }}>
              {[
                { label: '月營收×4', score: detail?.score, mult: 4 },
                { label: '毛利率×2', score: gpmDetail?.score, mult: 2 },
                { label: '營益率×2', score: opiDetail?.score, mult: 2 },
                { label: '業外收支×1', score: nonOpDetail?.score, mult: 1 },
                { label: '存貨×1', score: invDetail?.score, mult: 1 },
              ].map(item => (
                <span key={item.label} style={{ color: '#3a6080' }}>
                  {item.label}：<b style={{ color: item.score != null ? '#90c0dc' : '#2a4060', fontFamily: "'JetBrains Mono',monospace" }}>
                    {item.score != null ? (item.score * item.mult).toFixed(1) : '-'}
                  </b>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 搜尋個股 */}
      <div style={S.card}>
        <div style={{ ...S.label, marginBottom: 10 }}>輸入股票代號查詢評分明細</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={inputTicker}
            onChange={e => setInputTicker(e.target.value.toUpperCase())}
            onKeyDown={e => { if(e.key==='Enter') { setTicker(inputTicker); search(inputTicker); searchGpm(inputTicker); searchOpi(inputTicker); searchNonOp(inputTicker); searchInv(inputTicker); }}}
            style={{ background: '#060910', border: '1px solid #2a5070', padding: '8px 14px',
              color: '#c0d8ea', fontSize: 14, outline: 'none', width: 130,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}
            placeholder="2330" />
          <button style={S.btn} onClick={() => { setTicker(inputTicker); search(inputTicker); searchGpm(inputTicker); searchOpi(inputTicker); searchNonOp(inputTicker); searchInv(inputTicker); }}
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
              <span style={{ color: '#7ab0cc', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
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
                  <div style={{ marginTop: 10, color: '#7ab0cc', fontSize: 11, lineHeight: 1.6 }}>
                    評分說明：0分（年增率≤-30%）→ 7分（+30%）→ 10分（≥100%）
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

        {/* 毛利率分數 */}
        {gpmDetail && !gpmDetail.error && gpmDetail.status === 'scored' && (
          <div style={{ marginTop: 12, padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a' }}>
            <div style={{ ...S.label, marginBottom: 8 }}>毛利率得分</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginBottom: 10 }}>
              {[
                { label: '最新季毛利率', value: gpmDetail.gpm != null ? `${gpmDetail.gpm?.toFixed(2)}%` : '-',
                  color: gpmDetail.gpm >= 40 ? '#3ed888' : gpmDetail.gpm >= 10 ? '#90c0dc' : '#e05050' },
                { label: '上季毛利率', value: gpmDetail.prev_gpm != null ? `${gpmDetail.prev_gpm?.toFixed(2)}%` : '-', color: '#6a8090' },
                { label: '月增率變化', value: gpmDetail.gpm_diff != null ? `${gpmDetail.gpm_diff > 0 ? '+' : ''}${gpmDetail.gpm_diff?.toFixed(2)}%` : '-',
                  color: gpmDetail.gpm_diff > 0 ? '#3ed888' : gpmDetail.gpm_diff < 0 ? '#e05050' : '#6a8090' },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 12px', background: '#080b10', border: '1px solid #0a1420' }}>
                  <div style={S.label}>{item.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 600, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <ScoreBar score={gpmDetail.score} />
            <div style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: '#7ab0cc', fontSize: 11 }}>排名：<b style={{ color: '#d8a840' }}>#{gpmDetail.rank}</b> / {gpmDetail.total?.toLocaleString()}家</span>
              <span style={{ color: '#7ab0cc', fontSize: 11 }}>季別：{gpmDetail.period}</span>
              {gpmDetail.stats && <>
                <span style={{ color: '#7ab0cc', fontSize: 11 }}>全體：{gpmDetail.stats.total?.toLocaleString()}家</span>
                <span style={{ color: '#7ab0cc', fontSize: 11 }}>極端值剔除：高{gpmDetail.stats.excluded_extreme_hi}+低{gpmDetail.stats.excluded_extreme_lo}家</span>
              </>}
            </div>
            <div style={{ marginTop: 6, color: '#5a8aaa', fontSize: 10, lineHeight: 1.6 }}>
              評分說明：&lt;10%→0分 ｜ 10%~40%→線性0~10分 ｜ ≥40%→10分 ｜ 毛利率每增加1%加0.01分（&lt;10%時加1分）
            </div>
          </div>
        )}
        {gpmDetail?.error && <div style={{ color: '#e05050', fontSize: 11, marginTop: 8 }}>毛利率：{gpmDetail.error}</div>}

        {/* 營益率分數 */}
        {opiDetail && !opiDetail.error && opiDetail.status === 'scored' && (
          <div style={{ marginTop: 8, padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a' }}>
            <div style={{ ...S.label, marginBottom: 8 }}>營益率得分</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginBottom: 10 }}>
              {[
                { label: '最新季營益率', value: opiDetail.opi != null ? `${opiDetail.opi?.toFixed(1)}%` : '-',
                  color: opiDetail.opi >= 25 ? '#3ed888' : opiDetail.opi >= 0 ? '#90c0dc' : '#e05050' },
                { label: '上季營益率', value: opiDetail.prev_opi != null ? `${opiDetail.prev_opi?.toFixed(1)}%` : '-', color: '#6a8090' },
                { label: '季增變化', value: opiDetail.opi_diff != null ? `${opiDetail.opi_diff > 0 ? '+' : ''}${opiDetail.opi_diff?.toFixed(1)}%` : '-',
                  color: opiDetail.opi_diff > 0 ? '#3ed888' : opiDetail.opi_diff < 0 ? '#e05050' : '#6a8090' },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 12px', background: '#080b10', border: '1px solid #0a1420' }}>
                  <div style={S.label}>{item.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 600, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <ScoreBar score={opiDetail.score} />
            <div style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: '#7ab0cc', fontSize: 11 }}>排名：<b style={{ color: '#d8a840' }}>#{opiDetail.rank}</b> / {opiDetail.total?.toLocaleString()}家</span>
              <span style={{ color: '#7ab0cc', fontSize: 11 }}>季別：{opiDetail.period}</span>
              {opiDetail.stats && <>
                <span style={{ color: '#7ab0cc', fontSize: 11 }}>全體：{opiDetail.stats.total?.toLocaleString()}家</span>
                <span style={{ color: '#7ab0cc', fontSize: 11 }}>極端值剔除：高{opiDetail.stats.excluded_extreme_hi}+低{opiDetail.stats.excluded_extreme_lo}家</span>
              </>}
            </div>
            <div style={{ marginTop: 6, color: '#5a8aaa', fontSize: 10, lineHeight: 1.6 }}>
              評分說明：&lt;0%→0分 ｜ 0%~25%→線性0~10分 ｜ ≥25%→10分 ｜ 每增1pp加0.1分（&lt;0%時加1分），上限+5分
            </div>
          </div>
        )}
        {opiDetail?.error && <div style={{ color: '#e05050', fontSize: 11, marginTop: 8 }}>營益率：{opiDetail.error}</div>}

        {/* 業外收支 */}
        {nonOpDetail && nonOpDetail.status === 'scored' && (
          <div style={{ marginTop: 8, padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a' }}>
            <div style={{ ...S.label, marginBottom: 8 }}>業外收支/營業收入得分</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginBottom: 10 }}>
              {[
                { label: '業外收支/營收', value: nonOpDetail.ratio != null ? `${nonOpDetail.ratio > 0?'+':''}${nonOpDetail.ratio?.toFixed(1)}%` : '-',
                  color: Math.abs(nonOpDetail.ratio) < 3 ? '#3ed888' : Math.abs(nonOpDetail.ratio) < 7 ? '#d8a840' : '#e05050' },
                { label: '排名', value: nonOpDetail.rank ? `#${nonOpDetail.rank} / ${nonOpDetail.total?.toLocaleString()}家` : '-', color: '#d8a840' },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 12px', background: '#080b10', border: '1px solid #0a1420' }}>
                  <div style={S.label}>{item.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 600, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <ScoreBar score={nonOpDetail.score} />
            <div style={{ marginTop: 6, color: '#5a8aaa', fontSize: 10 }}>
              評分說明：0%→10分 ｜ ±10%→0分 ｜ 越接近0分數越高
            </div>
          </div>
        )}

        {/* 存貨與週轉天數 */}
        {invDetail && invDetail.status === 'scored' && (
          <div style={{ marginTop: 8, padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a' }}>
            <div style={{ ...S.label, marginBottom: 8 }}>存貨 × 存貨週轉天數得分</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginBottom: 10 }}>
              {[
                { label: '存貨（億）', value: invDetail.inv != null ? invDetail.inv?.toFixed(2) : '-',
                  color: invDetail.inv > invDetail.prev_inv ? '#3ed888' : '#e05050' },
                { label: '上季存貨（億）', value: invDetail.prev_inv?.toFixed(2), color: '#6a8090' },
                { label: '週轉天數', value: invDetail.inv_days != null ? `${invDetail.inv_days}天` : '-',
                  color: invDetail.days_down ? '#3ed888' : '#e05050' },
                { label: '上季週轉天數', value: invDetail.prev_inv_days != null ? `${invDetail.prev_inv_days}天` : '-', color: '#6a8090' },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 10px', background: '#080b10', border: '1px solid #0a1420' }}>
                  <div style={S.label}>{item.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 600, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 10, padding: '6px 12px', background: '#0a1020', border: '1px solid #1a3040',
              color: invDetail.score === 10 ? '#3ed888' : invDetail.score >= 7.5 ? '#d8a840' : '#8ab0cc', fontSize: 13, fontWeight: 600 }}>
              組合判斷：{invDetail.combo_label}
            </div>
            <ScoreBar score={invDetail.score} />
            <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
              <span style={{ color: '#7ab0cc', fontSize: 11 }}>排名：<b style={{ color: '#d8a840' }}>#{invDetail.rank}</b> / {invDetail.total?.toLocaleString()}家</span>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
