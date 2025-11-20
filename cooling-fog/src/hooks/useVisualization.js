import { useState, useEffect, useCallback, useRef } from 'react';
import { GRID_POSITIONS, PATROL_SEQUENCE, generateGridTemperature, generateGridHumidity } from '../utils/gridUtils';

export const useVisualization = (selectedMode, humanDetected, isRunning) => {
  const [manualTargetGrid, setManualTargetGrid] = useState(null);
  const [patrolSequenceIndex, setPatrolSequenceIndex] = useState(0);
  const [gridTemperatures, setGridTemperatures] = useState({});
  const [gridHumidities, setGridHumidities] = useState({});
  const [isSpraying, setIsSpraying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 최신 상태를 유지하기 위한 ref
  const humanDetectedRef = useRef(humanDetected);
  const isSprayingRef = useRef(false);
  const selectedModeRef = useRef(selectedMode);
  const isRunningRef = useRef(isRunning);
  const previousIsRunningRef = useRef(isRunning);

  // ref 업데이트
  useEffect(() => { humanDetectedRef.current = humanDetected; }, [humanDetected]);
  useEffect(() => { isSprayingRef.current = isSpraying; }, [isSpraying]);
  useEffect(() => { selectedModeRef.current = selectedMode; }, [selectedMode]);
  useEffect(() => {
    previousIsRunningRef.current = isRunningRef.current;
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // 긴급정지 처리
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

  const patrolCurrentGrid = PATROL_SEQUENCE[patrolSequenceIndex];

  // ✅ WebSocket에서 들어온 실측 데이터 반영
  const updateGridData = useCallback((gridIndex, temperature, humidity) => {
    console.log(`🗺️ [실측 업데이트] 그리드 ${gridIndex}: ${temperature}°C, ${humidity}%`);

    setGridTemperatures(prev => ({
      ...prev,
      [gridIndex]: typeof temperature === 'number' ? temperature : prev[gridIndex] ?? 0
    }));

    setGridHumidities(prev => ({
      ...prev,
      [gridIndex]: typeof humidity === 'number' ? humidity : prev[gridIndex] ?? 0
    }));
  }, []);

  // ✅ 온도 측정 함수
  const measureTemperature = (gridIndex, previousTemp = null) => {
    // 실측 센서가 활성화되어 있을 때는 랜덤 금지
    if (selectedModeRef.current === '수동') {
      const currentTemp = gridTemperatures[gridIndex];
      if (typeof currentTemp === 'number') {
        console.log(`🌡️ [수동모드] 그리드 ${gridIndex} 실측값 사용: ${currentTemp}°C`);
        return currentTemp;
      } else {
        console.log(`🌡️ [수동모드] 그리드 ${gridIndex} 실측 대기 중 (데이터 없음)`);
        // 상태 유지하며 리렌더 유도
        setGridTemperatures(prev => ({ ...prev }));
        return null;
      }
    }

    // 자동 모드일 때만 랜덤 시뮬레이션
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

    // 자동 모드용 랜덤 시뮬레이션
    const humidity = generateGridHumidity(gridIndex);
    setGridHumidities(prev => ({ ...prev, [gridIndex]: humidity }));
    return humidity;
  };

  // 다음 구역으로 이동
  const moveToNextGrid = () => {
    setPatrolSequenceIndex(prev => (prev + 1) % PATROL_SEQUENCE.length);
    setIsSpraying(false);
    setManualTargetGrid(null);
  };

  // 특정 구역으로 직접 이동 (수동 모드용) - 더 이상 사용 안 함
  const moveToSpecificGrid = (targetGridIndex) => {
    const sequenceIndex = PATROL_SEQUENCE.indexOf(targetGridIndex);
    if (sequenceIndex !== -1) {
      setPatrolSequenceIndex(sequenceIndex);
      console.log(`🎯 [구역 ${targetGridIndex}] 즉시 이동`);
    }
  };

  // 자동 모드(추적): 분사 실행
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
        else moveToNextGrid();
      } else {
        setIsSpraying(false);
        moveToNextGrid();
      }
    }, 10000);
  };

  // ⭐ 수동 모드: 클릭 시 해당 구역만 분사 (수정됨!)
  const handleManualSpray = async (gridIndex) => {
    console.log(`🖱️ [클릭] 구역 ${gridIndex}, 모드: ${selectedModeRef.current}`);

    if (selectedModeRef.current === '수동' && !isSprayingRef.current && isRunningRef.current) {
      setManualTargetGrid(gridIndex);
      
      // ✅ 백엔드에 API 역쿼리: 그리드 이동 명령
      // 🔧 수정: 동적 URL 사용 (현재 도메인 기반)
      try {
        const gridNumber = gridIndex + 1; // 0-based를 1-based로 변환
        
        // 현재 도메인 동적으로 가져오기
        const apiUrl = `${window.location.origin}/api/control/grid`;
        
        console.log(`📤 API 호출: POST ${apiUrl}`, { grid: gridNumber });
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grid: gridNumber })
        });
        
        if (!response.ok) {
          console.error(`⚠️ 그리드 이동 API 오류: ${response.status}`);
          console.error(`⚠️ 응답 텍스트:`, await response.text());
          return;
        }
        
        const result = await response.json();
        console.log(`📡 [API 응답] 그리드 ${gridNumber}로 이동 명령 전송 성공`, result);
        
      } catch (error) {
        console.error('⚠️ 그리드 이동 API 호출 실패:', error);
        console.error('⚠️ 에러 상세:', error.message);
      }

      setTimeout(() => {
        if (!isRunningRef.current) return;

        const temp = measureTemperature(gridIndex);
        measureHumidity(gridIndex);

        if (temp !== null) {
          console.log(`💧 [구역 ${gridIndex}] 실측 분사 실행`);
          setIsSpraying(true);
          setTimeout(() => {
            setIsSpraying(false);
            moveToNextGrid();
          }, 10000);
        }
      }, 2000);
    }
  };

  const handleGridClick = useCallback((gridIndex) => {
    handleManualSpray(gridIndex);
  }, [patrolCurrentGrid, gridTemperatures]);

  // 디바이스 위치 계산
  const getDevicePositionByMode = useCallback(() => {
    const currentGrid = GRID_POSITIONS[patrolCurrentGrid];
    return {
      bottom: `${100 - parseFloat(currentGrid.position.top)}%`,
      left: currentGrid.position.left,
      transform: 'translate(-50%, 50%)'
    };
  }, [patrolCurrentGrid]);

  const shouldShowTarget = useCallback(() => false, []);
  const shouldShowGridOverlay = useCallback(() => selectedMode === '수동', [selectedMode]);

  // 순찰 로직 (자동 or 수동)
  useEffect(() => {
    if (!isRunning || isSpraying) return;

    if (!isInitialized && patrolSequenceIndex === 0) {
      setIsInitialized(true);
    }

    const currentGrid = PATROL_SEQUENCE[patrolSequenceIndex];
    console.log(`🚀 구역 ${patrolSequenceIndex} (그리드 ${currentGrid}) 도착`);

    const measureTimer = setTimeout(() => {
      if (!isRunningRef.current) return;

      if (selectedModeRef.current === '자동') {
        if (humanDetectedRef.current) {
          const temp = measureTemperature(currentGrid, false);
          measureHumidity(currentGrid);
          if (temp >= 22) executeAutoSpray(currentGrid, temp);
          else moveToNextGrid();
        } else moveToNextGrid();
      } else {
        measureTemperature(currentGrid, false);
        measureHumidity(currentGrid);
        console.log(`⏸️ [수동모드] 구역 ${currentGrid} 측정 완료, 클릭 대기`);
        setTimeout(() => {
          if (!isSprayingRef.current && isRunningRef.current) moveToNextGrid();
        }, 2000);
      }
    }, 2000);

    return () => clearTimeout(measureTimer);
  }, [patrolSequenceIndex, isSpraying, isInitialized, isRunning]);

  return {
    manualTargetGrid,
    patrolCurrentGrid,
    gridTemperatures,
    gridHumidities,
    GRID_POSITIONS,
    isSpraying,
    handleGridClick,
    getDevicePositionByMode,
    shouldShowTarget,
    shouldShowGridOverlay,
    updateGridData
  };
};