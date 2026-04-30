import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StockOverview from './pages/StockOverview';
import MarketRanking from './pages/MarketRanking';
import Portfolio from './pages/Portfolio';
import SectorComparison from './pages/SectorComparison';
import './App.css';

const MAX_WATCHLIST = 10;

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem('watchlist') || '[]'); } catch { return []; }
}
function saveWatchlist(list) {
  localStorage.setItem('watchlist', JSON.stringify(list));
}

export default function App() {
  const [ticker, setTicker] = useState('2330');
  const [watchlist, setWatchlist] = useState(loadWatchlist);

  const addToWatchlist = useCallback((ticker, name) => {
    setWatchlist(prev => {
      if (prev.find(w => w.ticker === ticker)) return prev;
      if (prev.length >= MAX_WATCHLIST) {
        alert(`私房股最多 ${MAX_WATCHLIST} 檔`);
        return prev;
      }
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
        <Sidebar ticker={ticker} setTicker={setTicker} watchlist={watchlist} removeFromWatchlist={removeFromWatchlist} />
        <main className="main-content">
          <nav className="top-nav">
            <NavLink to="/" end>📊 個股總覽</NavLink>
            <NavLink to="/ranking">🏆 全市場排名</NavLink>
            <NavLink to="/sector">🔍 類股比較</NavLink>
            <NavLink to="/portfolio">★ 私房股</NavLink>
          </nav>
          <div className="page-content">
            <Routes>
              <Route path="/" element={<StockOverview ticker={ticker} />} />
              <Route path="/ranking" element={<MarketRanking setTicker={setTicker} watchlist={watchlist} addToWatchlist={addToWatchlist} removeFromWatchlist={removeFromWatchlist} isInWatchlist={isInWatchlist} />} />
              <Route path="/sector" element={<SectorComparison setTicker={setTicker} watchlist={watchlist} addToWatchlist={addToWatchlist} removeFromWatchlist={removeFromWatchlist} isInWatchlist={isInWatchlist} />} />
              <Route path="/portfolio" element={<Portfolio setTicker={setTicker} />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
