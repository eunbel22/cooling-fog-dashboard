import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { deviceAPI, sensorAPI, trackingAPI } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';
import { useScheduleManager } from '../hooks/useScheduleManager';
import { useDeviceControl } from '../hooks/useDeviceControl';
import { useVisualization } from '../hooks/useVisualization';
import DashboardTab from './tabs/DashboardTab';
import VisualizationTab from './tabs/VisualizationTab';
import ScheduleTab from './tabs/ScheduleTab';

const Dashboard = () => {
  // 기본 상태 관리
  const [activeTab, setActiveTab] = useState('대시보드');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [temperature, setTemperature] = useState(28.5);
  const [humidity, setHumidity] = useState(65);
  const [waterTank, setWaterTank] = useState(70);
  const [humanDetected, setHumanDetected] = useState(true);
  const [distance, setDistance] = useState(2.3);
  const [direction, setDirection] = useState('북쪽');

  // 웹소켓 연결
  const { lastMessage, isConnected } = useWebSocket('ws://3.36.112.6:8050/ws/realtime');

  // 커스텀 훅 사용
  const deviceControl = useDeviceControl(setIsLoading, setError);
  const scheduleManager = useScheduleManager();
  const visualization = useVisualization(deviceControl.selectedMode, humanDetected, deviceControl.isRunning);

  // 모달 상태
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    startTime: '',
    endTime: '',
    selectedDays: [],
    mode: '자동',
    isEnabled: true
  });
  const [editSchedule, setEditSchedule] = useState({
    title: '',
    startTime: '',
    endTime: '',
    selectedDays: [],
    mode: '자동',
    isEnabled: true
  });


  useEffect(() => {
    const temps = Object.values(visualization.gridTemperatures);
    
    if (temps.length > 0) {
      const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
      setTemperature(Math.round(avgTemp * 10) / 10); // 소수점 1자리
      console.log(`📊 [평균 온도] ${temps.length}개 격자 평균: ${avgTemp.toFixed(1)}°C`);
    }
  }, [visualization.gridTemperatures]);

  useEffect(() => {
    const humidities = Object.values(visualization.gridHumidities);
    
    if (humidities.length > 0) {
      const avgHumidity = humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length;
      const roundedHumidity = Math.round(avgHumidity);
      setHumidity(roundedHumidity); // 정수로 반올림
      setWaterTank(roundedHumidity); // 물탱크도 습도와 동일하게 설정
      console.log(`💧 [평균 습도] ${humidities.length}개 격자 평균: ${avgHumidity.toFixed(1)}%`);
      console.log(`🚰 [물탱크] 습도와 동일하게 설정: ${roundedHumidity}%`);
    }
  }, [visualization.gridHumidities]);

  // 탭 변경 시 상태 동기화 확인 (디버깅용)
  useEffect(() => {
    console.log(`🔄 [탭 전환] ${activeTab} | isRunning: ${deviceControl.isRunning} | selectedMode: ${deviceControl.selectedMode}`);
  }, [activeTab, deviceControl.isRunning, deviceControl.selectedMode]);

  // 탭 변경시 데이터 로드
  useEffect(() => {
    if (activeTab === '대시보드') {
      loadDashboardData();
    } else if (activeTab === '스케줄 관리') {
      scheduleManager.loadSchedules();
    }
  }, [activeTab]);

  
  // 웹소켓 메시지 처리 - 수정된 부분
  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;
      
      switch (type) {
        case 'sensor_data':
          // 온도, 습도 처리
          if (data.temperature !== undefined) {
            console.log(`📊 [센서] 온도: ${data.temperature}°C, 습도: ${data.humidity}%`);
          }
          // setWaterTank는 주석 처리 - 습도와 동일하게 유지
          break;
          
        case 'position_data':
          // 위치 데이터
          console.log(`📍 [위치] 그리드: ${data.current_grid}, 좌표: (${data.x}, ${data.y})`);
          break;
          
        case 'detection_data':
          // 가축 감지
          if (data.livestock_detected !== undefined) {
            setHumanDetected(data.livestock_detected);
            console.log(`🐷 [가축 감지] ${data.livestock_detected ? '감지됨' : '감지 안됨'}`);
          }
          break;
          
        case 'camera_data':
          // AI 카메라
          console.log(`📷 [카메라] 상태: ${data.status}, FPS: ${data.fps}`);
          break;
          
        case 'tracking_data':
          setHumanDetected(data.human_detected);
          setDistance(data.distance);
          setDirection(data.direction);
          break;
          
        case 'device_status':
          // 웹소켓 상태 동기화 완전 비활성화 (탭 전환 문제 해결을 위해)
          console.log('📡 [웹소켓] device_status 수신 (완전 무시됨):', { 
            서버_isRunning: data.is_running, 
            현재_isRunning: deviceControl.isRunning,
            서버_mode: data.tracking_mode,
            현재_mode: deviceControl.selectedMode
          });
          // ⚠️ 모든 웹소켓 상태 동기화를 무시합니다
          // deviceControl.setIsRunning(data.is_running);
          // deviceControl.setSelectedMode(data.tracking_mode);
          break;
          
        default:
          // 무시 (에러 로그 제거)
          break;
      }
    }
  }, [lastMessage, deviceControl]);

  // 가축 감지 랜덤 시뮬레이션 (테스트용) - 5초마다 70% 확률로 감지
  useEffect(() => {
    const interval = setInterval(() => {
      const randomDetected = Math.random() > 0.3; // 70% 확률로 감지
      setHumanDetected(randomDetected);
      console.log('🔄 [시간] 가축 감지 상태 변경:', randomDetected ? '감지됨' : '감지 안됨');
    }, 5000); // 5초마다 변경
    
    return () => clearInterval(interval);
  }, []);

  // 구역 변경 시 가축 감지 랜덤 설정 (테스트용) - 60% 확률로 감지
  useEffect(() => {
    if (visualization.patrolCurrentGrid !== undefined) {
      const randomDetected = Math.random() > 0.4; // 60% 확률로 감지
      setHumanDetected(randomDetected);
      console.log(`📍 [구역 ${visualization.patrolCurrentGrid}] 가축 감지:`, randomDetected ? '감지됨' : '감지 안됨');
    }
  }, [visualization.patrolCurrentGrid]);

  // 스케줄 체크
  useEffect(() => {
    if (!scheduleManager.schedulerEnabled || !scheduleManager.schedules?.length) return;
    
    const checkInterval = setInterval(() => {
      const activeScheduleList = scheduleManager.checkActiveSchedules();
      scheduleManager.executeScheduleControl(
        activeScheduleList,
        deviceControl.handleTrackingModeChange,
        deviceControl.handleDeviceToggle,
        deviceControl.selectedMode,
        deviceControl.isRunning
      );
    }, 30000);
    
    const initialActiveSchedules = scheduleManager.checkActiveSchedules();
    scheduleManager.executeScheduleControl(
      initialActiveSchedules,
      deviceControl.handleTrackingModeChange,
      deviceControl.handleDeviceToggle,
      deviceControl.selectedMode,
      deviceControl.isRunning
    );
    
    return () => clearInterval(checkInterval);
  }, [
    scheduleManager.schedules,
    scheduleManager.schedulerEnabled,
    deviceControl.handleTrackingModeChange,
    deviceControl.handleDeviceToggle,
    deviceControl.selectedMode,
    deviceControl.isRunning
  ]);

  // 대시보드 데이터 로드
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [deviceResponse, sensorResponse, trackingResponse] = await Promise.all([
        deviceAPI.getStatus(),
        sensorAPI.getLatestData(),
        trackingAPI.getLatestData()
      ]);
      
      deviceControl.setIsRunning(deviceResponse.data.is_running);
      deviceControl.setSelectedMode(deviceResponse.data.tracking_mode);
      
      setTemperature(sensorResponse.data.temperature);
      setHumidity(sensorResponse.data.humidity);
      setWaterTank(sensorResponse.data.humidity); // 습도와 동일하게 설정
      
      setHumanDetected(trackingResponse.data.human_detected);
      setDistance(trackingResponse.data.distance);
      setDirection(trackingResponse.data.direction);
      
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 안전 상태 함수들
  const getSafetyStatus = () => (waterTank < 10) ? 'unsafe' : 'safe';
  const getSprayStatus = () => deviceControl.isRunning ? '동작' : '정지';

  // 모달 핸들러들
  const openNewScheduleModal = () => setIsNewScheduleModalOpen(true);
  
  const closeNewScheduleModal = () => {
    setIsNewScheduleModalOpen(false);
    setNewSchedule({
      title: '',
      startTime: '',
      endTime: '',
      selectedDays: [],
      mode: '자동',
      isEnabled: true
    });
  };

  const openEditScheduleModal = (schedule) => {
    const selectedDays = schedule.repeat.split(', ');
    const [startTime, endTime] = schedule.time.split(' - ').map(time => {
      const timeOnly = time.replace(/오전 |오후 /, '');
      if (time.includes('오후') && !timeOnly.startsWith('12:')) {
        const [hour, minute] = timeOnly.split(':');
        return `${parseInt(hour) + 12}:${minute}`;
      }
      return timeOnly;
    });

    setEditSchedule({
      title: schedule.title,
      startTime,
      endTime,
      selectedDays,
      mode: schedule.mode,
      isEnabled: schedule.isActive
    });
    setEditingScheduleId(schedule.id);
    setIsEditScheduleModalOpen(true);
  };

  const closeEditScheduleModal = () => {
    setIsEditScheduleModalOpen(false);
    setEditingScheduleId(null);
  };

  const handleEditDayToggle = (day) => {
    setEditSchedule(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleDayToggle = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('이 스케줄을 삭제하시겠습니까?')) {
      setIsLoading(true);
      const result = await scheduleManager.deleteSchedule(scheduleId);
      if (!result.success) setError(result.error);
      setIsLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (newSchedule.title && newSchedule.startTime && newSchedule.endTime && newSchedule.selectedDays.length > 0) {
      setIsLoading(true);
      
      const scheduleData = {
        title: newSchedule.title,
        start_time: newSchedule.startTime,
        end_time: newSchedule.endTime,
        days_of_week: newSchedule.selectedDays.map(day => {
          const dayMap = {'월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7};
          return dayMap[day];
        }),
        mode: newSchedule.mode,
        is_active: newSchedule.isEnabled
      };
      
      const result = await scheduleManager.createSchedule(scheduleData);
      if (result.success) {
        closeNewScheduleModal();
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }
  };

  const handleUpdateSchedule = () => {
    if (editSchedule.title && editSchedule.startTime && editSchedule.endTime && editSchedule.selectedDays.length > 0) {
      const formatTime = (time) => {
        const [hour, minute] = time.split(':');
        const hourNum = parseInt(hour);
        if (hourNum === 0) return `오전 12:${minute}`;
        if (hourNum < 12) return `오전 ${hour}:${minute}`;
        if (hourNum === 12) return `오후 12:${minute}`;
        return `오후 ${hourNum - 12}:${minute}`;
      };

      const updatedSchedule = {
        id: editingScheduleId,
        title: editSchedule.title,
        time: `${formatTime(editSchedule.startTime)} - ${formatTime(editSchedule.endTime)}`,
        mode: editSchedule.mode,
        repeat: editSchedule.selectedDays.join(', '),
        isActive: editSchedule.isEnabled
      };

      scheduleManager.setSchedules(prev => prev.map(schedule => 
        schedule.id === editingScheduleId ? updatedSchedule : schedule
      ));
      closeEditScheduleModal();
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* 헤더 */}
        <div className="status-bar-header">
          <div className="header-left">
            <div className="logo-container">
              <img src="/assets/icons/logo-icon.svg" alt="CoolingFog Pro" className="logo-icon" />
              <div className="app-info">
                <h1 className="app-title">CoolingFog</h1>
                <p className="app-subtitle">이동식 쿨링포그 제어 시스템</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="status-icons">
              <div className="status-item">
                <img src="/assets/icons/wifi-icon.svg" alt="WiFi" className="status-icon" />
                <span className="status-text">{isConnected ? '실시간 연결' : '연결 끊김'}</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${deviceControl.isRunning ? 'active' : 'inactive'}`}></div>
                <span className="status-text">{getSprayStatus()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 안전상태 경고 */}
        {getSafetyStatus() === 'unsafe' && (
          <div className="safety-alert">
            <strong>⚠️ 주의</strong> 물탱크 부족
          </div>
        )}

        {/* 탭 네비게이션 - '제어' 탭 제거 */}
        <div className="tab-navigation">
          {['대시보드', '추적시각화', '스케줄 관리'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 탭별 컨텐츠 */}
        {activeTab === '대시보드' && (
          <DashboardTab 
            temperature={temperature}
            humidity={humidity}
            humanDetected={humanDetected}
            isLoading={isLoading}
            error={error}
            setError={setError}
            isRunning={deviceControl.isRunning}
            selectedMode={deviceControl.selectedMode}
            handleDeviceToggle={deviceControl.handleDeviceToggle}
            handleEmergencyStop={deviceControl.handleEmergencyStop}
            handleTrackingModeChange={deviceControl.handleTrackingModeChange}
          />
        )}

        {activeTab === '추적시각화' && (
          <VisualizationTab 
            selectedMode={deviceControl.selectedMode}
            humanDetected={humanDetected}
            direction={direction}
            distance={distance}
            isRunning={deviceControl.isRunning}
            isConnected={isConnected}
            manualTargetGrid={visualization.manualTargetGrid}
            patrolCurrentGrid={visualization.patrolCurrentGrid}
            gridTemperatures={visualization.gridTemperatures}
            GRID_POSITIONS={visualization.GRID_POSITIONS}
            isSpraying={visualization.isSpraying}
            handleGridClick={visualization.handleGridClick}
            getDevicePositionByMode={visualization.getDevicePositionByMode}
            shouldShowTarget={visualization.shouldShowTarget}
            shouldShowGridOverlay={visualization.shouldShowGridOverlay}
          />
        )}

        {activeTab === '스케줄 관리' && (
          <ScheduleTab 
            schedules={scheduleManager.schedules}
            schedulerEnabled={scheduleManager.schedulerEnabled}
            setSchedulerEnabled={scheduleManager.setSchedulerEnabled}
            lastScheduleCheck={scheduleManager.lastScheduleCheck}
            activeSchedules={scheduleManager.activeSchedules}
            toggleScheduleStatus={scheduleManager.toggleScheduleStatus}
            openEditScheduleModal={openEditScheduleModal}
            handleDeleteSchedule={handleDeleteSchedule}
            openNewScheduleModal={openNewScheduleModal}
          />
        )}

        {/* 스케줄 편집 모달 */}
        {isEditScheduleModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>스케줄 수정</h3>
              
              <div className="form-group">
                <label>스케줄 이름</label>
                <input
                  type="text"
                  placeholder="스케줄 이름을 입력하세요"
                  value={editSchedule.title}
                  onChange={(e) => setEditSchedule(prev => ({...prev, title: e.target.value}))}
                  className="form-input"
                />
              </div>

              <div className="time-group">
                <div className="form-group">
                  <label>시작 시간</label>
                  <input
                    type="time"
                    value={editSchedule.startTime}
                    onChange={(e) => setEditSchedule(prev => ({...prev, startTime: e.target.value}))}
                    className="time-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>종료 시간</label>
                  <input
                    type="time"
                    value={editSchedule.endTime}
                    onChange={(e) => setEditSchedule(prev => ({...prev, endTime: e.target.value}))}
                    className="time-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>반복 요일</label>
                <div className="day-selector">
                  {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleEditDayToggle(day)}
                      className={`day-button ${editSchedule.selectedDays.includes(day) ? 'selected' : ''}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>추적 모드</label>
                <select
                  value={editSchedule.mode}
                  onChange={(e) => setEditSchedule(prev => ({...prev, mode: e.target.value}))}
                  className="form-select"
                >
                  <option value="자동">자동</option>
                  <option value="수동">수동</option>
                </select>
              </div>

              <div className="form-group">
                <label 
                  className="checkbox-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                    justifyContent: 'flex-start',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: 0
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editSchedule.isEnabled}
                    onChange={(e) => setEditSchedule(prev => ({...prev, isEnabled: e.target.checked}))}
                    className="checkbox-input"
                  />
                  <span 
                    className="checkbox-custom"
                    style={{
                      width: '1rem',
                      height: '1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      background: editSchedule.isEnabled ? '#3b82f6' : 'white',
                      borderColor: editSchedule.isEnabled ? '#3b82f6' : '#d1d5db',
                      position: 'relative',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {editSchedule.isEnabled && (
                      <span style={{ color: 'white', fontSize: '0.625rem', fontWeight: 'bold' }}>✓</span>
                    )}
                  </span>
                  <span>스케줄 활성화</span>
                </label>
              </div>

              <div className="modal-actions">
                <button onClick={handleUpdateSchedule} className="create-button">수정</button>
                <button onClick={closeEditScheduleModal} className="cancel-button">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 새 스케줄 생성 모달 */}
        {isNewScheduleModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>새 스케줄 생성</h3>
              
              <div className="form-group">
                <label>스케줄 이름</label>
                <input
                  type="text"
                  placeholder="스케줄 이름을 입력하세요"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule(prev => ({...prev, title: e.target.value}))}
                  className="form-input"
                />
              </div>

              <div className="time-group">
                <div className="form-group">
                  <label>시작 시간</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule(prev => ({...prev, startTime: e.target.value}))}
                    className="time-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>종료 시간</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule(prev => ({...prev, endTime: e.target.value}))}
                    className="time-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>반복 요일</label>
                <div className="day-selector">
                  {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`day-button ${newSchedule.selectedDays.includes(day) ? 'selected' : ''}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>추적 모드</label>
                <select
                  value={newSchedule.mode}
                  onChange={(e) => setNewSchedule(prev => ({...prev, mode: e.target.value}))}
                  className="form-select"
                >
                  <option value="자동">추적</option>
                  <option value="수동">순찰</option>
                </select>
              </div>

              <div className="form-group">
                <label 
                  className="checkbox-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                    justifyContent: 'flex-start',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: 0
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newSchedule.isEnabled}
                    onChange={(e) => setNewSchedule(prev => ({...prev, isEnabled: e.target.checked}))}
                    className="checkbox-input"
                  />
                  <span 
                    className="checkbox-custom"
                    style={{
                      width: '1rem',
                      height: '1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      background: newSchedule.isEnabled ? '#3b82f6' : 'white',
                      borderColor: newSchedule.isEnabled ? '#3b82f6' : '#d1d5db',
                      position: 'relative',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {newSchedule.isEnabled && (
                      <span style={{ color: 'white', fontSize: '0.625rem', fontWeight: 'bold' }}>✓</span>
                    )}
                  </span>
                  <span>스케줄 활성화</span>
                </label>
              </div>

              <div className="modal-actions">
                <button onClick={handleCreateSchedule} className="create-button">생성</button>
                <button onClick={closeNewScheduleModal} className="cancel-button">취소</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;