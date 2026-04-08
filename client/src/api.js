import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin + '/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const taskAPI = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  accept: (id) => api.post(`/tasks/${id}/accept`),
  complete: (id, data) => api.post(`/tasks/user-tasks/${id}/complete`, data),
  getMyTasks: (status) => api.get('/tasks/my-tasks', { params: { status } }),
  getStatistics: () => api.get('/tasks/statistics'),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getPointHistory: (id, params) => api.get(`/users/${id}/point-history`, { params }),
  getAchievements: (id) => api.get(`/users/${id}/achievements`),
  adjustPoints: (id, data) => api.post(`/users/${id}/adjust-points`, data),
};

export const rewardAPI = {
  getAll: () => api.get('/rewards'),
  create: (data) => api.post('/rewards', data),
  update: (id, data) => api.put(`/rewards/${id}`, data),
  delete: (id) => api.delete(`/rewards/${id}`),
  redeem: (id) => api.post(`/rewards/${id}/redeem`),
  getMyRedemptions: () => api.get('/rewards/my-redemptions'),
  getAllRedemptions: () => api.get('/rewards/redemptions'),
  fulfill: (id, data) => api.post(`/rewards/redemptions/${id}/fulfill`, data),
};

export const exportAPI = {
  toExcel: () => api.get('/export/excel', { responseType: 'blob' }),
  toNotion: () => api.get('/export/notion'),
};

export default api;
