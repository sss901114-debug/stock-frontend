import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';
const PASSWORD = 'sss901114';

const sectionStyle = {
  background: '#080b10', border: '1px solid #1a2a3c',
  marginBottom: 1, padding: '16px 20px'
};
const labelStyle = {
  color: '#5a8aaa', fontSize: 10, letterSpacing: 3,
  fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
  marginBottom: 6, display: 'block'
};
const inputStyle = {
  width: '100%', background: '#060910', border: '1px solid #2a5070',
  padding: '8px 12px', color: '#c0d8ea', fontSize: 13, outline: 'none',
  fontFamily: "'Barlow',sans-serif", marginBottom: 8
};
const btnStyle = (color='#2e5872') => ({
  padding: '7px 18px', background: `linear-gradient(135deg,${color},${color}cc)`,
  color: '#eef8ff', border: 'none', cursor: 'pointer',
  fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
  fontSize: 12, letterSpacing: 2, marginRight: 8
});

export default function PrivateAnalysis() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');

  // 分析筆記 state
  const [ticker, setTicker] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [filterTicker, setFilterTicker] = useState('');

  useEffect(() => {
    if (authed) loadNotes();
  }, [authed]);

  const loadNotes = () => {
    fetch(`${API_URL}/api/private-notes?pw=${PASSWORD}`)
      .then(r => r.json()).then(d => setNotes(d.notes || [])).catch(() => {});
  };

  const saveNote = () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    const body = { ticker, title, content, pw: PASSWORD };
    const url = editId
      ? `${API_URL}/api/private-notes/${editId}`
      : `${API_URL}/api/private-notes`;
    const method = editId ? 'PUT' : 'POST';
    fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
      .then(r => r.json()).then(() => {
        setMsg('✅ 儲存成功');
        setSaving(false); loadNotes();
        setTitle(''); setContent(''); setTicker(''); setEditId(null);
        setTimeout(() => setMsg(''), 2000);
      }).catch(() => { setSaving(false); setMsg('❌ 儲存失敗'); });
  };

  const deleteNote = (id) => {
    if (!window.confirm('確定刪除？')) return;
    fetch(`${API_URL}/api/private-notes/${id}?pw=${PASSWORD}`, { method: 'DELETE' })
      .then(() => loadNotes());
  };

  const editNote = (n) => {
    setEditId(n.id); setTicker(n.ticker||''); setTitle(n.title||''); setContent(n.content||'');
    window.scrollTo(0, 0);
  };

  const runAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiResult('');
    try {
      const r = await fetch(`${API_URL}/api/private-ai-query`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
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
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700,
          letterSpacing: 3, color: '#90c0dc', marginBottom: 24, textAlign: 'center' }}>
          🔒 私密分析
        </div>
        <div style={{ color: '#3a6080', fontSize: 10, letterSpacing: 2, marginBottom: 6,
          fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>PASSWORD</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter') { if(pw===PASSWORD){setAuthed(true);setPwErr('');}else setPwErr('密碼錯誤'); }}}
          style={{ ...inputStyle, letterSpacing: 4, fontSize: 16 }} placeholder="••••••••" />
        {pwErr && <div style={{ color: '#e05050', fontSize: 12, marginBottom: 8 }}>{pwErr}</div>}
        <button style={{ ...btnStyle(), width: '100%', padding: '10px' }}
          onClick={() => { if(pw===PASSWORD){setAuthed(true);setPwErr('');}else setPwErr('密碼錯誤'); }}>
          進入
        </button>
      </div>
    </div>
  );

  const filtered = filterTicker
    ? notes.filter(n => n.ticker && n.ticker.includes(filterTicker.toUpperCase()))
    : notes;

  return (
    <div style={{ padding: 16, maxWidth: 1100 }}>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700,
        letterSpacing: 3, color: '#90c0dc', marginBottom: 16,
        borderBottom: '1px solid #1a2a3c', paddingBottom: 10 }}>
        🔒 私密個股分析
      </div>

      {/* ── 新增/編輯筆記 ── */}
      <div style={sectionStyle}>
        <span style={labelStyle}>{editId ? '✏️ 編輯筆記' : '✏️ 新增分析筆記'}</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
            style={{ ...inputStyle, width: 120, marginBottom: 0 }} placeholder="股票代號" />
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }} placeholder="標題" />
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          style={{ ...inputStyle, height: 140, resize: 'vertical', lineHeight: 1.8 }}
          placeholder="私密分析內容、投資邏輯、注意事項..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={btnStyle('#2e5872')} onClick={saveNote} disabled={saving}>
            {saving ? '儲存中...' : (editId ? '更新' : '儲存')}
          </button>
          {editId && <button style={btnStyle('#3a3a3a')} onClick={() => {setEditId(null);setTitle('');setContent('');setTicker('');}}>取消</button>}
          {msg && <span style={{ color: '#3ed888', fontSize: 12 }}>{msg}</span>}
        </div>
      </div>

      {/* ── AI 私密問答 ── */}
      <div style={sectionStyle}>
        <span style={labelStyle}>🤖 AI 私密問答（不對外顯示）</span>
        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
          style={{ ...inputStyle, height: 90, resize: 'vertical' }}
          placeholder="輸入你的私密投資問題，例如：2330 現在值得加碼嗎？" />
        <button style={btnStyle('#2e5872')} onClick={runAi} disabled={aiLoading}>
          {aiLoading ? '分析中...' : '送出'}
        </button>
        {aiResult && (
          <div style={{ marginTop: 12, color: '#a0c0d8', fontSize: 14, lineHeight: 1.9,
            whiteSpace: 'pre-wrap', borderTop: '1px solid #1a2a3c', paddingTop: 12 }}>
            {aiResult}
          </div>
        )}
      </div>

      {/* ── 筆記清單 ── */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={labelStyle}>📋 分析筆記（{notes.length} 筆）</span>
          <input value={filterTicker} onChange={e => setFilterTicker(e.target.value)}
            style={{ ...inputStyle, width: 120, marginBottom: 0, fontSize: 11, padding: '4px 8px' }}
            placeholder="篩選代號..." />
        </div>
        {filtered.length === 0
          ? <div style={{ color: '#2a4060', fontSize: 12, padding: '10px 0' }}>尚無筆記</div>
          : filtered.map(n => (
            <div key={n.id} style={{ borderBottom: '1px solid #0f1c2a', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {n.ticker && <span style={{ background: '#1e3a52', color: '#90c0dc',
                    padding: '2px 8px', fontSize: 11, fontFamily: "'Rajdhani',sans-serif",
                    fontWeight: 700, marginRight: 8 }}>{n.ticker}</span>}
                  <span style={{ color: '#c0d8ea', fontSize: 14, fontWeight: 500 }}>{n.title}</span>
                  <span style={{ color: '#2a4060', fontSize: 10, marginLeft: 10 }}>{n.created_at?.slice(0,10)}</span>
                </div>
                <div>
                  <button style={{ ...btnStyle('#1e3a52'), padding: '3px 10px', fontSize: 11 }}
                    onClick={() => editNote(n)}>編輯</button>
                  <button style={{ ...btnStyle('#3a1e1e'), padding: '3px 10px', fontSize: 11 }}
                    onClick={() => deleteNote(n.id)}>刪除</button>
                </div>
              </div>
              {n.content && <div style={{ color: '#6a90a8', fontSize: 13, marginTop: 6,
                lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.content}</div>}
            </div>
          ))}
      </div>
    </div>
  );
}
