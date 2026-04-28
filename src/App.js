import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StockOverview from './pages/StockOverview';
import MarketRanking from './pages/MarketRanking';
import Portfolio from './pages/Portfolio';
import SectorComparison from './pages/SectorComparison';
import './App.css';

export default function App() {
  const [ticker, setTicker] = useState('2330');
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar ticker={ticker} setTicker={setTicker} />
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
              <Route path="/ranking" element={<MarketRanking setTicker={setTicker} />} />
              <Route path="/sector" element={<SectorComparison />} />
              <Route path="/portfolio" element={<Portfolio setTicker={setTicker} />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
