import { useState, useEffect, useCallback, useRef } from 'react';
import { GRID_POSITIONS, PATROL_SEQUENCE, generateGridTemperature, generateGridHumidity } from '../utils/gridUtils';

export const useVisualization = (selectedMode, humanDetected, isRunning) => {
  const [manualTargetGrid, setManualTargetGrid] = useState(null);
  const [patrolSequenceIndex, setPatrolSequenceIndex] = useState(0);
  const [gridTemperatures, setGridTemperatures] = useState({});
  const [gridHumidities, setGridHumidities] = useState({});
  const [isSpraying, setIsSpraying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ref로 최신 값 유지
  const humanDetectedRef = useRef(humanDetected);
  const isSprayingRef = useRef(false);
  const selectedModeRef = useRef(selectedMode);
  const isRunningRef = useRef(isRunning);
  const previousIsRunningRef = useRef(isRunning);

  // ref 업데이트
  useEffect(() => {
    humanDetectedRef.current = humanDetected;
  }, [humanDetected]);

  useEffect(() => {
    isSprayingRef.current = isSpraying;
  }, [isSpraying]);

  useEffect(() => {
    selectedModeRef.current = selectedMode;
  }, [selectedMode]);

  useEffect(() => {
    previousIsRunningRef.current = isRunningRef.current;
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // 긴급정지 처리
  useEffect(() => {
    const wasRunning = previousIsRunningRef.current;
    const isCurrentlyRunning = isRunning;
    
    if (wasRunning === true && isCurrentlyRunning === false) {
      setIsSpraying(false);
      console.log('🛑 [긴급정지] 사용자가 정지 버튼을 눌렀습니다');
    } else if (wasRunning === false && isCurrentlyRunning === true) {
      console.log('▶️ [시작] 사용자가 시작 버튼을 눌렀습니다');
    }
  }, [isRunning]);

  const patrolCurrentGrid = PATROL_SEQUENCE[patrolSequenceIndex];

  // ⭐ 새로운 함수: 외부에서 격자 데이터 업데이트 (실제 센서 값)
  /*const updateGridData = useCallback((gridIndex, temperature, humidity) => {
    console.log(`🗺️ [격자 업데이트] 그리드 ${gridIndex}: ${temperature}°C, ${humidity}%`);
    
    setGridTemperatures(prev => ({
      ...prev,
      [gridIndex]: temperature
    }));
    
    setGridHumidities(prev => ({
      ...prev,
      [gridIndex]: humidity
    }));
  }, []);*/

  const updateGridData = useCallback((gridIndex, temperature, humidity) => {
    console.log(`🗺️ [격자 업데이트] 그리드 ${gridIndex}: ${temperature}°C, ${humidity}%`);

    setGridTemperatures(prev => ({
      ...prev,
      [gridIndex]: typeof temperature === 'number' ? temperature : prev[gridIndex] || 0
    }));

    setGridHumidities(prev => ({
      ...prev,
      [gridIndex]: typeof humidity === 'number' ? humidity : prev[gridIndex] || 0
    }));
  }, []);


  // 온도 측정 함수 (previousTemp: 이전 온도값)
  const measureTemperature = (gridIndex, previousTemp = null) => {
    let temp;
    
    if (previousTemp !== null && typeof previousTemp === 'number') {
      // 분사 후: 이전 온도에서 1~3도 감소
      const coolingEffect = Math.random() * 2 + 1;
      temp = Math.round((previousTemp - coolingEffect) * 10) / 10;
      console.log(`❄️ [구역 ${gridIndex}] 분사 효과: ${previousTemp.toFixed(1)}°C → ${temp.toFixed(1)}°C (-${coolingEffect.toFixed(1)}°C)`);
    } else {
      // 처음 측정: 랜덤 온도 생성
      temp = generateGridTemperature(gridIndex);
      console.log(`🌡️ [구역 ${gridIndex}] 초기 측정: ${temp.toFixed(1)}°C`);
    }
    
    setGridTemperatures(prevTemps => ({
      ...prevTemps,
      [gridIndex]: temp
    }));
    return temp;
  };

  // 습도 측정 함수
  const measureHumidity = (gridIndex) => {
    const humidity = generateGridHumidity(gridIndex);
    console.log(`💧 [구역 ${gridIndex}] 습도 측정: ${humidity}%`);
    
    setGridHumidities(prevHumidities => ({
      ...prevHumidities,
      [gridIndex]: humidity
    }));
    return humidity;
  };

  // 다음 구역으로 이동
  const moveToNextGrid = () => {
    setPatrolSequenceIndex(prev => (prev + 1) % PATROL_SEQUENCE.length);
    setIsSpraying(false);
    setManualTargetGrid(null);
  };

  // 특정 구역으로 직접 이동 (수동 모드용)
  const moveToSpecificGrid = (targetGridIndex) => {
    const sequenceIndex = PATROL_SEQUENCE.indexOf(targetGridIndex);
    if (sequenceIndex !== -1) {
      setPatrolSequenceIndex(sequenceIndex);
      console.log(`🎯 [구역 ${targetGridIndex}] 로 즉시 이동 (시퀀스 인덱스: ${sequenceIndex})`);
    }
  };

  // 자동 모드(추적): 분사 실행 및 재확인
  const executeAutoSpray = (gridIndex, currentTemp) => {
    if (!isRunningRef.current) {
      console.log('⚠️ [분사 취소] 시스템이 정지 상태입니다');
      return;
    }

    setIsSpraying(true);
    console.log(`💨 [구역 ${gridIndex}] 10초 분사 시작 (현재 온도: ${currentTemp}°C)`);
    
    setTimeout(() => {
      if (!isRunningRef.current) {
        setIsSpraying(false);
        console.log('🛑 [분사 중 정지] 분사가 중단되었습니다');
        return;
      }

      const stillHumanDetected = humanDetectedRef.current;
      
      if (stillHumanDetected) {
        const newTemp = measureTemperature(gridIndex, currentTemp);
        measureHumidity(gridIndex);
        setIsSpraying(false);
        
        setTimeout(() => {
          if (!isRunningRef.current) {
            console.log('⚠️ [재분사 취소] 시스템이 정지되었습니다');
            return;
          }

          const shouldContinue = newTemp >= 22;
          
          if (shouldContinue) {
            console.log(`🔄 [구역 ${gridIndex}] 가축 여전히 감지 + 고온 → 계속 분사 (가축: 감지됨, 온도: ${newTemp}°C)`);
            executeAutoSpray(gridIndex, newTemp);
          } else {
            console.log(`❄️ [구역 ${gridIndex}] 가축 감지되지만 저온 → 다음 구역 (가축: 감지됨, 온도: ${newTemp}°C)`);
            moveToNextGrid();
          }
        }, 100);
      } else {
        setIsSpraying(false);
        console.log(`👻 [구역 ${gridIndex}] 가축 미감지 → 다음 구역으로 이동`);
        setTimeout(moveToNextGrid, 100);
      }
    }, 10000);
  };

  // 수동 모드(순찰): 클릭 시 해당 구역으로 이동 후 분사
  const handleManualSpray = (gridIndex) => {
    console.log(`
🖱️ 클릭 이벤트 발생:
  - 클릭한 구역: ${gridIndex}
  - 현재 모드: ${selectedModeRef.current}
  - 현재 순찰 구역: ${patrolCurrentGrid}
  - 분사 중: ${isSprayingRef.current}
  - 동작 중: ${isRunningRef.current}
    `);
    
    if (selectedModeRef.current === '수동' && !isSprayingRef.current && isRunningRef.current) {
      setManualTargetGrid(gridIndex);
      moveToSpecificGrid(gridIndex);
      
      setTimeout(() => {
        if (!isRunningRef.current) {
          console.log('⚠️ [수동 분사 취소] 시스템이 정지되었습니다');
          return;
        }

        const temp = measureTemperature(gridIndex);
        measureHumidity(gridIndex);
        
        console.log(`👆 [구역 ${gridIndex}] 도착 - 10초 분사 시작 (온도: ${temp}°C)`);
        setIsSpraying(true);
        
        setTimeout(() => {
          const newTemp = measureTemperature(gridIndex, temp);
          measureHumidity(gridIndex);
          setIsSpraying(false);
          
          console.log(`✅ [구역 ${gridIndex}] 분사 완료 - 다음 구역으로 이동`);
          
          if (isRunningRef.current) {
            setTimeout(() => {
              moveToNextGrid();
            }, 100);
          }
        }, 10000);
      }, 2000);
    } else {
      console.log(`❌ 클릭 무시: 조건 불만족 (모드: ${selectedModeRef.current}, 분사중: ${isSprayingRef.current}, 동작중: ${isRunningRef.current})`);
    }
  };

  const handleGridClick = useCallback((gridIndex) => {
    handleManualSpray(gridIndex);
  }, [patrolCurrentGrid, gridTemperatures]);

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

  // 통합된 순찰 로직
  useEffect(() => {
    if (!isRunning || isSpraying) return;

    if (!isInitialized && patrolSequenceIndex === 0) {
      setIsInitialized(true);
    }

    const currentGrid = PATROL_SEQUENCE[patrolSequenceIndex];
    console.log(`📍 구역 ${patrolSequenceIndex} (실제 그리드 ${currentGrid}) 도착`);
    
    const measureTimer = setTimeout(() => {
      if (!isRunningRef.current) {
        console.log('⚠️ [순찰 취소] 타이머 실행 중 시스템이 정지되었습니다');
        return;
      }
      
      if (selectedModeRef.current === '자동') {
        if (humanDetectedRef.current) {
          const temp = measureTemperature(currentGrid, false);
          measureHumidity(currentGrid);
          
          const shouldSpray = temp >= 22;
          
          if (shouldSpray) {
            console.log(`🎯 [구역 ${currentGrid}] 가축 감지 + 고온 → 분사 시작 (가축: 감지됨, 온도: ${temp}°C)`);
            executeAutoSpray(currentGrid, temp);
          } else {
            console.log(`❄️ [구역 ${currentGrid}] 가축 감지되지만 저온 → 다음 구역 (가축: 감지됨, 온도: ${temp}°C)`);
            setTimeout(moveToNextGrid, 100);
          }
        } else {
          console.log(`👻 [구역 ${currentGrid}] 가축 미감지 → 다음 구역으로 이동`);
          setTimeout(moveToNextGrid, 100);
        }
      } else {
        const temp = measureTemperature(currentGrid, false);
        measureHumidity(currentGrid);
        console.log(`⏸️ [구역 ${currentGrid}] 순찰 모드 - 측정 완료, 클릭 대기 중`);
        
        const waitTimer = setTimeout(() => {
          if (!isSprayingRef.current && isRunningRef.current) {
            console.log(`➡️ [구역 ${currentGrid}] 클릭 없음 - 다음 구역으로 이동`);
            moveToNextGrid();
          }
        }, 2000);
        
        return () => clearTimeout(waitTimer);
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
    updateGridData // ⭐ 새 함수 export
  };
};