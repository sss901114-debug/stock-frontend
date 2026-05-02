import React, { useState } from 'react';

const API = 'https://stock-api-production-913a.up.railway.app';
const CORRECT_PW = 'sss901114';

export default function RulesManager() {
  const [pw, setPw]           = useState('');
  const [authed, setAuthed]   = useState(false);
  const [rules, setRules]     = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const login = async () => {
    if (pw !== CORRECT_PW) { setMsg('❌ 密碼錯誤'); return; }
    setLoading(true); setMsg('');
    try {
      const res = await fetch(`${API}/api/analysis-rules?pw=${pw}`);
      const data = await res.json();
      if (data.ok) { setRules(data.content); setAuthed(true); }
      else setMsg('❌ ' + data.error);
    } catch(e) { setMsg('❌ 連線失敗'); }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch(`${API}/api/analysis-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rules, pw: CORRECT_PW })
      });
      const data = await res.json();
      setMsg(data.ok ? '✅ 儲存成功！' : '❌ 儲存失敗');
    } catch(e) { setMsg('❌ 連線失敗'); }
    setSaving(false);
  };

  if (!authed) return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 32, background: '#1e2a3a', borderRadius: 12 }}>
      <h2 style={{ color: '#4C9BB8', marginBottom: 24, fontSize: 20 }}>🔐 個人分析規則管理</h2>
      <input
        type="password" placeholder="請輸入管理密碼"
        value={pw} onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && login()}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a',
          background: '#151f2e', color: '#fff', fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }}
      />
      <button onClick={login} disabled={loading}
        style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: '#4C9BB8', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        {loading ? '載入中...' : '進入'}
      </button>
      {msg && <div style={{ marginTop: 12, color: '#e05c5c' }}>{msg}</div>}
    </div>
  );

  return (
    <div style={{ padding: '16px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#4C9BB8', fontSize: 20, margin: 0 }}>📋 個人分析規則管理</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {msg && <span style={{ color: msg.startsWith('✅') ? '#4ec94e' : '#e05c5c', fontSize: 14 }}>{msg}</span>}
          <button onClick={save} disabled={saving}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none',
              background: saving ? '#555' : '#4ec94e', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? '儲存中...' : '💾 儲存'}
          </button>
          <button onClick={() => setAuthed(false)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #555',
              background: 'transparent', color: '#888', cursor: 'pointer' }}>
            登出
          </button>
        </div>
      </div>

      <div style={{ background: '#1a2535', borderRadius: 8, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#aaa' }}>
        📝 可直接在下方編輯、新增或刪除規則，編輯完畢後按「儲存」即自動更新到雲端。
      </div>

      <textarea
        value={rules}
        onChange={e => setRules(e.target.value)}
        style={{ width: '100%', height: 'calc(100vh - 250px)', padding: '16px',
          background: '#151f2e', color: '#ddd', border: '1px solid #2a3a4a',
          borderRadius: 8, fontSize: 14, lineHeight: 1.8, fontFamily: 'monospace',
          resize: 'vertical', boxSizing: 'border-box' }}
      />

      <div style={{ marginTop: 8, color: '#555', fontSize: 12 }}>
        字數：{rules.length} 字元
      </div>
    </div>
  );
}
