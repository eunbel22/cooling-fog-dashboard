import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  // 상태 관리
  const [temperature, setTemperature] = useState(28.5);
  const [humidity, setHumidity] = useState(65);
  const [battery, setBattery] = useState(85);
  const [waterTank, setWaterTank] = useState(70);
  const [mistLevel, setMistLevel] = useState(40);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMode, setSelectedMode] = useState('자동');
  const [humanDetected, setHumanDetected] = useState(true); // 인체 감지 상태
  const [distance, setDistance] = useState(2.3); // 거리
  const [direction, setDirection] = useState('북쪽'); // 방향
  
  // 스케줄 상태 관리
  const [schedules, setSchedules] = useState([
    {
      id: 1,
      title: '오후 쿨링 타임',
      time: '오후 11:00 - 오전 01:00',
      intensity: '80%',
      mode: '자동',
      repeat: '화, 수, 목, 금',
      isActive: true
    },
    {
      id: 2,
      title: '저녁 휴식 시간',
      time: '오전 04:00 - 오전 06:00',
      intensity: '60%',
      mode: '수동',
      repeat: '토, 일',
      isActive: true
    }
  ]);

  // 새 스케줄 모달 상태
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    startTime: '',
    endTime: '',
    selectedDays: [],
    mode: '자동',
    intensity: 70,
    isEnabled: true
  });
  const [editSchedule, setEditSchedule] = useState({
    title: '',
    startTime: '',
    endTime: '',
    selectedDays: [],
    mode: '자동',
    intensity: 70,
    isEnabled: true
  });

  // 기기 상태에 따른 텍스트 및 스타일 결정
  const getSprayStatus = () => {
    return isRunning ? '동작' : '정지';
  };

  const getSprayStatusStyle = () => {
    return isRunning ? 'status-good' : 'status-normal';
  };

  const getHumanDetectionStatus = () => {
    return humanDetected ? '감지됨' : '감지되지 않음';
  };

  const getHumanDetectionStyle = () => {
    return humanDetected ? 'status-good' : 'status-normal';
  };

  // 정지 버튼 클릭 핸들러
  const handleStopClick = () => {
    setIsRunning(false);
  };

  // 스케줄 활성/비활성 토글
  const toggleScheduleStatus = (scheduleId) => {
    setSchedules(prevSchedules => 
      prevSchedules.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, isActive: !schedule.isActive }
          : schedule
      )
    );
  };

  // 새 스케줄 모달 핸들러
  const openNewScheduleModal = () => {
    setIsNewScheduleModalOpen(true);
  };

  const closeNewScheduleModal = () => {
    setIsNewScheduleModalOpen(false);
    setNewSchedule({
      title: '',
      startTime: '',
      endTime: '',
      selectedDays: [],
      mode: '자동',
      intensity: 70,
      isEnabled: true
    });
  };

  // 편집 모달 핸들러
  const openEditScheduleModal = (schedule) => {
    const dayMapping = {
      '화': '화', '수': '수', '목': '목', '금': '금', '월': '월', '토': '토', '일': '일'
    };
    
    const selectedDays = schedule.repeat.split(', ').map(day => dayMapping[day] || day);
    const [startTime, endTime] = schedule.time.includes(' - ') ? 
      schedule.time.split(' - ').map(time => {
        // "오전 04:00" -> "04:00", "오후 11:00" -> "23:00" 형식 변환
        const timeOnly = time.replace(/오전 |오후 /, '');
        if (time.includes('오후') && !timeOnly.startsWith('12:')) {
          const [hour, minute] = timeOnly.split(':');
          return `${parseInt(hour) + 12}:${minute}`;
        }
        return timeOnly;
      }) : ['', ''];

    setEditSchedule({
      title: schedule.title,
      startTime,
      endTime,
      selectedDays,
      mode: schedule.mode,
      intensity: parseInt(schedule.intensity.replace('%', '')),
      isEnabled: schedule.isActive
    });
    setEditingScheduleId(schedule.id);
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
      intensity: 70,
      isEnabled: true
    });
  };

  const handleEditDayToggle = (day) => {
    setEditSchedule(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  // 스케줄 삭제 핸들러
  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('이 스케줄을 삭제하시겠습니까?')) {
      setSchedules(prevSchedules => 
        prevSchedules.filter(schedule => schedule.id !== scheduleId)
      );
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
        intensity: `${editSchedule.intensity}%`,
        mode: editSchedule.mode,
        repeat: editSchedule.selectedDays.join(', '),
        isActive: editSchedule.isEnabled
      };

      setSchedules(prev => prev.map(schedule => 
        schedule.id === editingScheduleId ? updatedSchedule : schedule
      ));
      closeEditScheduleModal();
    }
  };

  const handleDayToggle = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleCreateSchedule = () => {
    if (newSchedule.title && newSchedule.startTime && newSchedule.endTime && newSchedule.selectedDays.length > 0) {
      const newId = Math.max(...schedules.map(s => s.id)) + 1;
      const newScheduleItem = {
        id: newId,
        title: newSchedule.title,
        time: `${newSchedule.startTime} - ${newSchedule.endTime}`,
        intensity: `${newSchedule.intensity}%`,
        mode: newSchedule.mode,
        repeat: newSchedule.selectedDays.join(', '),
        isActive: newSchedule.isEnabled
      };
      setSchedules(prev => [...prev, newScheduleItem]);
      closeNewScheduleModal();
    }
  };

  // 상태 카드 컴포넌트 (상단 4개)
  const StatusCard = ({ title, value, unit, icon, showProgress, progressColor = 'blue' }) => (
    <div className="status-card">
      <div className="status-card-header">
        <span className="status-card-title">{title}</span>
        <div className="status-card-icon">
          {icon}
        </div>
      </div>
      <div className="status-card-value">
        <span className="value">{value}</span>
        <span className="unit">{unit}</span>
      </div>
      {showProgress && (
        <div className="progress-container">
          <div 
            className={`progress-bar ${progressColor}`}
            style={{ width: `${value}%` }}
          ></div>
        </div>
      )}
    </div>
  );

  // 하단 정보 카드 컴포넌트
  const InfoCard = ({ title, value, unit, icon }) => (
    <div className="info-card">
      <div className="info-card-header">
        <span className="info-card-title">{title}</span>
        <div className="info-card-icon">
          {icon}
        </div>
      </div>
      <div className="info-card-value">
        <span className="value">{value}</span>
        <span className="unit">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* 상태바 스타일 헤더 */}
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
                <span className="status-text">연결됨</span>
              </div>
              <div className="status-item">
                <img src="/assets/icons/battery-icon.svg" alt="Battery" className="status-icon" />
                <span className="status-text">{battery}%</span>
              </div>
              <div className="status-item">
                <img src="/assets/icons/water-icon.svg" alt="Water" className="status-icon" />
                <span className="status-text">{waterTank}%</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${isRunning ? 'active' : 'inactive'}`}></div>
                <span className="status-text">{getSprayStatus()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 상단 상태 카드들 (4개) - 한 줄 */}
        <div className="status-grid-horizontal">
          <StatusCard 
            title="온도" 
            value="28.5" 
            unit="°C" 
            icon={<img src="/assets/icons/temperature.svg" alt="temperature" className="card-icon" />}
          />
          <StatusCard 
            title="습도" 
            value="65" 
            unit="%" 
            icon={<img src="/assets/icons/humidity.svg" alt="humidity" className="card-icon" />}
            showProgress={true}
            progressColor="blue"
          />
          <StatusCard 
            title="배터리" 
            value={battery} 
            unit="%" 
            icon={<img src="/assets/icons/battery.svg" alt="battery" className="card-icon" />}
            showProgress={true}
            progressColor="blue"
          />
          <StatusCard 
            title="물탱크" 
            value={waterTank} 
            unit="%" 
            icon={<img src="/assets/icons/water-tank-icon.svg" alt="water-tank" className="card-icon" />}
            showProgress={true}
            progressColor="purple"
          />
        </div>

        {/* 하단 정보 카드들 (4개) - 한 줄 */}
        <div className="info-grid-horizontal">
          <InfoCard 
            title="분사 강도" 
            value={mistLevel} 
            unit="%" 
            icon={<img src="/assets/icons/Spray-sensitivity-icon.svg" alt="Spray-sensitivity" className="card-icon" />}
          />
          <InfoCard 
            title="인체 감지" 
            value={getHumanDetectionStatus()} 
            unit="" 
            icon={<img src="/assets/icons/people-icon.svg" alt="people" className="card-icon" />}
          />
          <InfoCard 
            title="거리 방향" 
            value={distance} 
            unit={`m ${direction}`} 
            icon={<img src="/assets/icons/street-direction-icon.svg" alt="street-direction" className="card-icon" />}
          />
          <InfoCard 
            title="안전 상태" 
            value="안전" 
            unit="" 
            icon={<img src="/assets/icons/safe-icon.svg" alt="safe" className="card-icon" />}
          />
        </div>

        {/* 기기 제어와 추적 제어 - 같은 줄 */}
        <div className="controls-row">
          {/* 기기 제어 */}
          <div className="control-section-half">
            <h3>
              <img src="/assets/icons/device-control.svg" alt="device-control" className="section-icon" />
              기기 제어
            </h3>
            
            <div className="control-content-vertical">
              {/* 시작/일시정지 버튼 */}
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`control-button ${isRunning ? 'pause-button' : 'start-button'}`}
              >
                {isRunning ? 
                  <img src="/assets/icons/pause.svg" alt="pause" className="button-icon" /> : 
                  <img src="/assets/icons/start.svg" alt="start" className="button-icon" />
                }
                <span>{isRunning ? '일시정지' : '시작'}</span>
              </button>

              {/* 분사 강도 조절 */}
              <div className="slider-container-compact">
                <div className="slider-header">
                  <span>분사 강도: {mistLevel}%</span>
                </div>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mistLevel}
                    onChange={(e) => setMistLevel(e.target.value)}
                    className="slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${mistLevel}%, #e5e7eb ${mistLevel}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>

              {/* 긴급 정지 버튼 */}
              <button 
                className="stop-button-compact"
                onClick={handleStopClick}
              >
                <img src="/assets/icons/stop.svg" alt="stop" className="button-icon" />
                <span>긴급 정지</span>
              </button>
            </div>
          </div>

          {/* 추적 제어 */}
          <div className="tracking-section-half">
            <h3>
              <img src="/assets/icons/tracking-control.svg" alt="tracking-control" className="section-icon" />
              추적제어
            </h3>
            
            <div className="tracking-content-vertical">
              <div className="mode-selector-vertical">
                <span>추적 모드</span>
                <div className="mode-buttons-full">
                  {['자동', '수동', '끄기'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`mode-button-full ${
                        mode === '자동' && selectedMode === mode ? 'active-blue' :
                        mode === '수동' && selectedMode === mode ? 'active-white' :
                        mode === '끄기' && selectedMode === mode ? 'active-gray' :
                        'inactive'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tracking-status">
                <p className="tracking-status-title">추적 상태</p>
                <p className="tracking-status-content">
                  현재 모드: {selectedMode}<br />
                  안전거리: 1.0m 이상 유지
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 추적 시각화 - 한 줄 */}
        <div className="visualization-section">
          <h3>
            <img src="/assets/icons/tracking-visualization.svg" alt="tracking-visualization" className="section-icon" />
            추적 시각화
          </h3>
          <div className="visualization-content">
            <div className="radar-container">
              <h4>레이더뷰</h4>
              <div className="radar-chart">
                <div className="radar-circles">
                  <div className="radar-circle outer"></div>
                  <div className="radar-circle middle"></div>
                  <div className="radar-circle inner"></div>
                  <div className="radar-center"></div>
                  <div className="radar-target"></div>
                </div>
                <div className="radar-directions">
                  <div className="direction north">N</div>
                  <div className="direction east">E</div>
                  <div className="direction south">S</div>
                  <div className="direction west">W</div>
                </div>
              </div>
              <div className="radar-legend">
                <div className="legend-item">
                  <div className="legend-dot blue"></div>
                  <span>쿨링포그 장치</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot green"></div>
                  <span>추적대상</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot red"></div>
                  <span>안전구역</span>
                </div>
              </div>
            </div>
            
            <div className="tracking-info">
              <h4>추적 정보</h4>
              <div className="tracking-sections">
                
                {/* 인체 감지 섹션 */}
                <div className="tracking-section-box">
                  <div className="tracking-item">
                    <span>인체 감지</span>
                    <div className="tracking-value">
                      <span className="person-icon">👤</span>
                      <span className={getHumanDetectionStyle()}>{getHumanDetectionStatus()}</span>
                    </div>
                  </div>
                </div>
                
                {/* 거리 섹션 */}
                <div className="tracking-section-box">
                  <div className="tracking-item">
                    <span>거리</span>
                    <span className="distance-value">{distance}m</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar green" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                {/* 방향 섹션 */}
                <div className="tracking-section-box">
                  <div className="tracking-item">
                    <span>방향</span>
                    <span className="direction-value">{direction}</span>
                  </div>
                </div>
                
                {/* 분사상태 섹션 */}
                <div className="tracking-section-box">
                  <div className="tracking-item">
                    <span>분사상태</span>
                    <div className="tracking-value">
                      <div className={`status-dot ${isRunning ? 'active' : 'inactive'}`}></div>
                      <span className={getSprayStatusStyle()}>{getSprayStatus()}</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* 스케줄 관리 */}
        <div className="schedule-section">
          <div className="schedule-header">
            <h3>
              <img src="/assets/icons/schedule-management.svg" alt="schedule-management" className="section-icon" />
              스케줄 관리
            </h3>
            <button className="add-schedule-button" onClick={openNewScheduleModal}>+ 새 스케줄</button>
          </div>
          
          <div className="schedule-list">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="schedule-item">
                <div className="schedule-title">
                  <span>{schedule.title}</span>
                  <span className={`schedule-status ${schedule.isActive ? 'active' : 'inactive'}`}>
                    {schedule.isActive ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="schedule-details">
                  <span>
                    <img src="/assets/icons/time.svg" alt="time" className="inline-icon" />
                    {schedule.time}
                  </span>
                  <span>강도: {schedule.intensity}</span>
                  <span>모드: {schedule.mode}</span>
                </div>
                <div className="schedule-repeat">반복: {schedule.repeat}</div>
                <div className="schedule-actions">
                  <button onClick={() => toggleScheduleStatus(schedule.id)}>
                    <img 
                      src="/assets/icons/power.svg" 
                      alt="power" 
                      className={`action-icon ${schedule.isActive ? 'power-active' : 'power-inactive'}`} 
                    />
                  </button>
                  <button onClick={() => openEditScheduleModal(schedule)}>
                    <img src="/assets/icons/edit.svg" alt="edit" className="action-icon" />
                  </button>
                  <button onClick={() => handleDeleteSchedule(schedule.id)}>
                    <img src="/assets/icons/delete.svg" alt="delete" className="action-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="footer-section">
          <div className="footer-grid">
            <div className="footer-column">
              <h4>고객지원</h4>
              <div className="footer-content">
                <p>1234-5678</p>
                <p>whyisthishappening@coolingfog.com</p>
                <p>평일 09:00 - 18:00</p>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>도움말</h4>
              <div className="footer-content">
                <p>사용자 매뉴얼</p>
                <p>자주 묻는 질문</p>
                <p>문제 해결 가이드</p>
                <p>원격지원 요청</p>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>정책 및 정보</h4>
              <div className="footer-content">
                <p>개인정보처리방침</p>
                <p>이용약관</p>
                <p>안전 사용 가이드</p>
              </div>
            </div>
          </div>
        </div>

        {/* 스케줄 편집 모달 */}
        {isEditScheduleModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>스케줄 편집</h3>
              
              <div className="form-group">
                <label>스케줄 이름</label>
                <input
                  type="text"
                  placeholder="저녁 휴식 시간"
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
                  <option value="끄기">끄기</option>
                </select>
              </div>

              <div className="form-group">
                <label>분사 강도: {editSchedule.intensity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editSchedule.intensity}
                  onChange={(e) => setEditSchedule(prev => ({...prev, intensity: parseInt(e.target.value)}))}
                  className="intensity-slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${editSchedule.intensity}%, #e5e7eb ${editSchedule.intensity}%, #e5e7eb 100%)`
                  }}
                />
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
                  <option value="자동">자동</option>
                  <option value="수동">수동</option>
                  <option value="끄기">끄기</option>
                </select>
              </div>

              <div className="form-group">
                <label>분사 강도: {newSchedule.intensity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newSchedule.intensity}
                  onChange={(e) => setNewSchedule(prev => ({...prev, intensity: parseInt(e.target.value)}))}
                  className="intensity-slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${newSchedule.intensity}%, #e5e7eb ${newSchedule.intensity}%, #e5e7eb 100%)`
                  }}
                />
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