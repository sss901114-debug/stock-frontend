import React, { useState, useEffect } from 'react';
import { getRanking } from '../api';

export default function MarketRanking({ setTicker }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  useEffect(() => {
    getRanking().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">⏳ 載入全市場資料...</div>;

  // 按子產業分組
  const industries = {};
  data.forEach(row => {
    const key = row.sub_industry || row.industry || '其他';
    if (!industries[key]) industries[key] = [];
    industries[key].push(row);
  });

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>🏆 全市場類股排名</h2>
      {Object.entries(industries).map(([industry, stocks]) => {
        const avgGross = stocks.filter(s => s.gross_rate).reduce((a, b) => a + b.gross_rate, 0) / stocks.filter(s => s.gross_rate).length;
        return (
          <div key={industry} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setSelectedIndustry(selectedIndustry === industry ? null : industry)}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{industry}</span>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#666' }}>
                <span>{stocks.length} 檔</span>
                <span>平均毛利率 {isNaN(avgGross) ? '-' : avgGross.toFixed(1) + '%'}</span>
                <span style={{ color: '#4C9BE8' }}>{selectedIndustry === industry ? '▲ 收合' : '▼ 展開'}</span>
              </div>
            </div>

            {selectedIndustry === industry && (
              <div style={{ marginTop: 14 }}>
                <table>
                  <thead><tr>
                    <th>代號</th><th>名稱</th><th>毛利率</th><th>月營收年增率</th>
                  </tr></thead>
                  <tbody>
                    {stocks.sort((a, b) => (b.gross_rate || 0) - (a.gross_rate || 0)).map(s => (
                      <tr key={s.ticker} style={{ cursor: 'pointer' }}
                        onClick={() => setTicker(s.ticker)}>
                        <td style={{ color: '#4C9BE8', fontWeight: 600 }}>{s.ticker}</td>
                        <td>{s.name}</td>
                        <td className={s.gross_rate > 30 ? 'positive' : ''}>
                          {s.gross_rate ? `${s.gross_rate.toFixed(1)}%` : '-'}
                        </td>
                        <td className={s.rev_yoy > 0 ? 'positive' : s.rev_yoy < 0 ? 'negative' : ''}>
                          {s.rev_yoy !== '' && s.rev_yoy !== undefined ? `${Number(s.rev_yoy).toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
