import { useState, useEffect, useCallback, useRef } from 'react';
import { GRID_POSITIONS, PATROL_SEQUENCE, generateGridTemperature, generateGridHumidity } from '../utils/gridUtils';

export const useVisualization = (selectedMode, humanDetected) => {
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

  // 현재 순찰 중인 실제 그리드 인덱스
  const patrolCurrentGrid = PATROL_SEQUENCE[patrolSequenceIndex];

  // 온도 측정 함수 (previousTemp: 이전 온도값)
  const measureTemperature = (gridIndex, previousTemp = null) => {
    let temp;
    
    if (previousTemp !== null && typeof previousTemp === 'number') {
      // 분사 후: 이전 온도에서 1~3도 감소
      const coolingEffect = Math.random() * 2 + 1; // 1~3도 랜덤 감소
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
    // PATROL_SEQUENCE에서 targetGridIndex의 위치 찾기
    const sequenceIndex = PATROL_SEQUENCE.indexOf(targetGridIndex);
    if (sequenceIndex !== -1) {
      setPatrolSequenceIndex(sequenceIndex);
      console.log(`🎯 [구역 ${targetGridIndex}] 로 즉시 이동 (시퀀스 인덱스: ${sequenceIndex})`);
    }
  };

  // 자동 모드(추적): 분사 실행 및 재확인
  const executeAutoSpray = (gridIndex, currentTemp) => {
    setIsSpraying(true);
    console.log(`💨 [구역 ${gridIndex}] 10초 분사 시작 (현재 온도: ${currentTemp}°C)`);
    
    // 10초 분사
    setTimeout(() => {
      // 분사 완료 후 즉시 재측정 (온도 감소 적용 - 이전 온도 전달)
      const newTemp = measureTemperature(gridIndex, currentTemp);
      measureHumidity(gridIndex); // 습도도 함께 측정
      setIsSpraying(false);
      
      // 짧은 딜레이 후 조건 재확인
      setTimeout(() => {
        const stillHumanDetected = humanDetectedRef.current;
        const shouldContinue = stillHumanDetected && newTemp >= 22;
        
        if (shouldContinue) {
          // 조건 여전히 만족 → 다시 분사
          console.log(`✅ [구역 ${gridIndex}] 조건 만족 - 계속 분사 (인체: ${stillHumanDetected}, 온도: ${newTemp}°C)`);
          executeAutoSpray(gridIndex, newTemp);
        } else {
          // 조건 불만족 → 다음 구역으로
          console.log(`⭕ [구역 ${gridIndex}] 조건 불만족 - 다음 구역 (인체: ${stillHumanDetected}, 온도: ${newTemp}°C)`);
          moveToNextGrid();
        }
      }, 100); // 100ms 딜레이
    }, 10000); // 10초 분사
  };

  // 수동 모드(순찰): 클릭 시 해당 구역으로 이동 후 분사
  const handleManualSpray = (gridIndex) => {
    console.log(`
🖱️ 클릭 이벤트 발생:
  - 클릭한 구역: ${gridIndex}
  - 현재 모드: ${selectedModeRef.current}
  - 현재 순찰 구역: ${patrolCurrentGrid}
  - 분사 중: ${isSprayingRef.current}
    `);
    
    // 수동 모드이고 분사 중이 아닐 때만 동작
    if (selectedModeRef.current === '수동' && !isSprayingRef.current) {
      setManualTargetGrid(gridIndex);
      
      // 클릭한 구역으로 즉시 이동
      moveToSpecificGrid(gridIndex);
      
      // 이동 후 2초 대기 (이동 애니메이션)
      setTimeout(() => {
        // 온도/습도 측정
        const temp = measureTemperature(gridIndex);
        measureHumidity(gridIndex);
        
        console.log(`👆 [구역 ${gridIndex}] 도착 - 10초 분사 시작 (온도: ${temp}°C)`);
        setIsSpraying(true);
        
        // 10초 분사
        setTimeout(() => {
          // 분사 완료 후 재측정 (온도 감소 적용)
          const newTemp = measureTemperature(gridIndex, temp);
          measureHumidity(gridIndex);
          setIsSpraying(false);
          
          console.log(`✅ [구역 ${gridIndex}] 분사 완료 - 다음 구역으로 이동`);
          
          // 다음 구역으로 순찰 재개
          setTimeout(() => {
            moveToNextGrid();
          }, 100);
        }, 10000); // 10초 분사
      }, 2000); // 2초 이동 시간
    } else {
      console.log(`❌ 클릭 무시: 조건 불만족 (모드: ${selectedModeRef.current}, 분사중: ${isSprayingRef.current})`);
    }
  };

  // 격자 클릭 핸들러
  const handleGridClick = useCallback((gridIndex) => {
    handleManualSpray(gridIndex);
  }, [patrolCurrentGrid, gridTemperatures]);

  // 쿨링포그 위치 계산
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

  // 통합된 순찰 로직 - 모드별 동작 구분
  useEffect(() => {
    // 분사 중이면 실행 안함
    if (isSpraying) return;

    // 첫 마운트 시에만 초기화 플래그 설정
    if (!isInitialized && patrolSequenceIndex === 0) {
      setIsInitialized(true);
    }

    const currentGrid = PATROL_SEQUENCE[patrolSequenceIndex];
    console.log(`📍 구역 ${patrolSequenceIndex} (실제 그리드 ${currentGrid}) 도착`);
    
    // 2초 후 온도/습도 측정
    const measureTimer = setTimeout(() => {
      const temp = measureTemperature(currentGrid, false);
      measureHumidity(currentGrid); // 습도도 함께 측정
      
      if (selectedModeRef.current === '자동') {
        // 자동 모드(추적): 조건 확인 후 자동 분사
        const shouldSpray = humanDetectedRef.current && temp >= 22;
        
        if (shouldSpray) {
          console.log(`🎯 [구역 ${currentGrid}] 자동 분사 조건 만족 (인체: ${humanDetectedRef.current}, 온도: ${temp}°C)`);
          executeAutoSpray(currentGrid, temp);
        } else {
          // 조건 불만족 → 다음 구역
          console.log(`⭕ [구역 ${currentGrid}] 조건 불만족 - 다음 구역 (인체: ${humanDetectedRef.current}, 온도: ${temp}°C)`);
          setTimeout(moveToNextGrid, 100);
        }
      } else {
        // 수동 모드(순찰): 온도/습도만 측정하고 클릭 대기
        console.log(`⏸️ [구역 ${currentGrid}] 순찰 모드 - 측정 완료, 클릭 대기 중`);
        
        // 2초 대기 후 클릭 없으면 다음 구역으로 이동
        const waitTimer = setTimeout(() => {
          if (!isSprayingRef.current) {
            console.log(`➡️ [구역 ${currentGrid}] 클릭 없음 - 다음 구역으로 이동`);
            moveToNextGrid();
          }
        }, 2000);
        
        return () => clearTimeout(waitTimer);
      }
    }, 2000);
    
    return () => clearTimeout(measureTimer);
  }, [patrolSequenceIndex, isSpraying, isInitialized]);

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
    shouldShowGridOverlay
  };
};