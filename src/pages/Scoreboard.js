import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';

const S = {
  root: { padding: '16px 20px', maxWidth: 960, fontFamily: "'Barlow',sans-serif" },
  header: { fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 3, color: '#90c0dc', marginBottom: 4 },
  sub: { color: '#7ab0cc', fontSize: 11, letterSpacing: 2, marginBottom: 20, fontFamily: "'Rajdhani',sans-serif" },
  card: { background: '#080b10', border: '1px solid #1a2a3c', padding: '16px 20px', marginBottom: 1 },
  label: { color: '#6a98b8', fontSize: 9, letterSpacing: 2.5, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, marginBottom: 4 },
  mono: { fontFamily: "'JetBrains Mono',monospace" },
  btn: { padding: '8px 20px', background: 'linear-gradient(135deg,#2e5872,#4080a0)', color: '#eef8ff', border: 'none', cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2 },
};

const scoreColor = s => s == null ? '#3a6080' : s >= 8 ? '#3ed888' : s >= 5 ? '#90c0dc' : s >= 0 ? '#d8a840' : '#e05050';

const ScoreBar = ({ score }) => {
  if (score == null) return null;
  const pct = ((score + 10) / 20) * 100;
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
      <div style={{ flex: 1, height: 8, background: '#0d1820', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#1a3a52' }}/>
        <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: `linear-gradient(90deg,${color}88,${color})`, transition: 'width 0.5s' }}/>
      </div>
      <span style={{ ...S.mono, fontSize: 20, fontWeight: 600, color, minWidth: 60, textAlign: 'right' }}>
        {score > 0 ? '+' : ''}{score?.toFixed(1)}
      </span>
      <span style={{ color: '#3a6080', fontSize: 10 }}>/ 10</span>
    </div>
  );
};

const StatGrid = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 1, marginBottom: 10 }}>
    {items.map(item => (
      <div key={item.label} style={{ padding: '8px 12px', background: '#080b10', border: '1px solid #0a1420' }}>
        <div style={S.label}>{item.label}</div>
        <div style={{ ...S.mono, fontSize: 15, fontWeight: 600, color: item.color }}>{item.value}</div>
      </div>
    ))}
  </div>
);

