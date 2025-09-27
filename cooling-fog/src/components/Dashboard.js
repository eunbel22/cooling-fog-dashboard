import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { deviceAPI, sensorAPI, trackingAPI, scheduleAPI } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';

const Dashboard = () => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState('대시보드');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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
  // 상태에 추가할 변수들
  //const [actualDevicePosition, setActualDevicePosition] = useState({ bottom: '50%', left: '50%' });
  //const [actualHumanPosition, setActualHumanPosition] = useState({ top: '50%', left: '50%' });
  

  //웹소켓 연결
  const { lastMessage, isConnected, error: wsError } = useWebSocket('ws://localhost:8050/ws/realtime');


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


  const [manualTargetGrid, setManualTargetGrid] = useState(null); // 수동 모드 클릭 위치
  const [patrolCurrentGrid, setPatrolCurrentGrid] = useState(0); // 끄기 모드 순찰 위치
  const [gridTemperatures, setGridTemperatures] = useState({}); // 구역별 온도 저장
  const [isPatrolling, setIsPatrolling] = useState(false); // 순찰 상태 여부
  const [activeSchedules, setActiveSchedules] = useState([]); // 현재 활성 스케줄들
  const [schedulerEnabled, setSchedulerEnabled] = useState(true); // 스케줄러 활성화 여부
  const [lastScheduleCheck, setLastScheduleCheck] = useState(null); // 마지막 체크 시간

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
  
