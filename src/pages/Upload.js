import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'https://stock-api-production-913a.up.railway.app';

const FILE_TYPES = [
  { key: 'monthly', label: '📅 月報', desc: '格式：YYYYMM月報.xlsx，可一次選多檔', endpoint: '/api/upload/monthly', accept: '.xlsx' },
  { key: 'q-income', label: '📊 季報－損益表', desc: '格式：YYYYMM損益表.xlsx', endpoint: '/api/upload/quarterly-income', accept: '.xlsx' },
  { key: 'q-balance', label: '🏦 季報－資產負債表', desc: '格式：YYYYMM資產負債表.xlsx', endpoint: '/api/upload/quarterly-balance', accept: '.xlsx' },
  { key: 'q-cashflow', label: '💵 季報－現金流量表', desc: '格式：YYYYMM現金流量表.xlsx', endpoint: '/api/upload/quarterly-cashflow', accept: '.xlsx' },
  { key: 'annual', label: '📈 年報', desc: '格式：YYYY年報.xlsx', endpoint: '/api/upload/annual', accept: '.xlsx' },
  { key: 'dividends', label: '💰 現金股利', desc: '格式：YYYY現金股利.xlsx', endpoint: '/api/upload/dividends', accept: '.xlsx' },
  { key: 'companies', label: '🏢 基本資料', desc: '格式：YYYY基本資料.xlsx', endpoint: '/api/upload/companies', accept: '.xlsx' },
];

export default function Upload() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const handleUpload = async (type, files) => {
    if (!files || files.length === 0) return;
    setLoading(prev => ({ ...prev, [type.key]: true }));
    setResults(prev => ({ ...prev, [type.key]: null }));
    try {
      const formData = new FormData();
      for (const f of files) formData.append('files', f);
      const res = await fetch(`${API}${type.endpoint}`, { method: 'POST', body: formData });
      const data = await res.json();
      setResults(prev => ({ ...prev, [type.key]: data }));
    } catch (e) {
      setResults(prev => ({ ...prev, [type.key]: { ok: false, error: e.message } }));
    }
    setLoading(prev => ({ ...prev, [type.key]: false }));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 8, fontSize: 22, fontWeight: 700 }}>📤 上傳 Excel 資料</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
        選擇資料類型，可一次選多個 xlsx 檔案上傳，系統自動解析並更新資料庫。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FILE_TYPES.map(type => {
          const result = results[type.key];
          const isLoading = loading[type.key];
          return (
            <div key={type.key} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{type.label}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{type.desc}</div>
                </div>
                <label style={{
                  padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
                  background: isLoading ? '#555' : '#4C9BB8', color: '#fff',
                  fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap'
                }}>
                  {isLoading ? '⏳ 上傳中...' : '選擇檔案上傳'}
                  <input type="file" multiple accept={type.accept} style={{ display: 'none' }}
                    disabled={isLoading}
                    onChange={e => handleUpload(type, e.target.files)}
                  />
                </label>
              </div>

              {result && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 6,
                  background: result.ok ? '#0d2a1a' : '#2a0d0d',
                  border: `1px solid ${result.ok ? '#2a6a3a' : '#6a2a2a'}`,
                  fontSize: 13
                }}>
                  {result.ok ? (
                    <>
                      <span style={{ color: '#4ec94e' }}>✅ 成功匯入 {result.rows} 筆資料</span>
                      {result.errors && result.errors.length > 0 && (
                        <div style={{ color: '#f5c518', marginTop: 4 }}>
                          ⚠️ 部分錯誤：{result.errors.join('; ')}
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: '#e05c5c' }}>❌ 失敗：{result.error || JSON.stringify(result.errors)}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24, background: '#1a2535' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 上傳順序建議</div>
        <ol style={{ color: '#aaa', fontSize: 13, lineHeight: 2, paddingLeft: 20 }}>
          <li>先上傳「基本資料」（公司代號、名稱、產業）</li>
          <li>上傳「月報」（月營收數據）</li>
          <li>上傳「季報－損益表」、「季報－資產負債表」、「季報－現金流量表」</li>
          <li>上傳「年報」</li>
          <li>上傳「現金股利」</li>
        </ol>
      </div>
    </div>
  );
}
