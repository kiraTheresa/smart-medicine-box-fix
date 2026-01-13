import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器（简化版，不使用JWT）
api.interceptors.request.use(
  (config) => {
    // 不添加认证令牌
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器（简化版，不使用JWT）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 简化错误处理，不检查401状态码
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

export const notificationApi = {
  sendTest: (deviceId, command, data) => api.post('/notifications/test', data, {
    params: { deviceId, command }
  }),
  getHistory: (deviceId) => api.get('/notifications/history', {
    params: deviceId ? { deviceId } : {}
  }),
  markAsRead: (notificationId) => api.post('/notifications/read', null, {
    params: { notificationId }
  }),
  clear: (deviceId) => api.delete('/notifications/clear', {
    params: deviceId ? { deviceId } : {}
  }),
};