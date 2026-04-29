import axios from 'axios';

const API = axios.create({
  baseURL: 'https://stock-api-7u52.onrender.com',
});

export const getCompanies = () => API.get('/api/companies').then(r => r.data);
export const getCompanyInfo = (ticker) => API.get(`/api/company/${ticker}`).then(r => r.data);
export const getPrice = (ticker) => API.get(`/api/company/${ticker}/price`).then(r => r.data);
export const getQuarterly = (ticker) => API.get(`/api/company/${ticker}/quarterly`).then(r => r.data);
export const getMonthly = (ticker) => API.get(`/api/company/${ticker}/monthly`).then(r => r.data);
export const getAnnual = (ticker) => API.get(`/api/company/${ticker}/annual`).then(r => r.data);
export const getDividend = (ticker) => API.get(`/api/company/${ticker}/dividend`).then(r => r.data);
export const getEstEps = (ticker) => API.get(`/api/company/${ticker}/est-eps`).then(r => r.data);
export const getRanking = () => API.get('/api/ranking').then(r => r.data);
export const getIndustries = () => API.get('/api/industries').then(r => r.data);
export const getWatchlist = () => API.get('/api/watchlist').then(r => r.data);
export const addWatchlist = (ticker, name) => API.post(`/api/watchlist/${ticker}?name=${encodeURIComponent(name)}`).then(r => r.data);
export const removeWatchlist = (ticker) => API.delete(`/api/watchlist/${ticker}`).then(r => r.data);
export const getPortfolioGroups = () => API.get('/api/portfolio/groups').then(r => r.data);
export const getPortfolioStocks = (group) => API.get(`/api/portfolio/${group}`).then(r => r.data);
export const addPortfolio = (group, ticker, name) => API.post(`/api/portfolio/${group}/${ticker}?name=${encodeURIComponent(name)}`).then(r => r.data);
export const removePortfolio = (group, ticker) => API.delete(`/api/portfolio/${group}/${ticker}`).then(r => r.data);
