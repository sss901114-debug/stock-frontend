import React, { useState, useCallback, useRef } from 'react';
import Shareholding from './pages/Shareholding';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StockOverview from './pages/StockOverview';
import MarketRanking from './pages/MarketRanking';
import Portfolio from './pages/Portfolio';
import SectorComparison from './pages/SectorComparison';
import Upload from './pages/Upload';
import RulesManager from './pages/RulesManager';
import PrivateAnalysis from './pages/PrivateAnalysis';
import Scoreboard from './pages/Scoreboard';
import './App.css';

const MAX_WATCHLIST = 30;
const SECRET_CLICKS = 5;

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem('watchlist') || '[]'); } catch { return []; }
}
function saveWatchlist(list) {
  localStorage.setItem('watchlist', JSON.stringify(list));
}

export default function App() {
  const [ticker, setTicker] = useState('2330');
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [showUpload, setShowUpload] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  const handleLogoClick = useCallback(() => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= SECRET_CLICKS) {
      setShowUpload(prev => !prev);
      clickCount.current = 0;
    } else {
      clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 2000);
    }
  }, []);

  const addToWatchlist = useCallback((ticker, name) => {
    setWatchlist(prev => {
      if (prev.find(w => w.ticker === ticker)) return prev;
      if (prev.length >= MAX_WATCHLIST) { alert(`私房股最多 ${MAX_WATCHLIST} 檔`); return prev; }
      const next = [...prev, { ticker, name }];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((ticker) => {
    setWatchlist(prev => {
      const next = prev.filter(w => w.ticker !== ticker);
      saveWatchlist(next);
      return next;
    });
  }, []);

  const isInWatchlist = useCallback((ticker) => {
    return watchlist.some(w => w.ticker === ticker);
  }, [watchlist]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar ticker={ticker} setTicker={setTicker} watchlist={watchlist}
          removeFromWatchlist={removeFromWatchlist} onLogoClick={handleLogoClick} />
        <main className="main-content">
          <nav className="top-nav">
            <NavLink to="/" end>📊 個股總覽</NavLink>
            <NavLink to="/ranking">🏆 全市場排名</NavLink>
            <NavLink to="/sector">🔍 類股比較</NavLink>
            <NavLink to="/portfolio">★ 私房股</NavLink>
            <NavLink to="/scoreboard">📊 計分板</NavLink><NavLink to="/shareholding">🔬 籌碼分析</NavLink>
            {showUpload && <NavLink to="/upload">📤 上傳資料</NavLink>}
            {showUpload && <NavLink to="/rules">📋 分析規則</NavLink>}
            {showUpload && <NavLink to="/private" style={{ color: '#5a2a2a' }}>🔒</NavLink>}
          </nav>
          <div className="page-content">
            <Routes>
              <Route path="/" element={<StockOverview ticker={ticker} addToWatchlist={addToWatchlist} isInWatchlist={isInWatchlist} />} />
              <Route path="/ranking" element={<MarketRanking setTicker={setTicker} watchlist={watchlist} addToWatchlist={addToWatchlist} removeFromWatchlist={removeFromWatchlist} isInWatchlist={isInWatchlist} />} />
              <Route path="/sector" element={<SectorComparison setTicker={setTicker} watchlist={watchlist} addToWatchlist={addToWatchlist} removeFromWatchlist={removeFromWatchlist} isInWatchlist={isInWatchlist} />} />
              <Route path="/portfolio" element={<Portfolio setTicker={setTicker} watchlist={watchlist} addToWatchlist={addToWatchlist} removeFromWatchlist={removeFromWatchlist} />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/rules" element={<RulesManager />} />
              <Route path="/private" element={<PrivateAnalysis ticker={ticker} />} />
              <Route path="/scoreboard" element={<Scoreboard />} /><Route path="/shareholding" element={<Shareholding />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
