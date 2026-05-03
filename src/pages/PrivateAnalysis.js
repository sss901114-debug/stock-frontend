import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';
const PASSWORD = 'sss901114';

const S = {
  sec: { background: '#080b10', border: '1px solid #1a2a3c', marginBottom: 1, padding: '16px 20px' },
  label: { color: '#6a98b8', fontSize: 10, letterSpacing: 3, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, marginBottom: 8, display: 'block' },
  input: { width: '100%', background: '#060910', border: '1px solid #2a5070', padding: '8px 12px', color: '#c0d8ea', fontSize: 13, outline: 'none', fontFamily: "'Barlow',sans-serif", marginBottom: 8 },
  btn: (bg='#2e5872') => ({ padding: '7px 18px', background: `linear-gradient(135deg,${bg},${bg}bb)`, color: '#eef8ff', border: 'none', cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, marginRight: 8 }),
  title: { fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#6a98b8', marginBottom: 10 },
};

export default function PrivateAnalysis({ ticker: globalTicker = '2330' }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');

  // 當前分析個股（預設使用個股總覽的股票）
  const [analysisTicker, setAnalysisTicker] = useState(globalTicker);
  const [companyName, setCompanyName] = useState('');

  // 營收分析
  const [revAnalysis, setRevAnalysis] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [aiInterpret, setAiInterpret] = useState('');
  const [aiInterpretLoading, setAiInterpretLoading] = useState(false);
  const [revLoading, setRevLoading] = useState(false);
  const [revData, setRevData] = useState(null);

  // AI 問答
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // 筆記
  const [ticker, setTicker] = useState('');
  const [title, setTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterTicker, setFilterTicker] = useState('');

  useEffect(() => {
    if (authed) {
      loadNotes();
      setAnalysisTicker(globalTicker);
    }
  }, [authed, globalTicker]);

  useEffect(() => {
    if (authed && analysisTicker) fetchRevData(analysisTicker);
  }, [analysisTicker, authed]);

  const fetchRevData = async (t) => {
    try {
      const [qRes, mRes, infoRes] = await Promise.all([
        fetch(`${API_URL}/api/company/${t}/quarterly?limit=9999`),
        fetch(`${API_URL}/api/company/${t}/monthly?limit=9999`),
        fetch(`${API_URL}/api/company/${t}/info`),
      ]);
      const qData = await qRes.json();
      const mData = await mRes.json();
      const info = await infoRes.json();
      setCompanyName(info.name || t);
      setRevData({ qData, mData });
    } catch(e) { setRevData(null); }
  };

  const runRevAnalysis = async () => {
    if (!revData) return;
    setRevLoading(true); setRevAnalysis('');

    const { qData, mData } = revData;

    // 整理季度營收（近16季）
    const qRevLines = qData.slice().reverse().map(q =>
      `${q['期別']}：${q['營業收入_億']}億 毛利率${q['毛利率']}% 營收年增率${q['營收年增率']}%`
    ).join('\n');

    // 整理月營收（近36個月）
    const mRevLines = mData.slice().reverse().map(m =>
      `${m.period}：${m.revenue ? (m.revenue/100000).toFixed(2) : '-'}億 年增率${m.yoy_pct != null ? Number(m.yoy_pct).toFixed(1) : '-'}% 月增率${m.mom_pct != null ? Number(m.mom_pct).toFixed(1) : '-'}%`
    ).join('\n');

    const prompt = `請對 ${companyName}（${analysisTicker}）的營業收入進行深度分析。

【季度營收（全部歷史資料，由舊到新）】
${qRevLines}

【月營收（全部歷史資料，由舊到新）】
${mRevLines}

資料涵蓋完整歷史（從最早有資料的年月起），樣本數足夠分析完整景氣循環。請從以下三個面向分析，每個面向200字，具體引用年份與數字：

一、淡旺季規律
分析每年哪幾個月/哪一季是旺季、哪幾個月/季是淡季，並說明規律是否穩定，有無近年變化。

二、景氣循環（擴張與收縮）
從完整歷史年增率的變化，找出每一輪景氣擴張期（年增率持續正成長）和收縮期（年增率持續負成長或下滑）的起訖時間與持續長度，歸納出這家公司歷次景氣循環的規律，並判斷目前處於哪個階段、已持續多久、距離上一次轉折約多少個月。

三、近期趨勢判斷
綜合近3～6個月的月營收和近2～4季的季營收，判斷目前是加速成長、趨緩、還是轉折向上/向下，給出明確判斷。`;

    try {
      const r = await fetch(`${API_URL}/api/private-ai-query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, pw: PASSWORD })
      });
      const d = await r.json();
      setRevAnalysis(d.result || d.error || '無回應');
    } catch(e) { setRevAnalysis('❌ 失敗'); }
    setRevLoading(false);
  };

  const loadNotes = () => {
    fetch(`${API_URL}/api/private-notes?pw=${PASSWORD}`)
      .then(r => r.json()).then(d => setNotes(d.notes || [])).catch(() => {});
  };

  const saveNote = () => {
    if (!title.trim() && !noteContent.trim()) return;
    setSaving(true);
    const body = { ticker, title, content: noteContent, pw: PASSWORD };
    const url = editId ? `${API_URL}/api/private-notes/${editId}` : `${API_URL}/api/private-notes`;
    fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.json()).then(() => {
        setMsg('✅ 儲存成功'); setSaving(false); loadNotes();
        setTitle(''); setNoteContent(''); setTicker(''); setEditId(null);
        setTimeout(() => setMsg(''), 2000);
      }).catch(() => { setSaving(false); setMsg('❌ 儲存失敗'); });
  };

  const deleteNote = (id) => {
    if (!window.confirm('確定刪除？')) return;
    fetch(`${API_URL}/api/private-notes/${id}?pw=${PASSWORD}`, { method: 'DELETE' }).then(() => loadNotes());
  };

  const editNote = (n) => {
    setEditId(n.id); setTicker(n.ticker||''); setTitle(n.title||''); setNoteContent(n.content||'');
    window.scrollTo(0, 0);
  };

  const runAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiResult('');
    try {
      const r = await fetch(`${API_URL}/api/private-ai-query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, pw: PASSWORD })
      });
      const d = await r.json();
      setAiResult(d.result || d.error || '無回應');
    } catch(e) { setAiResult('❌ 失敗'); }
    setAiLoading(false);
  };

  // ── 登入頁 ──
  if (!authed) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ background: '#0a0f1a', border: '1px solid #2a4a62', padding: '40px 48px', minWidth: 320 }}>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 3, color: '#90c0dc', marginBottom: 24, textAlign: 'center' }}>
          📡 財報雷達站
        </div>
        <div style={{ color: '#3a6080', fontSize: 10, letterSpacing: 2, marginBottom: 6, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>PASSWORD</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { if (pw === PASSWORD) { setAuthed(true); setPwErr(''); } else setPwErr('密碼錯誤'); }}}
          style={{ ...S.input, letterSpacing: 4, fontSize: 16 }} placeholder="••••••••" />
        {pwErr && <div style={{ color: '#e05050', fontSize: 12, marginBottom: 8 }}>{pwErr}</div>}
        <button style={{ ...S.btn(), width: '100%', padding: '10px' }}
          onClick={() => { if (pw === PASSWORD) { setAuthed(true); setPwErr(''); } else setPwErr('密碼錯誤'); }}>
          進入
        </button>
      </div>
    </div>
  );

  const filtered = filterTicker ? notes.filter(n => n.ticker?.includes(filterTicker.toUpperCase())) : notes;

  return (
    <div style={{ padding: 16, maxWidth: 1100 }}>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 3, color: '#90c0dc', marginBottom: 16, borderBottom: '1px solid #1a2a3c', paddingBottom: 10 }}>
        📡 財報雷達站
      </div>

      {/* ── 1. 營收分析 ── */}
      <div style={S.sec}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <span style={{ ...S.label, marginBottom: 0 }}>📈 一、營收分析</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input value={analysisTicker} onChange={e => setAnalysisTicker(e.target.value.toUpperCase())}
              style={{ ...S.input, width: 90, marginBottom: 0, textAlign: 'center', fontSize: 14, fontWeight: 700 }} />
            {companyName && <span style={{ color: '#5a8090', fontSize: 12 }}>{companyName}</span>}
          </div>
          <button style={S.btn()} onClick={runRevAnalysis} disabled={revLoading}>
            {revLoading ? '分析中...' : '開始分析'}
          </button>
        </div>

        {revLoading && (
          <div style={{ color: '#3a6080', fontSize: 12, padding: '12px 0', letterSpacing: 2 }}>
            ⏳ 正在分析淡旺季與景氣循環...
          </div>
        )}

        {revAnalysis && (
          <div style={{ color: '#a8c8e0', fontSize: 14, lineHeight: 2.0, whiteSpace: 'pre-wrap', borderTop: '1px solid #1a2a3c', paddingTop: 14, marginTop: 4 }}>
            {revAnalysis}
          </div>
        )}
      </div>


      {/* ── 2. 統計相關分析 ── */}
      <div style={S.sec}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ ...S.label, marginBottom: 0 }}>📐 二、財務指標統計分析</span>
          <button style={S.btn()} onClick={() => fetchStats(analysisTicker)} disabled={statsLoading}>
            {statsLoading ? '計算中...' : '開始計算'}
          </button>
          {stats && !stats.error && (
            <button style={S.btn('#1e4a3a')} onClick={interpretStats} disabled={aiInterpretLoading}>
              {aiInterpretLoading ? 'AI解讀中...' : '🤖 AI解讀'}
            </button>
          )}
        </div>

        {stats && !stats.error && (
          <div>
            <div style={{ color: '#3a6080', fontSize: 10, marginBottom: 12 }}>
              資料期間：{stats.start} ～ {stats.end}（共 {stats.periods} 季）
            </div>

            {/* 相關係數表 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#070a0f' }}>
                  {['分析項目','相關係數 r','顯著性 p','解讀'].map(h =>
                    <th key={h} style={{ padding: '5px 10px', textAlign: 'left', color: '#3a6080', fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1, borderBottom: '1px solid #1a2a3c', fontWeight: 600 }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {[
                  stats.rev_gp_corr,
                  stats.rev_raw_material_corr,
                  stats.rev_wip_corr,
                  stats.rev_finished_goods_corr,
                ].filter(Boolean).map((item, i) => {
                  const r = item.r;
                  const level = Math.abs(r) > 0.7 ? {label:'高度相關',color:'#3ed888'} : Math.abs(r) > 0.4 ? {label:'中度相關',color:'#d8a840'} : {label:'低度相關',color:'#6a8090'};
                  return (
                    <tr key={i} style={{ background: i%2===0?'#080b10':'#070a0e', borderBottom: '1px solid #0d1820' }}>
                      <td style={{ padding: '5px 10px', color: '#8ab0cc' }}>{item.label}</td>
                      <td style={{ padding: '5px 10px', color: r > 0 ? '#3ed888' : '#e05050', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{r}</td>
                      <td style={{ padding: '5px 10px', color: item.p < 0.05 ? '#3ed888' : '#6a8090', fontFamily: "'JetBrains Mono',monospace" }}>{item.p < 0.05 ? '★顯著' : item.p}</td>
                      <td style={{ padding: '5px 10px', color: level.color }}>{level.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 落後關係 */}
            <div style={{ color: '#6a98b8', fontSize: 10, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, marginBottom: 6 }}>落後關係（N季後反映在營收）</div>
            {[stats.rev_inv_lag, stats.rev_capex_lag, stats.rev_intg_lag, stats.rev_cl_lag].filter(Boolean).map((item, i) => {
              const best = item.lags[item.best_lag];
              return (
                <div key={i} style={{ marginBottom: 8, padding: '8px 12px', background: '#070a0f', border: '1px solid #0d1820' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8ab0cc', fontSize: 12 }}>{item.label}</span>
                    <span style={{ color: '#d8a840', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                      最佳落後：{item.best_lag}季 (r={best?.r})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {Object.entries(item.lags).map(([lag, v]) => (
                      <span key={lag} style={{ fontSize: 10, color: lag==item.best_lag?'#d8a840':'#3a6080',
                        background: lag==item.best_lag?'#1e2a0a':'#0a0d12', padding: '2px 8px' }}>
                        {lag}季落後: r={v.r}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 信號分析 */}
            {stats.inv_ar_signal && (
              <div style={{ padding: '10px 14px', background: '#070a0f', border: '1px solid #0d1820', marginTop: 8 }}>
                <div style={{ color: '#6a98b8', fontSize: 10, letterSpacing: 2, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, marginBottom: 6 }}>信號分析：{stats.inv_ar_signal.label}</div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <span style={{ color: '#8ab0cc', fontSize: 12 }}>歷史信號次數：<b style={{ color: '#c0d8ea' }}>{stats.inv_ar_signal.signals}次</b></span>
                  <span style={{ color: '#8ab0cc', fontSize: 12 }}>命中次數：<b style={{ color: '#3ed888' }}>{stats.inv_ar_signal.correct}次</b></span>
                  <span style={{ color: '#8ab0cc', fontSize: 12 }}>命中率：<b style={{ color: stats.inv_ar_signal.hit_rate >= 60 ? '#3ed888' : '#d8a840', fontSize: 16 }}>{stats.inv_ar_signal.hit_rate}%</b></span>
                </div>
              </div>
            )}
          </div>
        )}

        {stats?.error && <div style={{ color: '#e05050', fontSize: 12 }}>❌ {stats.error}</div>}

        {/* AI 解讀 */}
        {aiInterpret && (
          <div style={{ marginTop: 14, color: '#a8c8e0', fontSize: 14, lineHeight: 2.0, whiteSpace: 'pre-wrap', borderTop: '1px solid #1a2a3c', paddingTop: 14 }}>
            {aiInterpret}
          </div>
        )}
      </div>

    </div>
  );
}