// useEffect 추가하여 컴포넌트 로드 시 데이터 가져오기
  useEffect(() => {
    if (activeTab === '대시보드') {
      loadDashboardData();
    } else if (activeTab === '스케줄 관리') {
      loadSchedules();
    }
  }, [activeTab]);

  // 실시간 데이터 처리 useEffect 수정
  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;
      
      switch (type) {
        case 'sensor_data':
          setTemperature(data.temperature);
          setHumidity(data.humidity);
          setBattery(data.battery_level);
          setWaterTank(data.water_tank_level);
          break;
          
        case 'tracking_data':
          setHumanDetected(data.human_detected);
          setDistance(data.distance);
          setDirection(data.direction);
          break;
          
        // 이 부분을 제거하거나 주석 처리하세요
        // case 'position_data':  
        //   if (data.device_position) {
        //     setActualDevicePosition(data.device_position);
        //   }
        //   if (data.human_position) {
        //     setActualHumanPosition(data.human_position);
        //   }
        //   break;
          
        case 'device_status':
          setIsRunning(data.is_running);
          setMistLevel(data.spray_intensity);
          setSelectedMode(data.tracking_mode);
          break;
          
        default:
          console.log('알 수 없는 메시지 타입:', type);
      }
    }
  }, [lastMessage]);

  // 스케줄 데이터 로드 함수
  const loadSchedules = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await scheduleAPI.getAll();
      const backendSchedules = response.data.schedules;
      
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const formattedSchedules = backendSchedules.map(schedule => {
        // 숫자 요일을 한글로 변환
        const dayMap = {1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일'};
        const koreanDays = schedule.days_of_week.map(dayNum => dayMap[dayNum]);
        
        return {
          id: schedule.id,
          title: schedule.title,
          time: `${schedule.start_time} - ${schedule.end_time}`,
          intensity: `${schedule.intensity}%`,
          mode: schedule.mode,
          repeat: koreanDays.join(', '), // 한글 요일로 변환
          isActive: schedule.is_active
        };
      });
      
      setSchedules(formattedSchedules);
    } catch (err) {
      setError('스케줄을 불러오는 중 오류가 발생했습니다.');
      console.error('Schedule loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 요일을 숫자로 반환하는 함수 (1: 월, 2: 화, ..., 7: 일)
  const getCurrentDayNumber = () => {
    const today = new Date();
    const day = today.getDay(); // 0: 일요일, 1: 월요일, ...
    return day === 0 ? 7 : day; // 일요일을 7로 변경
  };

  // 시간을 분 단위로 변환하는 함수
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 현재 시간을 분 단위로 반환
  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // 활성 스케줄 확인 함수
  const checkActiveSchedules = () => {
    if (!schedulerEnabled || !schedules || schedules.length === 0) {
      return [];
    }
    
    const currentDay = getCurrentDayNumber();
    const currentMinutes = getCurrentMinutes();
    const currentTime = new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    
    const newActiveSchedules = [];
    
    schedules.forEach(schedule => {
      if (!schedule.isActive) return;
      
      // 요일 확인
      const dayMap = {'월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7};
      const scheduleDays = schedule.repeat.split(', ').map(day => dayMap[day]).filter(Boolean);
      
      if (!scheduleDays.includes(currentDay)) return;
      
      // 시간 파싱 (12시간제를 24시간제로 변환)
      const parseTime = (timeStr) => {
        let [period, time] = timeStr.includes('오전') || timeStr.includes('오후') 
          ? [timeStr.includes('오후') ? 'PM' : 'AM', timeStr.replace(/오전 |오후 /, '')]
          : ['24H', timeStr];
        
        const [hours, minutes] = time.split(':').map(Number);
        let adjustedHours = hours;
        
        if (period === 'PM' && hours !== 12) adjustedHours += 12;
        if (period === 'AM' && hours === 12) adjustedHours = 0;
        
        return adjustedHours * 60 + minutes;
      };
      
      try {
        let [startTime, endTime] = schedule.time.split(' - ');
        const startMinutes = parseTime(startTime);
        let endMinutes = parseTime(endTime);
        
        // 다음날로 넘어가는 스케줄 처리 (예: 23:00 - 01:00)
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60; // 다음날로 연장
        }
        
        // 현재 시간이 스케줄 시간 범위 내인지 확인
        let isInRange = false;
        if (endMinutes > 24 * 60) { // 자정을 넘나드는 경우
          isInRange = (currentMinutes >= startMinutes) || (currentMinutes <= endMinutes - 24 * 60);
        } else {
          isInRange = (currentMinutes >= startMinutes && currentMinutes < endMinutes);
        }
        
        if (isInRange) {
          newActiveSchedules.push({
            ...schedule,
            startMinutes,
            endMinutes: endMinutes > 24 * 60 ? endMinutes - 24 * 60 : endMinutes,
            currentTime
          });
        }
      } catch (error) {
        console.error(`스케줄 "${schedule.title}" 시간 파싱 오류:`, error);
      }
    });
    
    // 상태 업데이트는 변경이 있을 때만
    setActiveSchedules(prev => {
      const isSame = JSON.stringify(prev) === JSON.stringify(newActiveSchedules);
      if (isSame) return prev;
      return newActiveSchedules;
    });
    
    setLastScheduleCheck(new Date());
    
    return newActiveSchedules;
  };

  // 스케줄에 따른 장치 제어 실행 - 무한 루프 방지
  const executeScheduleControl = (activeScheduleList) => {
    if (activeScheduleList.length === 0) {
      return; // 활성 스케줄이 없으면 아무것도 하지 않음
    }
    
    // 가장 최근에 시작된 스케줄을 우선적으로 적용
    const primarySchedule = activeScheduleList.reduce((latest, current) => {
      return current.startMinutes > latest.startMinutes ? current : latest;
    });
    
    console.log(`스케줄 "${primarySchedule.title}" 실행 중:`, {
      intensity: primarySchedule.intensity,
      mode: primarySchedule.mode,
      time: primarySchedule.currentTime
    });
    
    // 분사 강도 설정 - 현재 값과 다를 때만 변경
    const intensityValue = parseInt(primarySchedule.intensity.replace('%', ''));
    if (intensityValue !== mistLevel) {
      console.log(`분사 강도 변경: ${mistLevel}% → ${intensityValue}%`);
      handleSprayIntensityChange(intensityValue); // 기존 함수 사용
    }
    
    // 추적 모드 설정 - 현재 값과 다를 때만 변경
    if (primarySchedule.mode !== selectedMode) {
      console.log(`추적 모드 변경: ${selectedMode} → ${primarySchedule.mode}`);
      handleTrackingModeChange(primarySchedule.mode); // 기존 함수 사용
    }
    
    // 장치 시작 - 현재 꺼져있을 때만 시작
    if (!isRunning) {
      console.log('스케줄에 의한 장치 시작');
      handleDeviceToggle(); // 기존 함수 사용
    }
  };

  // 스케줄 체크 useEffect
  useEffect(() => {
    if (!schedulerEnabled || !schedules || schedules.length === 0) return;
    
    const checkInterval = setInterval(() => {
      const activeScheduleList = checkActiveSchedules();
      executeScheduleControl(activeScheduleList);
    }, 30000); // 30초마다 체크
    
    // 초기 실행
    const initialActiveSchedules = checkActiveSchedules();
    executeScheduleControl(initialActiveSchedules);
    
    return () => clearInterval(checkInterval);
  }, [schedules, schedulerEnabled]);


  // 스케줄러 상태 표시 컴포넌트
  const ScheduleStatus = () => {
    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    return (
      <div className="schedule-status">
        <div className="scheduler-header">
          <h4>스케줄 자동화</h4>
          <label className="scheduler-toggle">
            <input
              type="checkbox"
              checked={schedulerEnabled}
              onChange={(e) => setSchedulerEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {schedulerEnabled ? '활성' : '비활성'}
            </span>
          </label>
        </div>
        
        {schedulerEnabled && (
          <>
            <div className="current-status">
              <span className="status-label">마지막 확인:</span>
              <span className="status-time">
                {lastScheduleCheck ? lastScheduleCheck.toLocaleTimeString('ko-KR') : '대기중'}
              </span>
            </div>
            
            {activeSchedules.length > 0 ? (
              <div className="active-schedule-info">
                <div className="active-schedule-header">현재 활성 스케줄</div>
                {activeSchedules.map(schedule => (
                  <div key={schedule.id} className="active-schedule-item">
                    <div className="schedule-name">{schedule.title}</div>
                    <div className="schedule-details-mini">
                      <span>강도: {schedule.intensity}</span>
                      <span>모드: {schedule.mode}</span>
                      <span>시간: {schedule.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-active-schedule">현재 활성 스케줄 없음</div>
            )}
          </>
        )}
      </div>
    );
  };

  // 수동 제어 경고 표시
  const ManualControlWarning = () => {
    if (activeSchedules.length === 0 || !schedulerEnabled) return null;
    
    return (
      <div className="manual-control-warning">
        <div className="warning-icon">⚠️</div>
        <div className="warning-text">
          <strong>스케줄 실행 중</strong><br />
          수동 조작시 스케줄 설정이 우선 적용될 수 있습니다.
        </div>
        <button 
          className="disable-scheduler-btn"
          onClick={() => setSchedulerEnabled(false)}
        >
          스케줄러 일시 중지
        </button>
      </div>
    );
  };
  

  // 대시보드 데이터 로드 함수
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 병렬로 여러 API 호출
      const [deviceResponse, sensorResponse, trackingResponse] = await Promise.all([
        deviceAPI.getStatus(),
        sensorAPI.getLatestData(),
        trackingAPI.getLatestData()
      ]);
      
      // 기기 상태 업데이트
      const deviceData = deviceResponse.data;
      setIsRunning(deviceData.is_running);
      setMistLevel(deviceData.spray_intensity);
      setSelectedMode(deviceData.tracking_mode);
      
      // 센서 데이터 업데이트
      const sensorData = sensorResponse.data;
      setTemperature(sensorData.temperature);
      setHumidity(sensorData.humidity);
      setBattery(sensorData.battery_level);
      setWaterTank(sensorData.water_tank_level);
      
      // 추적 데이터 업데이트
      const trackingData = trackingResponse.data;
      setHumanDetected(trackingData.human_detected);
      setDistance(trackingData.distance);
      setDirection(trackingData.direction);
      
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  // 기기 시작/정지 함수 수정
  const handleDeviceToggle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isRunning) {
        await deviceAPI.stop();
        setIsRunning(false);
      } else {
        await deviceAPI.start();
        setIsRunning(true);
      }
    } catch (err) {
      setError('기기 제어 중 오류가 발생했습니다.');
      console.error('Device control error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 분사 강도 변경 함수 수정
  const handleSprayIntensityChange = async (newIntensity) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deviceAPI.setSprayIntensity(newIntensity);
      setMistLevel(newIntensity);
    } catch (err) {
      setError('분사 강도 설정 중 오류가 발생했습니다.');
      console.error('Spray intensity error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 추적 모드 변경 함수 수정
  const handleTrackingModeChange = async (mode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deviceAPI.setTrackingMode(mode);
      setSelectedMode(mode);
    } catch (err) {
      setError('추적 모드 설정 중 오류가 발생했습니다.');
      console.error('Tracking mode error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 긴급 정지 함수 수정
  const handleEmergencyStop = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deviceAPI.stop();
      setIsRunning(false);
      setMistLevel(0);
    } catch (err) {
      setError('긴급 정지 중 오류가 발생했습니다.');
      console.error('Emergency stop error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  

  

  // 안전 상태 판단 함수
  const getSafetyStatus = () => {
    // 배터리나 물탱크가 10% 미만이면 미안전
    if (battery < 10 || waterTank < 10) {
      return '미안전';
    }
    return '안전';
  };

  // 안전 상태 스타일 함수
  const getSafetyStatusStyle = () => {
    if (battery < 10 || waterTank < 10) {
      return 'status-danger'; // 빨간색 스타일
    }
    return 'status-good'; // 초록색 스타일
  };

  // 안전 상태 아이콘 함수
  const getSafetyIcon = () => {
    if (battery < 10 || waterTank < 10) {
      return "/assets/icons/warning-icon.svg"; // 경고 아이콘
    }
    return "/assets/icons/safe-icon.svg"; // 안전 아이콘
  };

  // 기기 상태에 따른 텍스트 및 스타일 결정
  const getSprayStatus = () => {
    return isRunning ? '동작' : '정지';
  };
  

  const getSprayStatusStyle = () => {
    return isRunning ? 'status-good' : 'status-normal';
  };


  // 인체 감지 상태에 따른 아이콘 결정 함수 추가
  const getHumanDetectionIcon = () => {
    return humanDetected 
      ? "/assets/icons/people-icon (2).svg"  // 감지됨 아이콘
      : "/assets/icons/people-no-icon.svg";  // 감지 안됨 아이콘
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

  // 9개 격자 구역 정의 (3x3 그리드)
  const GRID_POSITIONS = [
    // 첫 번째 행 (북쪽)
    { row: 0, col: 0, name: "북서", position: { top: "16.67%", left: "16.67%" } },
    { row: 0, col: 1, name: "북중", position: { top: "16.67%", left: "50%" } },
    { row: 0, col: 2, name: "북동", position: { top: "16.67%", left: "83.33%" } },
    // 두 번째 행 (중앙)
    { row: 1, col: 0, name: "중서", position: { top: "50%", left: "16.67%" } },
    { row: 1, col: 1, name: "중앙", position: { top: "50%", left: "50%" } },
    { row: 1, col: 2, name: "중동", position: { top: "50%", left: "83.33%" } },
    // 세 번째 행 (남쪽)
    { row: 2, col: 0, name: "남서", position: { top: "83.33%", left: "16.67%" } },
    { row: 2, col: 1, name: "남중", position: { top: "83.33%", left: "50%" } },
    { row: 2, col: 2, name: "남동", position: { top: "83.33%", left: "83.33%" } }
  ];

  // 격자 클릭 핸들러 (수동 모드용)
  const handleGridClick = (gridIndex) => {
    if (selectedMode === '수동') {
      setManualTargetGrid(gridIndex);
    }
  };

  // 쿨링포그 위치 계산 함수 수정 - 모드별 동작
  const getDevicePositionByMode = () => {
    switch (selectedMode) {
      case '자동':
        // 인체가 감지될 때만 추적, 감지되지 않으면 중앙 위치
        if (humanDetected) {
          return getDevicePosition(direction, distance);
        } else {
          return { bottom: '50%', left: '50%', transform: 'translate(-50%, 50%)' };
        }
        
      case '수동':
        // 클릭한 격자의 정확한 위치로 이동
        if (manualTargetGrid !== null) {
          const targetGrid = GRID_POSITIONS[manualTargetGrid];
          return {
            bottom: `${100 - parseFloat(targetGrid.position.top)}%`,
            left: targetGrid.position.left,
            transform: 'translate(-50%, 50%)'
          };
        }
        return { bottom: '50%', left: '50%', transform: 'translate(-50%, 50%)' };
        
      case '끄기':
        // 순찰 모드 - 정확한 격자 위치로 이동
        const currentGrid = GRID_POSITIONS[patrolCurrentGrid];
        return {
          bottom: `${100 - parseFloat(currentGrid.position.top)}%`,
          left: currentGrid.position.left,
          transform: 'translate(-50%, 50%)'
        };
        
      default:
        return { bottom: '50%', left: '50%', transform: 'translate(-50%, 50%)' };
    }
  };

  // 추적 대상 표시 여부 함수
  const shouldShowTarget = () => {
    return selectedMode !== '끄기' && humanDetected;
  };

  // 격자 오버레이 표시 여부 함수
  const shouldShowGridOverlay = () => {
    return selectedMode === '수동';
  };

  // 구역별 온도 생성 함수 (실제로는 센서에서 측정)
  const generateGridTemperature = (gridIndex) => {
    // 각 구역마다 약간씩 다른 온도 범위 설정
    const baseTemp = 26; // 기본 온도
    const variation = Math.random() * 6 - 3; // -3도 ~ +3도 변화
    const gridVariation = (gridIndex % 3) * 0.5; // 구역별 미세한 차이
    return Math.round((baseTemp + variation + gridVariation) * 10) / 10;
  };

  // 순찰 모드 온도 측정 useEffect 수정
  useEffect(() => {
    let patrolInterval;
    
    if (selectedMode === '끄기') {
      setIsPatrolling(true);
      patrolInterval = setInterval(() => {
        // 현재 구역 온도 측정
        const currentTemp = generateGridTemperature(patrolCurrentGrid);
        
        // 구역별 온도 업데이트
        setGridTemperatures(prev => ({
          ...prev,
          [patrolCurrentGrid]: currentTemp
        }));
        
        // 다음 구역으로 이동
        setPatrolCurrentGrid(prev => (prev + 1) % 9);
      }, 3000); // 3초마다 측정 후 이동
    } else {
      setIsPatrolling(false);
    }
    
    return () => {
      if (patrolInterval) {
        clearInterval(patrolInterval);
      }
    };
  }, [selectedMode, patrolCurrentGrid]);


  // 구역별 온도 표시 컴포넌트
  const GridTemperatureOverlay = () => {
    if (selectedMode !== '끄기') return null;
    
    return (
      <div className="temperature-overlay">
        {GRID_POSITIONS.map((grid, index) => {
          const temp = gridTemperatures[index];
          const isCurrentGrid = patrolCurrentGrid === index;
          
          return (
            <div
              key={index}
              className={`temp-display ${isCurrentGrid ? 'measuring' : ''}`}
              style={{
                position: 'absolute',
                top: `${(grid.row * 33.33) + 5}%`, // 격자 상단 여백
                left: `${(grid.col * 33.33) + 5}%`, // 격자 좌측 여백
                width: '23.33%', // 여백을 고려한 크기
                height: '23.33%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: temp ? getTempColor(temp) : 'rgba(200, 200, 200, 0.3)',
                border: isCurrentGrid ? '3px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="grid-name">{grid.name}</div>
              {temp ? (
                <div className="temp-value">{temp}°C</div>
              ) : (
                <div className="temp-placeholder">측정중...</div>
              )}
              
            </div>
          );
        })}
      </div>
    );
  };

  // 온도에 따른 색상 결정 함수
  const getTempColor = (temperature) => {
    if (temperature < 24) return 'rgba(59, 130, 246, 0.8)'; // 파란색 (시원)
    if (temperature < 27) return 'rgba(34, 197, 94, 0.8)'; // 초록색 (적정)
    if (temperature < 30) return 'rgba(251, 191, 36, 0.8)'; // 노란색 (따뜻)
    if (temperature < 33) return 'rgba(239, 68, 68, 0.8)'; // 빨간색 (더움)
    return 'rgba(153, 27, 27, 0.8)'; // 진한 빨간색 (매우 더움)
  };

  // 전체 구역 온도 통계 컴포넌트
  const TemperatureStats = () => {
    if (selectedMode !== '끄기' || Object.keys(gridTemperatures).length === 0) return null;
    
    const temps = Object.values(gridTemperatures);
    const avgTemp = Math.round((temps.reduce((sum, temp) => sum + temp, 0) / temps.length) * 10) / 10;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const measuredGrids = Object.keys(gridTemperatures).length;
    
    return (
      <div className="temperature-stats">
        <h4>온도 측정 현황</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">측정 완료</span>
            <span className="stat-value">{measuredGrids}/9 구역</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">평균 온도</span>
            <span className="stat-value">{avgTemp}°C</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">최저 온도</span>
            <span className="stat-value">{minTemp}°C</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">최고 온도</span>
            <span className="stat-value">{maxTemp}°C</span>
          </div>
        </div>
        <div className="temp-legend">
          <div className="legend-item">
            <div className="temp-color" style={{background: 'rgba(59, 130, 246, 0.8)'}}></div>
            <span>시원 (&lt;24°C)</span>
          </div>
          <div className="legend-item">
            <div className="temp-color" style={{background: 'rgba(34, 197, 94, 0.8)'}}></div>
            <span>적정 (24-27°C)</span>
          </div>
          <div className="legend-item">
            <div className="temp-color" style={{background: 'rgba(251, 191, 36, 0.8)'}}></div>
            <span>따뜻 (27-30°C)</span>
          </div>
          <div className="legend-item">
            <div className="temp-color" style={{background: 'rgba(239, 68, 68, 0.8)'}}></div>
            <span>더움 (30°C+)</span>
          </div>
        </div>
      </div>
    );
  };

  // 격자 오버레이 컴포넌트
  const GridOverlay = () => {
    if (!shouldShowGridOverlay()) return null;
    
    return (
      <div className="grid-overlay">
        {GRID_POSITIONS.map((grid, index) => (
          <div
            key={index}
            className={`grid-cell ${manualTargetGrid === index ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              top: `${(grid.row * 33.33)}%`,
              left: `${(grid.col * 33.33)}%`,
              width: '33.33%',
              height: '33.33%',
              border: '2px dashed #3b82f6',
              cursor: 'pointer',
              backgroundColor: manualTargetGrid === index ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              color: '#3b82f6',
              fontWeight: 'bold',
              boxSizing: 'border-box'
            }}
            onClick={() => handleGridClick(index)}
          >
            <div style={{ textAlign: 'center' }}>
              {grid.name}
            
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 방향에 따른 추적대상 위치 계산 함수 수정 - 경계 제한 추가
  const getTargetPosition = (direction, distance) => {
    const maxDistance = 1.5; // 1.0m → 1.5m로 변경
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const gridSize = 70; // 15%부터 85%까지가 실제 1m 범위
    const actualMovement = normalizedDistance * (gridSize / 2); // 최대 35% 이동
    
    const positions = {
      '북쪽': { 
        top: `${Math.max(15, 50 - actualMovement)}%`,
        left: '50%' 
      },
      '남쪽': { 
        top: `${Math.min(85, 50 + actualMovement)}%`,
        left: '50%' 
      },
      '동쪽': { 
        top: '50%', 
        left: `${Math.min(85, 50 + actualMovement)}%`
      },
      '서쪽': { 
        top: '50%', 
        left: `${Math.max(15, 50 - actualMovement)}%`
      },
      '북동쪽': { 
        top: `${Math.max(15, 50 - actualMovement * 0.707)}%`,  // cos(45°) ≈ 0.707
        left: `${Math.min(85, 50 + actualMovement * 0.707)}%` 
      },
      '북서쪽': { 
        top: `${Math.max(15, 50 - actualMovement * 0.707)}%`, 
        left: `${Math.max(15, 50 - actualMovement * 0.707)}%` 
      },
      '남동쪽': { 
        top: `${Math.min(85, 50 + actualMovement * 0.707)}%`, 
        left: `${Math.min(85, 50 + actualMovement * 0.707)}%` 
      },
      '남서쪽': { 
        top: `${Math.min(85, 50 + actualMovement * 0.707)}%`, 
        left: `${Math.max(15, 50 - actualMovement * 0.707)}%` 
      },
      '중앙': {
        top: '50%',
        left: '50%'
      }
    };
    
    return positions[direction] || { top: '50%', left: '50%' };
  };

  // 쿨링포그 장치 위치 계산 함수 수정 - 경계 제한 추가
  const getDevicePosition = (direction, distance) => {
    const safeDistance = 0.3; // 안전거리 30cm
    const followDistance = Math.max(distance - safeDistance, 0);
    const maxDistance = 1.5; // 1.0m → 1.5m로 변경
    const normalizedDistance = Math.min(followDistance / maxDistance, 1);
    // 쿨링포그는 추적대상보다 안전거리만큼 뒤에 위치
    const gridSize = 70;
    const actualMovement = normalizedDistance * (gridSize / 2);
    
    const positions = {
      '북쪽': { 
        bottom: `${Math.max(15, 50 - actualMovement * 0.8)}%`, // 추적대상보다 뒤에
        left: '50%' 
      },
      '남쪽': { 
        bottom: `${Math.min(85, 50 + actualMovement * 0.8)}%`,
        left: '50%' 
      },
      '동쪽': { 
        bottom: '50%', 
        left: `${Math.max(15, 50 - actualMovement * 0.8)}%` // 추적대상 반대편
      },
      '서쪽': { 
        bottom: '50%', 
        left: `${Math.min(85, 50 + actualMovement * 0.8)}%`
      },
      '북동쪽': { 
        bottom: `${Math.max(15, 50 - actualMovement * 0.6)}%`, 
        left: `${Math.max(15, 50 - actualMovement * 0.6)}%` 
      },
      '북서쪽': { 
        bottom: `${Math.max(15, 50 - actualMovement * 0.6)}%`, 
        left: `${Math.min(85, 50 + actualMovement * 0.6)}%` 
      },
      '남동쪽': { 
        bottom: `${Math.min(85, 50 + actualMovement * 0.6)}%`, 
        left: `${Math.max(15, 50 - actualMovement * 0.6)}%` 
      },
      '남서쪽': { 
        bottom: `${Math.min(85, 50 + actualMovement * 0.6)}%`, 
        left: `${Math.min(85, 50 + actualMovement * 0.6)}%` 
      },
      '중앙': {
        bottom: '50%',
        left: '50%'
      }
    };
    
    return positions[direction] || { bottom: '50%', left: '50%' };
  };

  // 3. 거리 유효성 검증 함수 추가
  const validateDistance = (distance, direction) => {
    // 방향별 최대 가능 거리 계산
    const maxDistances = {
      '북쪽': 0.5,      // 중심에서 북쪽 격자 끝까지
      '남쪽': 0.5,
      '동쪽': 0.5,
      '서쪽': 0.5,
      '북동쪽': 0.707,  // 대각선 (√2/2 ≈ 0.707)
      '북서쪽': 0.707,
      '남동쪽': 0.707,
      '남서쪽': 0.707,
      '중앙': 0
    };
    
    const maxPossible = maxDistances[direction] || 0.5;
    return Math.min(distance, maxPossible);
  };

  // 4. 거리 표시 정확성 개선 - 추적 정보 섹션
  const getAccurateDistanceDisplay = () => {
    if (!humanDetected || selectedMode === '끄기') {
      return { distance: '---', showProgress: false };
    }
    
    // 거리 유효성 검증
    const validatedDistance = validateDistance(distance, direction);
    
    return {
      distance: validatedDistance,
      showProgress: true,
      progressWidth: Math.min((validatedDistance / 1.5) * 100, 100)
    };
  };

  // 5. 레이더 차트 범례에 거리 스케일 추가
  const RadarDistanceScale = () => {
    return (
      <div className="radar-distance-scale">
        <div className="scale-title">거리 스케일</div>
        <div className="scale-marks">
          <div className="scale-mark">
            <div className="mark-line" style={{width: '23%'}}></div>
            <span>0.5m</span>
          </div>
          <div className="scale-mark">
            <div className="mark-line" style={{width: '47%'}}></div>
            <span>1.0m</span>
          </div>
          <div className="scale-mark">
            <div className="mark-line" style={{width: '70%'}}></div>
            <span>1.5m</span>
          </div>
        </div>
      </div>
    );
  };

  // 6. 거리 정보 표시 개선
  const DistanceInfoCard = () => {
    const distanceInfo = getAccurateDistanceDisplay();
    
    if (!distanceInfo.showProgress) {
      return (
        <div className="tracking-section-box">
          <div className="tracking-item">
            <span>상태</span>
            <span className="no-target-message">추적 대상 없음</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="tracking-section-box">
        <div className="tracking-item">
          <span>거리</span>
          <span className="distance-value">{distanceInfo.distance}m</span>
        </div>
        <div className="progress-container">
          <div 
            className="progress-bar green" 
            style={{ 
              width: `${distanceInfo.progressWidth}%`
            }}
          ></div>
        </div>
        {/* 거리 정확성 표시 */}
        <div className="distance-accuracy">
          <span className="accuracy-label">
            {distanceInfo.distance < 0.3 ? '⚠️ 너무 가까움' : 
            distanceInfo.distance < 0.8 ? '✅ 적정 거리' : 
            '📡 추적 중'}
          </span>
        </div>
      </div>
    );
  };

  


  // 쿨링포그 회전도 인체 감지 상태에 따라 조정
  const getDeviceTransform = () => {
    if (selectedMode === '자동' && humanDetected) {
      return `translate(-50%, 50%) rotate(${getDeviceOrientation(direction)}deg)`;
    } else {
      return 'translate(-50%, 50%)'; // 인체 미감지시 회전 없음
    }
  };

 

  // 쿨링포그 장치의 방향 계산 함수 추가
  const getDeviceOrientation = (direction) => {
    const rotations = {
      '북쪽': 0,
      '북동쪽': 45,
      '동쪽': 90,
      '남동쪽': 135,
      '남쪽': 180,
      '남서쪽': 225,
      '서쪽': 270,
      '북서쪽': 315
    };
    
    return rotations[direction] || 0;
  };

  // 자동 분사 로직 추가 - 인체 감지와 거리에 따른 자동 분사
  const shouldAutoSpray = () => {
    if (selectedMode === '자동' && humanDetected && isRunning) {
      return distance <= 1.5; // 1.5m 이내에 있을 때만 분사
    }
    return false;
  };

  // 추적 정보 섹션에서 거리와 방향은 인체 감지시에만 의미있음
  const getTrackingInfo = () => {
    if (!humanDetected && selectedMode !== '끄기') {
      return {
        distance: '---',
        direction: '---',
        showProgress: false
      };
    }
    return {
      distance: distance,
      direction: direction,
      showProgress: true
    };
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
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('이 스케줄을 삭제하시겠습니까?')) {
      setIsLoading(true);
      setError(null);
      
      try {
        await scheduleAPI.delete(scheduleId);
        await loadSchedules(); // 목록 새로고침
      } catch (err) {
        setError('스케줄 삭제 중 오류가 발생했습니다.');
        console.error('Schedule deletion error:', err);
      } finally {
        setIsLoading(false);
      }
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

  const handleCreateSchedule = async () => {
    if (newSchedule.title && newSchedule.startTime && newSchedule.endTime && newSchedule.selectedDays.length > 0) {
      setIsLoading(true);
      setError(null);
      
      try {
        const scheduleData = {
          title: newSchedule.title,
          start_time: newSchedule.startTime,
          end_time: newSchedule.endTime,
          days_of_week: newSchedule.selectedDays.map(day => {
            const dayMap = {'월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7};
            return dayMap[day];
          }),
          intensity: newSchedule.intensity,
          mode: newSchedule.mode,
          is_active: newSchedule.isEnabled
        };
        
        await scheduleAPI.create(scheduleData);
        await loadSchedules(); // 목록 새로고침
        closeNewScheduleModal();
      } catch (err) {
        setError('스케줄 생성 중 오류가 발생했습니다.');
        console.error('Schedule creation error:', err);
      } finally {
        setIsLoading(false);
      }
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
  const InfoCard = ({ title, value, unit, icon, isSmallText = false }) => (
    <div className="info-card">
      <div className="info-card-header">
        <span className="info-card-title">{title}</span>
        <div className="info-card-icon">
          {icon}
        </div>
      </div>
      <div className="info-card-value">
        <span className={isSmallText ? "value-small" : "value"}>{value}</span>
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
                <span className="status-text">{isConnected ? '실시간 연결' : '연결 끊김'}</span>
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


        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          {['대시보드', '제어', '추적시각화', '스케줄 관리'].map((tab) => (
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
          <div className="tab-content">
            {/* 상단 상태 카드들 */}
            <div className="status-grid-horizontal">
              <StatusCard 
                title="온도" 
                value={temperature}  // "28.5" → {temperature}로 변경
                unit="°C" 
                icon={<img src="/assets/icons/temperature.svg" alt="temperature" className="card-icon" />}
              />
              <StatusCard 
                title="습도" 
                value={humidity}     // "65" → {humidity}로 변경
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
                progressColor="purple"
              />
              <StatusCard 
                title="물탱크" 
                value={waterTank} 
                unit="%" 
                icon={<img src="/assets/icons/water-tank-icon.svg" alt="water-tank" className="card-icon" />}
                showProgress={true}
                progressColor="blue"
              />
            </div>

            {/* 하단 정보 카드들 */}
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
                icon={<img src={getHumanDetectionIcon()} alt="human-detection" className="card-icon" />}
                isSmallText={true}  // 작은 텍스트 크기 적용
              />
              <InfoCard 
                title="거리 방향" 
                value={distance} 
                unit={`m ${direction}`} 
                icon={<img src="/assets/icons/street-direction-icon.svg" alt="street-direction" className="card-icon" />}
              />
              <InfoCard 
                title="안전 상태" 
                value={getSafetyStatus()}  // 기존 "안전" → getSafetyStatus()로 변경
                unit="" 
                icon={<img src={getSafetyIcon()} alt="safety" className="card-icon" />}
              />
            </div>
          </div>
        )}

        {activeTab === '제어' && (
          <div className="tab-content">
            {/* 에러 메시지 표시 */}
            {error && (
              <div className="error-message">
                {error}
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}

            {/* 수동 제어 경고 표시 */}
            <ManualControlWarning />
            
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
                    onClick={handleDeviceToggle}
                    disabled={isLoading}
                    className={`control-button ${isRunning ? 'pause-button' : 'start-button'} ${isLoading ? 'loading' : ''}`}
                  >
                    {isLoading ? (
                      <span>처리중...</span>
                    ) : (
                      <>
                        {isRunning ? 
                          <img src="/assets/icons/pause.svg" alt="pause" className="button-icon" /> : 
                          <img src="/assets/icons/start.svg" alt="start" className="button-icon" />
                        }
                        <span>{isRunning ? '일시정지' : '시작'}</span>
                      </>
                    )}
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
                        onChange={(e) => handleSprayIntensityChange(e.target.value)}
                        disabled={isLoading}
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
                    onClick={handleEmergencyStop}
                    disabled={isLoading}
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
                          onClick={() => handleTrackingModeChange(mode)}
                          disabled={isLoading}
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
                      안전거리: 1.5m 이상 유지
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* 스케줄 자동화 상태 */}
            <ScheduleStatus />
          </div>
        )}

                
        
        {activeTab === '추적시각화' && (
          <div className="tab-content">
            {/* 현재 모드 상태 표시 */}
            <div className="mode-status-bar">
              <span className="mode-status-label">현재 모드: </span>
              <span className={`mode-status-value ${selectedMode}`}>
                {selectedMode}
                {selectedMode === '수동' && manualTargetGrid !== null && 
                  ` (${GRID_POSITIONS[manualTargetGrid].name}구역 목표)`
                }
                {selectedMode === '끄기' && 
                  ` (${GRID_POSITIONS[patrolCurrentGrid].name}구역 측정중)`
                }
              </span>
            </div>

            {/* 레이더뷰 섹션 */}
            <div className="visualization-section">
              <h3>
                <img src="/assets/icons/tracking-visualization.svg" alt="tracking-visualization" className="section-icon" />
                {selectedMode === '끄기' ? '구역별 온도 측정' : '레이더뷰'}
              </h3>
              <div className="radar-container-center">
                <div className="radar-chart">
                  <div className="radar-grid">
                    <div className="grid-line vertical-1"></div>
                    <div className="grid-line vertical-2"></div>
                    <div className="grid-line horizontal-1"></div>
                    <div className="grid-line horizontal-2"></div>
                    
                    {/* 격자 오버레이 (수동 모드에서만 표시) */}
                    <GridOverlay />
                    
                    {/* 온도 오버레이 (순찰 모드에서만 표시) */}
                    <GridTemperatureOverlay />
                    
                    {/* 쿨링포그 장치 - 모드별 위치 */}
                    <div 
                      className="radar-device"
                      style={{
                        position: 'absolute',
                        width: '1.2rem',
                        height: '1.2rem',
                        background: '#5259c4',
                        borderRadius: '0.3rem',
                        zIndex: 10,
                        border: '3px solid white',
                        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.8s ease',
                        ...getDevicePositionByMode(),
                        transform: getDeviceTransform()
                      }}
                    >
                      {/* 자동 분사 중일 때 시각적 표시 */}
                      {shouldAutoSpray() && (
                        <div className="auto-spray-indicator">💨</div>
                      )}
                    </div>
                    
                    {/* 추적대상 - 끄기 모드에서는 숨김 */}
                    {shouldShowTarget() && (
                      <div 
                        className="radar-target"
                        style={{
                          ...getTargetPosition(direction, distance),
                          transform: 'translate(-50%, -50%)',
                          transition: 'all 0.5s ease',
                          opacity: humanDetected ? 1 : 0 // 인체 미감지시 투명하게
                        }}
                      ></div>
                    )}
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
                    <div className="legend-dot device"></div>
                    <span>쿨링포그 장치</span>
                  </div>
                  {shouldShowTarget() && (
                    <div className="legend-item">
                      <div className="legend-dot green"></div>
                      <span>추적대상</span>
                    </div>
                  )}
                  {selectedMode === '수동' && (
                    <div className="legend-item">
                      <div className="legend-dot blue"></div>
                      <span>클릭 가능 구역</span>
                    </div>
                  )}
                  {selectedMode === '끄기' && (
                    <div className="legend-item">
                      <div className="legend-dot orange"></div>
                      <span>측정 구역</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

  

            {/* 추적 정보 섹션 */}
            <div className="tracking-info-section">
              <h3>
                <img src="/assets/icons/tracking-visualization.svg" alt="tracking-visualization" className="section-icon" />
                {selectedMode === '끄기' ? '순찰 정보' : '추적 정보'}
              </h3>
              <div className="tracking-sections-grid">
                
                {/* 현재 측정 온도 (순찰 모드에서만) */}
                {selectedMode === '끄기' && (
                  <div className="tracking-section-box">
                    <div className="tracking-item">
                      <span>현재 구역 온도</span>
                      <span className="temperature-value">
                        {gridTemperatures[patrolCurrentGrid] 
                          ? `${gridTemperatures[patrolCurrentGrid]}°C` 
                          : '측정중...'
                        }
                      </span>
                    </div>
                  </div>
                )}
                
                {/* 인체 감지 섹션 - 끄기 모드에서는 표시 안함 */}
                {selectedMode !== '끄기' && (
                  <div className="tracking-section-box">
                    <div className="tracking-item">
                      <span>인체 감지</span>
                      <div className="tracking-value">
                        <span className="person-icon">👤</span>
                        <span className={getHumanDetectionStyle()}>{getHumanDetectionStatus()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 거리 섹션 - 끄기 모드에서는 숨김 */}
                {selectedMode !== '끄기' && humanDetected &&(
                  <div className="tracking-section-box">
                    <div className="tracking-item">
                      <span>거리</span>
                      <span className="distance-value">{distance}m</span>
                    </div>
                    <div className="progress-container">
                      <div 
                        className="progress-bar green" 
                        style={{ 
                          width: `${Math.min((distance / 1.5) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* 인체 미감지시 대체 표시 */}
                {selectedMode !== '끄기' && !humanDetected && (
                  <div className="tracking-section-box">
                    <div className="tracking-item">
                      <span>상태</span>
                      <span className="no-target-message">추적 대상 없음</span>
                    </div>
                  </div>
                )}
                
                {/* 방향 섹션 - 조건별 표시 */}
                <div className="tracking-section-box">
                  <div className="tracking-item">
                    <span>
                      {selectedMode === '끄기' ? '순찰 위치' : 
                      humanDetected ? '방향' : '장치 위치'}
                    </span>
                    <span className="direction-value">
                      {selectedMode === '끄기' 
                        ? GRID_POSITIONS[patrolCurrentGrid].name 
                        : humanDetected 
                          ? direction 
                          : '중앙 대기'
                      }
                    </span>
                  </div>
                </div>
                
                {/* 분사상태 섹션 - 인체 감지 상태 반영 */}
                <div className="tracking-section-box">
                  <div className="tracking-item">
                    <span>분사상태</span>
                    <div className="tracking-value">
                      <div className={`status-dot ${
                        isRunning && (selectedMode !== '자동' || humanDetected) ? 'active' : 'inactive'
                      }`}></div>
                      <span className={getSprayStatusStyle()}>
                        {isRunning 
                          ? (selectedMode === '자동' && !humanDetected ? '대기' : '동작')
                          : '정지'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
              </div>
              <TemperatureStats />
            </div>
          </div>
        )}

        {activeTab === '스케줄 관리' && (
          <div className="tab-content">
            {/* 스케줄 자동화 상태 */}
            <ScheduleStatus />
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
          </div>
        )}



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