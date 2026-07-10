import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api', timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bharat_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('bharat_token');
    localStorage.removeItem('bharat_user');
  }
  return Promise.reject(err);
});

// Two-stage search — quick shows results fast, enrich fills in AI answer
export const quickSearch  = (q) => api.get('/search/quick',  { params:{q}, timeout: 90000 }).then(r=>r.data);
export const enrichSearch = (q) => api.get('/search/enrich', { params:{q}, timeout: 20000 }).then(r=>r.data);
export const search       = (q) => api.get('/search',        { params:{q}, timeout: 30000 }).then(r=>r.data);

export const autocomplete  = (q)  => api.get('/search/autocomplete', { params:{q}, timeout: 5000 }).then(r=>r.data);
export const generateImage = (prompt, seed, force) =>
  api.get('/search/generate-image', { params: { prompt, seed, force: force ? 1 : undefined }, timeout: 12000 }).then(r => r.data);
export const getHistory    = ()   => api.get('/search/history').then(r=>r.data.history||[]);
export const clearHistory  = ()   => api.delete('/search/history').then(r=>r.data);
export const deleteHistory = (id) => api.delete(`/search/history/${id}`).then(r=>r.data);
export const getTrending   = ()   => api.get('/search/trending').then(r=>r.data.trending||[]);

export const getSettings    = ()       => api.get('/settings').then(r=>r.data);
export const updateSettings = (config) => api.post('/settings', config).then(r=>r.data);
export const resetSettings  = ()       => api.post('/settings/reset').then(r=>r.data);

export const authAPI = {
  signup: (name,email,password) => api.post('/auth/signup',{name,email,password}).then(r=>r.data),
  login:  (email,password)      => api.post('/auth/login',{email,password}).then(r=>r.data),
  me:     ()                    => api.get('/auth/me').then(r=>r.data),
};
export default api;
