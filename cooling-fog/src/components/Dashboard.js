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
  const visualization = useVisualization(deviceControl.selectedMode, humanDetected);

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

  // 웹소켓 메시지 처리 - 새로운 데이터 타입 지원
  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;
      
      switch (type) {
        case 'sensor_data':
          // 온도, 습도만
          if (data.temperature !== undefined) {
            setTemperature(data.temperature);
            console.log(`📊 [센서] 온도: ${data.temperature}°C, 습도: ${data.humidity}%`);
          }
          if (data.humidity !== undefined) {
            setHumidity(data.humidity);
          }
          break;
          
        case 'position_data':
          // 위치 데이터 (그리드 + 좌표)
          console.log(`📍 [위치] 그리드: ${data.current_grid}, 좌표: (${data.x}, ${data.y})`);
          break;
          
        case 'detection_data':
          // 가축 감지 데이터
          if (data.livestock_detected !== undefined) {
            setHumanDetected(data.livestock_detected);
            console.log(`🐷 [가축 감지] ${data.livestock_detected ? '감지됨' : '감지 안됨'}`);
          }
          break;
          
        case 'camera_data':
          // AI 카메라 데이터
          console.log(`📷 [카메라] 상태: ${data.status}, FPS: ${data.fps}, 객체: ${data.detected_objects?.length || 0}개`);
          break;
          
        case 'tracking_data':
          // 기존 호환성
          setHumanDetected(data.human_detected);
          setDistance(data.distance);
          setDirection(data.direction);
          break;
          
        case 'device_status':
          deviceControl.setIsRunning(data.is_running);
          deviceControl.setSelectedMode(data.tracking_mode);
          break;
          
        default:
          // 알 수 없는 타입은 무시 (에러 로그 제거)
          break;
      }
    }
  }, [lastMessage, deviceControl]);

  // 나머지 코드는 동일...
  useEffect(() => {
    const temps = Object.values(visualization.gridTemperatures);
    
    if (temps.length > 0) {
      const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
      setTemperature(Math.round(avgTemp * 10) / 10);
      console.log(`📊 [평균 온도] ${temps.length}개 격자 평균: ${avgTemp.toFixed(1)}°C`);
    }
  }, [visualization.gridTemperatures]);

  useEffect(() => {
    const humidities = Object.values(visualization.gridHumidities);
    
    if (humidities.length > 0) {
      const avgHumidity = humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length;
      setHumidity(Math.round(avgHumidity));
      console.log(`💧 [평균 습도] ${humidities.length}개 격자 평균: ${avgHumidity.toFixed(1)}%`);
    }
  }, [visualization.gridHumidities]);

  useEffect(() => {
    if (activeTab === '대시보드') {
      loadDashboardData();
    } else if (activeTab === '스케줄 관리') {
      scheduleManager.loadSchedules();
    }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomDetected = Math.random() > 0.3;
      setHumanDetected(randomDetected);
      console.log('🔄 [시간] 인체 감지 상태 변경:', randomDetected ? '감지됨' : '감지 안됨');
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (visualization.patrolCurrentGrid !== undefined) {
      const randomDetected = Math.random() > 0.4;
      setHumanDetected(randomDetected);
      console.log(`🔍 [구역 ${visualization.patrolCurrentGrid}] 인체 감지:`, randomDetected ? '감지됨' : '감지 안됨');
    }
  }, [visualization.patrolCurrentGrid]);

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

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [deviceResponse, sensorResponse] = await Promise.all([
        deviceAPI.getStatus(),
        sensorAPI.getLatestData()
      ]);
      
      deviceControl.setIsRunning(deviceResponse.data.is_running);
      deviceControl.setSelectedMode(deviceResponse.data.tracking_mode);
      
      setTemperature(sensorResponse.data.temperature);
      setHumidity(sensorResponse.data.humidity);
      
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSafetyStatus = () => (waterTank < 10) ? 'unsafe' : 'safe';
  const getSprayStatus = () => deviceControl.isRunning ? '동작' : '정지';

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
    setEditingScheduleId(schedule.id);
    setEditSchedule({
      title: schedule.title,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      selectedDays: schedule.days,
      mode: schedule.mode,
      isEnabled: schedule.enabled
    });
    setIsEditScheduleModalOpen(true);
  };

  const closeEditScheduleModal = () => {
    setIsEditScheduleModalOpen(false);
    setEditingScheduleId(null);
    setEditSchedule({
      title: '',
      startTime: '',
      endTime: '',
      selectedDays: [],
      mode: '자동',
      isEnabled: true
    });
  };

  const handleDayToggle = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleEditDayToggle = (day) => {
    setEditSchedule(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.title || !newSchedule.startTime || !newSchedule.endTime || newSchedule.selectedDays.length === 0) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    scheduleManager.addSchedule({
      title: newSchedule.title,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      days: newSchedule.selectedDays,
      mode: newSchedule.mode,
      enabled: newSchedule.isEnabled
    });

    closeNewScheduleModal();
  };

  const handleUpdateSchedule = () => {
    if (!editSchedule.title || !editSchedule.startTime || !editSchedule.endTime || editSchedule.selectedDays.length === 0) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    scheduleManager.updateSchedule(editingScheduleId, {
      title: editSchedule.title,
      startTime: editSchedule.startTime,
      endTime: editSchedule.endTime,
      days: editSchedule.selectedDays,
      mode: editSchedule.mode,
      enabled: editSchedule.isEnabled
    });

    closeEditScheduleModal();
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-container">
            <img 
              src={`${process.env.PUBLIC_URL}/coolingfog-logo.png`} 
              alt="CoolingFog Logo" 
              className="logo-image"
            />
          </div>
          <h1 className="app-title">CoolingFog</h1>
          <p className="app-subtitle">이동식 쿨링포그<br/>제어 시스템</p>
        </div>

        <nav className="nav-menu">
          <button
            onClick={() => setActiveTab('대시보드')}
            className={`nav-button ${activeTab === '대시보드' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span>대시보드</span>
          </button>
          <button
            onClick={() => setActiveTab('추적 시각화')}
            className={`nav-button ${activeTab === '추적 시각화' ? 'active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <span>추적 시각화</span>
          </button>
          <button
            onClick={() => setActiveTab('스케줄 관리')}
            className={`nav-button ${activeTab === '스케줄 관리' ? 'active' : ''}`}
          >
            <span className="nav-icon">📅</span>
            <span>스케줄 관리</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? '연결됨' : '연결 끊김'}</span>
          </div>
          <p className="copyright">© 2025 CoolingFog</p>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === '대시보드' && (
          <DashboardTab
            temperature={temperature}
            humidity={humidity}
            waterTank={waterTank}
            humanDetected={humanDetected}
            distance={distance}
            direction={direction}
            isRunning={deviceControl.isRunning}
            selectedMode={deviceControl.selectedMode}
            safetyStatus={getSafetyStatus()}
            sprayStatus={getSprayStatus()}
            onDeviceToggle={deviceControl.handleDeviceToggle}
            onModeChange={deviceControl.handleTrackingModeChange}
            isLoading={isLoading}
            error={error}
          />
        )}
        
        {activeTab === '추적 시각화' && (
          <VisualizationTab
            isRunning={deviceControl.isRunning}
            selectedMode={deviceControl.selectedMode}
            gridTemperatures={visualization.gridTemperatures}
            gridHumidities={visualization.gridHumidities}
            gridStates={visualization.gridStates}
            patrolCurrentGrid={visualization.patrolCurrentGrid}
            onGridClick={visualization.handleGridClick}
            deviceControl={deviceControl}
          />
        )}
        
        {activeTab === '스케줄 관리' && (
          <ScheduleTab
            schedules={scheduleManager.schedules}
            schedulerEnabled={scheduleManager.schedulerEnabled}
            onToggleScheduler={scheduleManager.toggleScheduler}
            onToggleSchedule={scheduleManager.toggleSchedule}
            onDeleteSchedule={scheduleManager.deleteSchedule}
            onEditSchedule={openEditScheduleModal}
            onAddSchedule={openNewScheduleModal}
            selectedMode={deviceControl.selectedMode}
          />
        )}

        {/* 스케줄 수정 모달 */}
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
                  <option value="자동">추적</option>
                  <option value="수동">순찰</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editSchedule.isEnabled}
                    onChange={(e) => setEditSchedule(prev => ({...prev, isEnabled: e.target.checked}))}
                  />
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
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newSchedule.isEnabled}
                    onChange={(e) => setNewSchedule(prev => ({...prev, isEnabled: e.target.checked}))}
                  />
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
      </main>
    </div>
  );
};

export default Dashboard;