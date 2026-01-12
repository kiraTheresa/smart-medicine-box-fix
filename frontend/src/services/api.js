import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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