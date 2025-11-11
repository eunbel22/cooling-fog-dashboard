import axios from 'axios';

// 환경변수에서 API 주소 가져오기 (없으면 기본 localhost)
const BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:8050';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 (디버깅용)
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 핸들링)
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============= 새로운 제어 API (v2.0) =============

export const controlAPI = {
  // 모드 설정 (auto: AI 추적, manual: 수동 순찰)
  setMode: (mode) => 
    api.post('/api/control/mode', { mode }),
  
  // 모터 제어 (start/stop)
  controlMotor: (control) => 
    api.post('/api/control/motor', { control }),
  
  // 그리드 이동 (1~25)
  moveToGrid: (grid) => 
    api.post('/api/control/grid', { grid }),
};

// ============= 시스템 상태 API =============

export const systemAPI = {
  // 전체 시스템 상태 조회
  getStatus: () => 
    api.get('/api/system/status'),
  
  // 헬스체크
  healthCheck: () => 
    api.get('/health'),
};

// ============= 센서 데이터 API =============

export const sensorAPI = {
  // 최신 센서 데이터 조회
  getLatestData: () => 
    api.get('/api/sensor-data/latest'),
};

// ============= 위치 데이터 API =============

export const positionAPI = {
  // 최신 위치 데이터 조회
  getLatestData: () => 
    api.get('/api/position-data/latest'),
};

// ============= 감지 데이터 API =============

export const detectionAPI = {
  // 최신 가축 감지 데이터 조회
  getLatestData: () => 
    api.get('/api/detection-data/latest'),
};

// ============= 카메라 데이터 API =============

export const cameraAPI = {
  // 최신 AI 카메라 데이터 조회
  getLatestData: () => 
    api.get('/api/camera-data/latest'),
};

// ============= 추적 데이터 API (레거시 - 하위 호환성) =============

export const trackingAPI = {
  // 최신 추적 데이터 조회
  getLatestData: () => 
    api.get('/api/tracking-data/latest'),
};

// ============= 기기 제어 API (레거시 - 하위 호환성) =============

export const deviceAPI = {
  // 기기 상태 조회
  getStatus: () => 
    api.get('/api/device/status'),
  
  // 기기 시작 (레거시)
  start: () => 
    api.post('/api/device/start'),
  
  // 기기 정지 (레거시)
  stop: () => 
    api.post('/api/device/stop'),
  
  // 분사 강도 설정 (레거시)
  setSprayIntensity: (intensity) => 
    api.put('/api/device/spray-intensity', null, { params: { intensity } }),
  
  // 추적 모드 설정 (레거시)
  setTrackingMode: (mode) => 
    api.put('/api/device/tracking-mode', null, { params: { mode } }),
};

// ============= 스케줄 API =============

export const scheduleAPI = {
  // 모든 스케줄 조회
  getAll: () => 
    api.get('/api/schedules'),
  
  // 스케줄 생성
  create: (schedule) => 
    api.post('/api/schedules', schedule),
  
  // 스케줄 수정
  update: (id, schedule) => 
    api.put(`/api/schedules/${id}`, schedule),
  
  // 스케줄 삭제
  delete: (id) => 
    api.delete(`/api/schedules/${id}`),
};

// ============= WebSocket URL =============

export const getWebSocketURL = () => {
  const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const wsHost = BASE_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${wsHost}/ws/realtime`;
};

// ============= 헬퍼 함수 =============

export const checkServerConnection = async () => {
  try {
    const response = await systemAPI.healthCheck();
    return response.status === 200;
  } catch (error) {
    console.error('서버 연결 확인 실패:', error);
    return false;
  }
};

export const getRaspberryPiStatus = async () => {
  try {
    const response = await systemAPI.getStatus();
    return response.data.raspberry_pi_connected;
  } catch (error) {
    console.error('라즈베리파이 상태 확인 실패:', error);
    return false;
  }
};

// 기본 export
export default api;