import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:8050';


const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 기기 제어 API
export const deviceAPI = {
  // 기기 상태 조회
  getStatus: () => api.get('/api/device/status'),
  
  // 기기 시작
  start: () => api.post('/api/device/start'),
  
  // 기기 정지
  stop: () => api.post('/api/device/stop'),
  
  // 분사 강도 설정
  setSprayIntensity: (intensity) => 
    api.put('/api/device/spray-intensity', null, { params: { intensity } }),
  
  // 추적 모드 설정
  setTrackingMode: (mode) => 
    api.put('/api/device/tracking-mode', null, { params: { mode } }),

  // 수동 위치 설정
  /*setManualPosition: (gridIndex) => 
    api.post('/api/device/manual-position', null, { params: { grid_index: gridIndex } }),
  
  // 순찰 위치 업데이트  
  updatePatrolPosition: (patrolIndex) =>
    api.post('/api/device/patrol-position', null, { params: { patrol_index: patrolIndex } })
  */
};



// 센서 데이터 API
export const sensorAPI = {
  getLatestData: () => api.get('/api/sensor-data/latest'),
};

// 추적 데이터 API  
export const trackingAPI = {
  getLatestData: () => api.get('/api/tracking-data/latest'),
};

// 스케줄 API
export const scheduleAPI = {
  getAll: () => api.get('/api/schedules'),
  create: (schedule) => api.post('/api/schedules', schedule),
  update: (id, schedule) => api.put(`/api/schedules/${id}`, schedule),
  delete: (id) => api.delete(`/api/schedules/${id}`),
};
