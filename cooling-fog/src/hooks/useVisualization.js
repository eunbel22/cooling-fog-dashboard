import { useState, useEffect } from 'react';

export const useVisualization = (selectedMode) => {
  const [manualTargetGrid, setManualTargetGrid] = useState(null);
  const [patrolCurrentGrid, setPatrolCurrentGrid] = useState(0);
  const [gridTemperatures, setGridTemperatures] = useState({});
  const [isPatrolling, setIsPatrolling] = useState(false);

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

  // 쿨링포그 장치 위치 계산 함수
  const getDevicePosition = (direction, distance) => {
    const safeDistance = 0.3;
    const followDistance = Math.max(distance - safeDistance, 0);
    const maxDistance = 1.5;
    const normalizedDistance = Math.min(followDistance / maxDistance, 1);
    const gridSize = 70;
    const actualMovement = normalizedDistance * (gridSize / 2);
    
    const positions = {
      '북쪽': { 
        bottom: `${Math.max(15, 50 - actualMovement * 0.8)}%`,
        left: '50%' 
      },
      '남쪽': { 
        bottom: `${Math.min(85, 50 + actualMovement * 0.8)}%`,
        left: '50%' 
      },
      '동쪽': { 
        bottom: '50%', 
        left: `${Math.max(15, 50 - actualMovement * 0.8)}%`
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

  // 쿨링포그 위치 계산 - 모드별 동작
  const getDevicePositionByMode = (humanDetected, direction, distance) => {
    switch (selectedMode) {
      case '자동':
        if (humanDetected) {
          return getDevicePosition(direction, distance);
        } else {
          return { bottom: '50%', left: '50%', transform: 'translate(-50%, 50%)' };
        }
        
      case '수동':
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

  // 추적 대상 표시 여부
  const shouldShowTarget = (humanDetected) => {
    return selectedMode !== '끄기' && humanDetected;
  };

  // 격자 오버레이 표시 여부
  const shouldShowGridOverlay = () => {
    return selectedMode === '수동';
  };

  // 구역별 온도 생성
  const generateGridTemperature = (gridIndex) => {
    const baseTemp = 26;
    const variation = Math.random() * 6 - 3;
    const gridVariation = (gridIndex % 3) * 0.5;
    return Math.round((baseTemp + variation + gridVariation) * 10) / 10;
  };

  // 순찰 모드 온도 측정
  useEffect(() => {
    let patrolInterval;
    
    if (selectedMode === '끄기') {
      setIsPatrolling(true);
      patrolInterval = setInterval(() => {
        const currentTemp = generateGridTemperature(patrolCurrentGrid);
        
        setGridTemperatures(prev => ({
          ...prev,
          [patrolCurrentGrid]: currentTemp
        }));
        
        setPatrolCurrentGrid(prev => (prev + 1) % 9);
      }, 3000);
    } else {
      setIsPatrolling(false);
    }
    
    return () => {
      if (patrolInterval) {
        clearInterval(patrolInterval);
      }
    };
  }, [selectedMode, patrolCurrentGrid]);

  return {
    manualTargetGrid,
    patrolCurrentGrid,
    gridTemperatures,
    isPatrolling,
    GRID_POSITIONS,
    handleGridClick,
    getDevicePositionByMode,
    shouldShowTarget,
    shouldShowGridOverlay
  };
};