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
        fetch(`${API_URL}/api/company/${t}/quarterly`),
        fetch(`${API_URL}/api/company/${t}/monthly`),
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
    const qRevLines = qData.slice(0, 16).map(q =>
      `${q['期別']}：${q['營業收入_億']}億 毛利率${q['毛利率']}% 營收年增率${q['營收年增率']}%`
    ).join('\n');

    // 整理月營收（近36個月）
    const mRevLines = mData.slice(0, 36).map(m =>
      `${m.period}：${m.revenue ? (m.revenue/100000).toFixed(2) : '-'}億 年增率${m.yoy_pct != null ? Number(m.yoy_pct).toFixed(1) : '-'}% 月增率${m.mom_pct != null ? Number(m.mom_pct).toFixed(1) : '-'}%`
    ).join('\n');

    const prompt = `請對 ${companyName}（${analysisTicker}）的營業收入進行深度分析。

【季度營收（近16季，由新到舊）】
${qRevLines}

【月營收（近36個月，由新到舊）】
${mRevLines}

請從以下三個面向分析，每個面向150字，具體引用數字：

一、淡旺季規律
分析每年哪幾個月/哪一季是旺季、哪幾個月/季是淡季，並說明規律是否穩定，有無近年變化。

二、景氣循環（擴張與收縮）
從年增率的高低變化，找出近年景氣擴張期（年增率持續正成長）和收縮期（年增率持續負成長或下滑）的起訖時間，並分析目前處於哪個階段。

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

      {/* ── 2. AI 私密問答 ── */}
      <div style={S.sec}>
        <span style={S.label}>🤖 二、AI 私密問答（不對外顯示）</span>
        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
          style={{ ...S.input, height: 90, resize: 'vertical' }}
          placeholder={`針對 ${analysisTicker} 或任何投資問題，直接問...`} />
        <button style={S.btn()} onClick={runAi} disabled={aiLoading}>
          {aiLoading ? '分析中...' : '送出'}
        </button>
        {aiResult && (
          <div style={{ marginTop: 12, color: '#a0c0d8', fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap', borderTop: '1px solid #1a2a3c', paddingTop: 12 }}>
            {aiResult}
          </div>
        )}
      </div>

      {/* ── 3. 私密筆記 ── */}
      <div style={S.sec}>
        <span style={S.label}>{editId ? '✏️ 編輯筆記' : '✏️ 三、新增分析筆記'}</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
            style={{ ...S.input, width: 110, marginBottom: 0 }} placeholder="代號" />
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{ ...S.input, flex: 1, marginBottom: 0 }} placeholder="標題" />
        </div>
        <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
          style={{ ...S.input, height: 130, resize: 'vertical', lineHeight: 1.8 }}
          placeholder="私密投資邏輯、買賣紀錄、注意事項..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={S.btn()} onClick={saveNote} disabled={saving}>{saving ? '儲存中...' : (editId ? '更新' : '儲存')}</button>
          {editId && <button style={S.btn('#3a3a3a')} onClick={() => { setEditId(null); setTitle(''); setNoteContent(''); setTicker(''); }}>取消</button>}
          {msg && <span style={{ color: '#3ed888', fontSize: 12 }}>{msg}</span>}
        </div>
      </div>

      {/* ── 4. 筆記清單 ── */}
      <div style={S.sec}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={S.label}>📋 四、分析筆記（{notes.length} 筆）</span>
          <input value={filterTicker} onChange={e => setFilterTicker(e.target.value)}
            style={{ ...S.input, width: 110, marginBottom: 0, fontSize: 11, padding: '4px 8px' }} placeholder="篩選代號..." />
        </div>
        {filtered.length === 0
          ? <div style={{ color: '#2a4060', fontSize: 12 }}>尚無筆記</div>
          : filtered.map(n => (
            <div key={n.id} style={{ borderBottom: '1px solid #0f1c2a', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {n.ticker && <span style={{ background: '#1e3a52', color: '#90c0dc', padding: '2px 8px', fontSize: 11, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, marginRight: 8 }}>{n.ticker}</span>}
                  <span style={{ color: '#c0d8ea', fontSize: 14, fontWeight: 500 }}>{n.title}</span>
                  <span style={{ color: '#2a4060', fontSize: 10, marginLeft: 10 }}>{n.created_at?.slice(0,10)}</span>
                </div>
                <div>
                  <button style={{ ...S.btn('#1e3a52'), padding: '3px 10px', fontSize: 11 }} onClick={() => editNote(n)}>編輯</button>
                  <button style={{ ...S.btn('#3a1e1e'), padding: '3px 10px', fontSize: 11 }} onClick={() => deleteNote(n.id)}>刪除</button>
                </div>
              </div>
              {n.content && <div style={{ color: '#6a90a8', fontSize: 13, marginTop: 6, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.content}</div>}
            </div>
          ))}
      </div>
    </div>
  );
}
