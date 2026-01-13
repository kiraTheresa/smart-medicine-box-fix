import axios from 'axios';

const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，自动添加认证令牌
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

// 响应拦截器，处理令牌过期等情况
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

export const medicineApi = {
  getAll: () => api.get('/medicines'),
  getActive: () => api.get('/medicines/active'),
  getById: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  toggleStatus: (id) => api.patch(`/medicines/${id}/toggle`),
};

export const nodemcuApi = {
  getConfig: () => api.get('/nodemcu/config'),
  sync: (deviceId, ipAddress) => api.post('/nodemcu/sync', null, {
    params: { 
      deviceId,
      ipAddress: ipAddress || '' 
    }
  }),
  sendCommand: (deviceId, command, data = {}) => 
    api.post('/nodemcu/command', data, {
      params: { deviceId, command }
    }),
  getDevices: () => api.get('/nodemcu/devices'),
};

export const offlineEventApi = {
  getDeviceEvents: (deviceId) => api.get(`/offline-events/device/${deviceId}`),
  getUnprocessedEvents: () => api.get('/offline-events/unprocessed'),
  processEvent: (eventId) => api.post(`/offline-events/process/${eventId}`),
  processDeviceEvents: (deviceId) => api.post(`/offline-events/process/device/${deviceId}`),
  deleteDeviceEvents: (deviceId) => api.delete(`/offline-events/device/${deviceId}`),
};