export default function Scoreboard() {
  const [inputTicker, setInputTicker] = useState('2330');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [gpmDetail, setGpmDetail] = useState(null);
  const [opiDetail, setOpiDetail] = useState(null);
  const [nonOpDetail, setNonOpDetail] = useState(null);
  const [invDetail, setInvDetail] = useState(null);
  const [top100, setTop100] = useState(null);
  const [top100Loading, setTop100Loading] = useState(false);

  const fetchOne = async (url, setter) => {
    try {
      const r = await fetch(url);
      setter(await r.json());
    } catch(e) {}
  };

  const searchAll = async (t) => {
    const tv = (t || inputTicker || '').trim().toUpperCase();
    if (!tv) return;
    setLoading(true);
    setDetail(null); setGpmDetail(null); setOpiDetail(null); setNonOpDetail(null); setInvDetail(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 30000);
    try {
      const r = await fetch(`${API_URL}/api/scoreboard/monthly-rev/${tv}`, { signal: controller.signal });
      const d = await r.json();
      setDetail(d);
      if (d.stats) setStats({ period: d.period, total: d.stats.total, scored: d.stats.scored,
        excluded_low: d.stats.excluded_low, excluded_zero: d.stats.excluded_zero,
        excluded_extreme_hi: d.stats.excluded_extreme_hi, excluded_extreme_lo: d.stats.excluded_extreme_lo });
    } catch(e) { setDetail({ error: `查詢失敗：${e.message}` }); }
    clearTimeout(tid);
    setLoading(false);
    fetchOne(`${API_URL}/api/scoreboard/gpm/${tv}`, setGpmDetail);
    fetchOne(`${API_URL}/api/scoreboard/opi/${tv}`, setOpiDetail);
    fetchOne(`${API_URL}/api/scoreboard/non-op/${tv}`, setNonOpDetail);
    fetchOne(`${API_URL}/api/scoreboard/inv/${tv}`, setInvDetail);
  };

  const loadTop100 = async () => {
    setTop100Loading(true);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 60000);
      const r = await fetch(`${API_URL}/api/scoreboard/top100`, { signal: controller.signal });
      clearTimeout(tid);
      setTop100(await r.json());
    } catch(e) {}
    setTop100Loading(false);
  };

  // 計算總分
  const totalScore = (() => {
    const parts = [
      detail?.score != null ? detail.score * 4 : null,
      gpmDetail?.score != null ? gpmDetail.score * 2 : null,
      opiDetail?.score != null ? opiDetail.score * 2 : null,
      nonOpDetail?.score != null ? nonOpDetail.score * 1 : null,
      invDetail?.score != null ? invDetail.score * 1 : null,
    ];
    const valid = parts.filter(s => s !== null);
    return valid.length > 0 ? valid.reduce((a,b) => a+b, 0) : null;
  })();

  return (
    <div style={S.root}>
      <div style={S.header}>📊 財務計分板</div>
      <div style={S.sub}>FINANCIAL SCORECARD — 公開版</div>

      {/* 統計列 */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
          {[
            { label: '計算月份', value: stats?.period || '-', color: '#90c0dc' },
            { label: '全體股票數', value: stats?.total?.toLocaleString() || '-', color: '#c0d8ea' },
            { label: '總得分（滿分120）',
              value: totalScore != null ? totalScore.toFixed(1) : '-',
              color: totalScore == null ? '#3a6080' : totalScore >= 80 ? '#3ed888' : totalScore >= 50 ? '#d8a840' : '#e05050' },
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 14px', borderRight: '1px solid #0f1c2a' }}>
              <div style={S.label}>{item.label}</div>
              <div style={{ ...S.mono, fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
        {totalScore != null && (
          <div style={{ borderTop: '1px solid #0f1c2a', padding: '8px 14px', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11 }}>
            {[
              { label: '月營收×4', score: detail?.score, mult: 4 },
              { label: '毛利率×2', score: gpmDetail?.score, mult: 2 },
              { label: '營益率×2', score: opiDetail?.score, mult: 2 },
              { label: '業外收支×1', score: nonOpDetail?.score, mult: 1 },
              { label: '存貨×1', score: invDetail?.score, mult: 1 },
            ].map(item => (
              <span key={item.label} style={{ color: '#5a8aaa' }}>
                {item.label}：<b style={{ color: item.score != null ? '#90c0dc' : '#2a4060', fontFamily: "'JetBrains Mono',monospace" }}>
                  {item.score != null ? (item.score * item.mult).toFixed(1) : '-'}
                </b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 搜尋 */}
      <div style={S.card}>
        <div style={{ ...S.label, marginBottom: 10 }}>輸入股票代號查詢評分明細</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={inputTicker} onChange={e => setInputTicker(e.target.value.toUpperCase())}
            onKeyDown={e => { if(e.key==='Enter') searchAll(inputTicker); }}
            style={{ background: '#060910', border: '1px solid #2a5070', padding: '8px 14px', color: '#c0d8ea',
              fontSize: 14, outline: 'none', width: 130, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}
            placeholder="2330" />
          <button style={S.btn} onClick={() => searchAll(inputTicker)} disabled={loading}>
            {loading ? '計算中...' : '查詢'}
          </button>
        </div>

        {/* 個股標題 */}
        {detail && !detail.error && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700,
                background: 'linear-gradient(135deg,#90c0dc,#d0eeff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {detail.ticker}
              </span>
              <span style={{ color: '#8ab0c8', fontSize: 15 }}>{detail.name}</span>
              <span style={{ color: '#3a6080', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>{detail.period}</span>
            </div>

            {/* 月營收得分 */}
            {(detail.status === 'scored' || detail.status === 'scored_over200') && (
              <div style={{ padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a', marginBottom: 8 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>月營收年增率得分</div>
                <StatGrid items={[
                  { label: '月營收年增率', value: detail.yoy != null ? `${detail.yoy>0?'+':''}${detail.yoy?.toFixed(1)}%` : '-',
                    color: detail.yoy >= 0 ? '#3ed888' : '#e05050' },
                  { label: '評分排名', value: detail.rank ? `#${detail.rank}` : '-', color: '#d8a840' },
                  { label: '參與排名家數', value: detail.total_scored?.toLocaleString(), color: '#6a8090' },
                ]} />
                <ScoreBar score={detail.score} />
                <div style={{ marginTop: 6, color: '#5a8aaa', fontSize: 10 }}>
                  評分說明：0分（≤-30%）→ 7分（+30%）→ 10分（≥100%）
                </div>
              </div>
            )}
            {detail.status && detail.status !== 'scored' && detail.status !== 'scored_over200' && (
              <div style={{ color: '#5a8090', fontSize: 12, marginBottom: 8 }}>月營收：{detail.status_label}</div>
            )}

            {/* 毛利率得分 */}
            {gpmDetail?.status === 'scored' && (
              <div style={{ padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a', marginBottom: 8 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>毛利率得分</div>
                <StatGrid items={[
                  { label: '最新季毛利率', value: gpmDetail.gpm != null ? `${gpmDetail.gpm?.toFixed(1)}%` : '-',
                    color: gpmDetail.gpm >= 40 ? '#3ed888' : gpmDetail.gpm >= 10 ? '#90c0dc' : '#e05050' },
                  { label: '上季毛利率', value: gpmDetail.prev_gpm != null ? `${gpmDetail.prev_gpm?.toFixed(1)}%` : '-', color: '#6a8090' },
                  { label: '季增變化', value: gpmDetail.gpm_diff != null ? `${gpmDetail.gpm_diff>0?'+':''}${gpmDetail.gpm_diff?.toFixed(1)}%` : '-',
                    color: gpmDetail.gpm_diff > 0 ? '#3ed888' : gpmDetail.gpm_diff < 0 ? '#e05050' : '#6a8090' },
                ]} />
                <ScoreBar score={gpmDetail.score} />
                <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
                  <span style={{ color: '#5a8aaa', fontSize: 11 }}>排名：<b style={{ color: '#d8a840' }}>#{gpmDetail.rank}</b> / {gpmDetail.total?.toLocaleString()}家</span>
                  {gpmDetail.stats && <span style={{ color: '#5a8aaa', fontSize: 11 }}>極端值參考範圍（不影響評分）：高{gpmDetail.stats.excluded_extreme_hi}+低{gpmDetail.stats.excluded_extreme_lo}家</span>}
                </div>
                <div style={{ marginTop: 4, color: '#5a8aaa', fontSize: 10 }}>
                  評分說明：&lt;10%→0分 ｜ 10%~40%→線性0~10分 ｜ ≥40%→10分 ｜ 季增每1pp加0.1分，上限+5分
                </div>
              </div>
            )}

            {/* 營益率得分 */}
            {opiDetail?.status === 'scored' && (
              <div style={{ padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a', marginBottom: 8 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>營益率得分</div>
                <StatGrid items={[
                  { label: '最新季營益率', value: opiDetail.opi != null ? `${opiDetail.opi?.toFixed(1)}%` : '-',
                    color: opiDetail.opi >= 25 ? '#3ed888' : opiDetail.opi >= 0 ? '#90c0dc' : '#e05050' },
                  { label: '上季營益率', value: opiDetail.prev_opi != null ? `${opiDetail.prev_opi?.toFixed(1)}%` : '-', color: '#6a8090' },
                  { label: '季增變化', value: opiDetail.opi_diff != null ? `${opiDetail.opi_diff>0?'+':''}${opiDetail.opi_diff?.toFixed(1)}%` : '-',
                    color: opiDetail.opi_diff > 0 ? '#3ed888' : opiDetail.opi_diff < 0 ? '#e05050' : '#6a8090' },
                ]} />
                <ScoreBar score={opiDetail.score} />
                <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
                  <span style={{ color: '#5a8aaa', fontSize: 11 }}>排名：<b style={{ color: '#d8a840' }}>#{opiDetail.rank}</b> / {opiDetail.total?.toLocaleString()}家</span>
                  {opiDetail.stats && <span style={{ color: '#5a8aaa', fontSize: 11 }}>極端值參考範圍（不影響評分）：高{opiDetail.stats.excluded_extreme_hi}+低{opiDetail.stats.excluded_extreme_lo}家</span>}
                </div>
                <div style={{ marginTop: 4, color: '#5a8aaa', fontSize: 10 }}>
                  評分說明：&lt;0%→0分 ｜ 0%~25%→線性0~10分 ｜ ≥25%→10分 ｜ 季增每1pp加0.1分，上限+5分
                </div>
              </div>
            )}

            {/* 業外收支 */}
            {nonOpDetail?.status === 'scored' && (
              <div style={{ padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a', marginBottom: 8 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>業外收支/營業收入得分</div>
                <StatGrid items={[
                  { label: '業外收支/營收', value: nonOpDetail.ratio != null ? `${nonOpDetail.ratio>0?'+':''}${nonOpDetail.ratio?.toFixed(1)}%` : '-',
                    color: Math.abs(nonOpDetail.ratio||0) < 3 ? '#3ed888' : Math.abs(nonOpDetail.ratio||0) < 7 ? '#d8a840' : '#e05050' },
                  { label: '排名', value: nonOpDetail.rank ? `#${nonOpDetail.rank} / ${nonOpDetail.total?.toLocaleString()}家` : '-', color: '#d8a840' },
                ]} />
                <ScoreBar score={nonOpDetail.score} />
                <div style={{ marginTop: 4, color: '#5a8aaa', fontSize: 10 }}>
                  評分說明：0%→10分 ｜ ±10%→0分 ｜ 越接近0分數越高
                </div>
              </div>
            )}

            {/* 存貨 */}
            {invDetail?.status === 'scored' && (
              <div style={{ padding: '14px 16px', background: '#070a0f', border: '1px solid #0f1c2a', marginBottom: 8 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>存貨 × 存貨週轉天數得分</div>
                <StatGrid items={[
                  { label: '存貨（億）', value: invDetail.inv?.toFixed(2),
                    color: invDetail.inv > invDetail.prev_inv ? '#3ed888' : '#e05050' },
                  { label: '上季存貨（億）', value: invDetail.prev_inv?.toFixed(2), color: '#6a8090' },
                  { label: '週轉天數', value: invDetail.inv_days != null ? `${invDetail.inv_days}天` : '-',
                    color: invDetail.days_down ? '#3ed888' : '#e05050' },
                  { label: '上季週轉天數', value: invDetail.prev_inv_days != null ? `${invDetail.prev_inv_days}天` : '-', color: '#6a8090' },
                ]} />
                <div style={{ marginBottom: 8, padding: '6px 12px', background: '#0a1020', border: '1px solid #1a3040',
                  color: invDetail.score === 10 ? '#3ed888' : '#d8a840', fontSize: 13, fontWeight: 600 }}>
                  組合判斷：{invDetail.combo_label}
                </div>
                <ScoreBar score={invDetail.score} />
                <div style={{ marginTop: 6, color: '#5a8aaa', fontSize: 11 }}>
                  排名：<b style={{ color: '#d8a840' }}>#{invDetail.rank}</b> / {invDetail.total?.toLocaleString()}家
                </div>
              </div>
            )}
          </div>
        )}
        {detail?.error && <div style={{ color: '#e05050', fontSize: 12, marginTop: 12 }}>❌ {detail.error}</div>}
      </div>

      {/* 排行榜 */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ ...S.label, marginBottom: 0 }}>🏆 總分前100名排行榜</span>
          <button style={{ ...S.btn, padding: '5px 14px', fontSize: 11 }}
            onClick={loadTop100} disabled={top100Loading}>
            {top100Loading ? '載入中（約15秒）...' : (top100 ? '重新載入' : '載入排行榜')}
          </button>
          {top100 && <span style={{ color: '#5a8aaa', fontSize: 11 }}>
            {top100.period} ｜ 共{top100.total_stocks?.toLocaleString()}家參與計算
          </span>}
        </div>

        {top100 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#070a0f' }}>
                  {['排名','代號','名稱','總分','月營收年增率','毛利率','營益率','業外收支/營收','存貨狀態'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: ['名稱'].includes(h)?'left':'center',
                      color: '#6a98b8', fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1,
                      borderBottom: '1px solid #1a2a3c', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top100.data.map((r, i) => (
                  <tr key={r.ticker}
                    onClick={() => { setInputTicker(r.ticker); searchAll(r.ticker); window.scrollTo(0,300); }}
                    style={{ cursor: 'pointer', background: i%2===0?'#080b10':'#070a0e', borderBottom: '1px solid #090d14' }}
                    onMouseEnter={e => e.currentTarget.style.background='#0d1828'}
                    onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#080b10':'#070a0e'}>
                    <td style={{ padding: '5px 10px', textAlign: 'center', color: i<3?'#f0c040':'#3a6080',
                      fontFamily: "'JetBrains Mono',monospace", fontWeight: i<3?700:400 }}>
                      {i<3 ? ['🥇','🥈','🥉'][i] : i+1}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'center', fontFamily: "'Rajdhani',sans-serif",
                      fontWeight: 700, background: 'linear-gradient(135deg,#70a8c8,#b0d8f0)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {r.ticker}
                    </td>
                    <td style={{ padding: '5px 10px', color: '#90b8d0', whiteSpace: 'nowrap' }}>{r.name}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 700, color: r.total >= 80 ? '#3ed888' : r.total >= 50 ? '#d8a840' : '#90c0dc' }}>
                      {r.total}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace",
                      color: r.yoy >= 30 ? '#3ed888' : r.yoy >= 0 ? '#90c0dc' : '#e05050' }}>
                      {r.yoy != null ? `${r.yoy>0?'+':''}${r.yoy?.toFixed(1)}%` : '-'}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace",
                      color: r.gpm >= 40 ? '#3ed888' : r.gpm >= 10 ? '#90c0dc' : '#e05050' }}>
                      {r.gpm != null ? `${r.gpm?.toFixed(1)}%` : '-'}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace",
                      color: r.opi >= 25 ? '#3ed888' : r.opi >= 0 ? '#90c0dc' : '#e05050' }}>
                      {r.opi != null ? `${r.opi?.toFixed(1)}%` : '-'}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace",
                      color: Math.abs(r.nonop_ratio||0) < 3 ? '#3ed888' : Math.abs(r.nonop_ratio||0) < 7 ? '#d8a840' : '#e05050' }}>
                      {r.nonop_ratio != null ? `${r.nonop_ratio>0?'+':''}${r.nonop_ratio?.toFixed(1)}%` : '-'}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'center', whiteSpace: 'nowrap', fontSize: 11,
                      color: r.inv_combo?.includes('↑') && r.inv_combo?.includes('↓') ? '#3ed888' : '#d8a840' }}>
                      {r.inv_combo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
