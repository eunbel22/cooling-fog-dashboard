import { useState, useEffect, useCallback, useRef } from 'react';
import { GRID_POSITIONS, generateGridTemperature, generateGridHumidity } from '../utils/gridUtils';

export const useVisualization = (selectedMode, humanDetected, isRunning, sendMessage) => {
  const [manualTargetGrid, setManualTargetGrid] = useState(null);
  const [currentGridIndex, setCurrentGridIndex] = useState(20); // ✅ E1 시작 (0-based)
  const [gridTemperatures, setGridTemperatures] = useState({});
  const [gridHumidities, setGridHumidities] = useState({});
  const [isSpraying, setIsSpraying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const humanDetectedRef = useRef(humanDetected);
  const isSprayingRef = useRef(false);
  const selectedModeRef = useRef(selectedMode);
  const isRunningRef = useRef(isRunning);
  const previousIsRunningRef = useRef(isRunning);

  useEffect(() => { humanDetectedRef.current = humanDetected; }, [humanDetected]);
  useEffect(() => { isSprayingRef.current = isSpraying; }, [isSpraying]);
  useEffect(() => { selectedModeRef.current = selectedMode; }, [selectedMode]);
  useEffect(() => {
    previousIsRunningRef.current = isRunningRef.current;
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const wasRunning = previousIsRunningRef.current;
    const isCurrentlyRunning = isRunning;
    if (wasRunning && !isCurrentlyRunning) {
      setIsSpraying(false);
      console.log('🛑 [긴급정지] 사용자가 정지 버튼을 눌렀습니다');
    } else if (!wasRunning && isCurrentlyRunning) {
      console.log('▶️ [시작] 사용자가 시작 버튼을 눌렀습니다');
    }
  }, [isRunning]);

  // ✅ WebSocket에서 그리드 위치 업데이트
  const updateCurrentGrid = useCallback((gridIndex) => {
    console.log(`📍 [위치 업데이트] 그리드 인덱스: ${gridIndex}`);
    setCurrentGridIndex(gridIndex);
  }, []);

  const updateGridData = useCallback((gridIndex, temperature, humidity, detected = false) => {
      // ✅ 수동 모드에서는 detected 여부와 관계없이 온도 표시
      if (selectedModeRef.current === '자동' && !detected) {
        console.log(`🚫 [자동모드] 감지되지 않은 구역 ${gridIndex}, 온도 표시 스킵`);
        return;
      }

      console.log(`🗺️ [${selectedModeRef.current}] 구역 ${gridIndex}: ${temperature}°C, ${humidity}%`);
      setGridTemperatures(prev => ({
        ...prev,
        [gridIndex]: typeof temperature === 'number' ? temperature : prev[gridIndex] ?? null
      }));

      setGridHumidities(prev => ({
        ...prev,
        [gridIndex]: typeof humidity === 'number' ? humidity : prev[gridIndex] ?? null
      }));
  }, []);

  // ✅ 온도 측정 함수
  const measureTemperature = (gridIndex, previousTemp = null) => {
    if (selectedModeRef.current === '수동') {
      const currentTemp = gridTemperatures[gridIndex];
      if (typeof currentTemp === 'number') {
        console.log(`🌡️ [수동모드] 그리드 ${gridIndex} 실측값 사용: ${currentTemp}°C`);
        return currentTemp;
      } else {
        console.log(`🌡️ [수동모드] 그리드 ${gridIndex} 실측 대기 중 (데이터 없음)`);
        setGridTemperatures(prev => ({ ...prev }));
        return null;
      }
    }

    let temp;
    if (previousTemp !== null && typeof previousTemp === 'number') {
      const coolingEffect = Math.random() * 2 + 1;
      temp = Math.round((previousTemp - coolingEffect) * 10) / 10;
    } else {
      temp = generateGridTemperature(gridIndex);
    }

    setGridTemperatures(prev => ({ ...prev, [gridIndex]: temp }));
    return temp;
  };

  // ✅ 습도 측정 함수
  const measureHumidity = (gridIndex) => {
    if (selectedModeRef.current === '수동') {
      const currentHum = gridHumidities[gridIndex];
      if (typeof currentHum === 'number') {
        console.log(`💧 [수동모드] 그리드 ${gridIndex} 실측값 사용: ${currentHum}%`);
        return currentHum;
      } else {
        console.log(`💧 [수동모드] 그리드 ${gridIndex} 실측 대기 중 (데이터 없음)`);
        setGridHumidities(prev => ({ ...prev }));
        return null;
      }
    }

    const humidity = generateGridHumidity(gridIndex);
    setGridHumidities(prev => ({ ...prev, [gridIndex]: humidity }));
    return humidity;
  };

  // ✅ 자동 모드: 분사 실행
  const executeAutoSpray = (gridIndex, currentTemp) => {
    if (!isRunningRef.current) return;
    setIsSpraying(true);
    console.log(`💨 [구역 ${gridIndex}] 분사 시작 (현재 온도: ${currentTemp}°C)`);

    setTimeout(() => {
      if (!isRunningRef.current) {
        setIsSpraying(false);
        return;
      }

      const stillHumanDetected = humanDetectedRef.current;
      if (stillHumanDetected) {
        const newTemp = measureTemperature(gridIndex, currentTemp);
        measureHumidity(gridIndex);
        setIsSpraying(false);

        if (newTemp >= 22) executeAutoSpray(gridIndex, newTemp);
        else setIsSpraying(false);
      } else {
        setIsSpraying(false);
      }
    }, 10000);
  };

  const handleGridClick = useCallback((gridIndex) => {
    console.log(`🖱️ [클릭] 구역 ${gridIndex}, 모드: ${selectedModeRef.current}`);

    if (selectedModeRef.current === '수동' && !isSprayingRef.current && isRunningRef.current) {
      setManualTargetGrid(gridIndex);

      // ✅ 라즈베리로 명령만 전송 (분사 상태는 라즈베리파이에서 전송받음)
      console.log(`📤 [명령 전송] move_to_grid: ${gridIndex}`);
      // 1) 먼저 STOP 보내기
      sendMessage({
        type: "control",
        command: "motor_control",
        value: "stop"
      });

      // 200ms 정도 대기 후 MOVE 실행
      setTimeout(() => {
        sendMessage({
          type: "control",
          command: "move_to_grid",
          value: gridIndex
        });
      }, 200);


      // ❌ 제거: 웹에서 임의로 분사 표시하지 않음
      // 분사 상태는 spray_status 이벤트로 수신
    }
  }, [sendMessage]);

  // ✅ 디바이스 위치 계산 (WebSocket 기반)
  const getDevicePositionByMode = useCallback(() => {
    const currentGrid = GRID_POSITIONS[currentGridIndex];
    return {
      bottom: `${100 - parseFloat(currentGrid.position.top)}%`,
      left: currentGrid.position.left,
      transform: 'translate(-50%, 50%)'
    };
  }, [currentGridIndex]);

  const shouldShowTarget = useCallback(() => false, []);
  const shouldShowGridOverlay = useCallback(() => selectedMode === '수동', [selectedMode]);

  // ✅ WebSocket 이벤트 수신 (전역 이벤트 기반)
  useEffect(() => {
    const handleSensor = (e) => {
      const { grid, temperature, humidity, detected } = e.detail;
      updateGridData(grid - 1, temperature, humidity, detected);
    };

    const handlePosition = (e) => {
      const { current_grid } = e.detail;
      updateCurrentGrid(current_grid);
    };

    const handleDetection = (e) => {
      const { livestock_detected } = e.detail;
      humanDetectedRef.current = livestock_detected;
      console.log(`🐷 [가축 감지 이벤트 수신] ${livestock_detected}`);
    };

    // ✅ 분사 상태 수신 (라즈베리파이에서 전송)
    const handleSpray = (e) => {
      const { spraying, grid } = e.detail;
      setIsSpraying(spraying);
      console.log(`💨 [분사 상태 수신] ${spraying ? '시작' : '완료'} - 그리드 ${grid}`);
    };

    // ✅ WebSocket에서 전달된 전역 이벤트 구독
    window.addEventListener("sensorData", handleSensor);
    window.addEventListener("positionData", handlePosition);
    window.addEventListener("detectionData", handleDetection);
    window.addEventListener("sprayStatus", handleSpray);

    return () => {
      window.removeEventListener("sensorData", handleSensor);
      window.removeEventListener("positionData", handlePosition);
      window.removeEventListener("detectionData", handleDetection);
      window.removeEventListener("sprayStatus", handleSpray);
    };
  }, [updateGridData, updateCurrentGrid]);

  // ✅ 자동 모드 로직 (WebSocket 기반)
  useEffect(() => {
    if (!isRunning || isSpraying || selectedMode !== '자동') return;

    console.log(`🔍 구역 ${currentGridIndex} 도착`);

    const measureTimer = setTimeout(() => {
      if (!isRunningRef.current) return;

      if (humanDetectedRef.current) {
        const temp = measureTemperature(currentGridIndex, false);
        measureHumidity(currentGridIndex);
        if (temp >= 22) executeAutoSpray(currentGridIndex, temp);
      }
    }, 2000);

    return () => clearTimeout(measureTimer);
  }, [currentGridIndex, isSpraying, isRunning, selectedMode]);

  return {
    manualTargetGrid,
    patrolCurrentGrid: currentGridIndex,
    gridTemperatures,
    gridHumidities,
    GRID_POSITIONS,
    isSpraying,
    handleGridClick,
    getDevicePositionByMode,
    shouldShowTarget,
    shouldShowGridOverlay,
    updateGridData,
    updateCurrentGrid
  };
};