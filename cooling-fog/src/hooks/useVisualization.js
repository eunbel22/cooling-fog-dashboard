import { useState, useEffect, useCallback, useMemo } from 'react';

export const useVisualization = (selectedMode) => {
  const [manualTargetGrid, setManualTargetGrid] = useState(null);
  const [patrolCurrentGrid, setPatrolCurrentGrid] = useState(0);
  const [gridTemperatures, setGridTemperatures] = useState({});

  // 9개 격자 구역 정의 - useMemo로 메모이제이션
  const GRID_POSITIONS = useMemo(() => [
    { row: 0, col: 0, name: "북서", position: { top: "16.67%", left: "16.67%" } },
    { row: 0, col: 1, name: "북중", position: { top: "16.67%", left: "50%" } },
    { row: 0, col: 2, name: "북동", position: { top: "16.67%", left: "83.33%" } },
    { row: 1, col: 0, name: "중서", position: { top: "50%", left: "16.67%" } },
    { row: 1, col: 1, name: "중앙", position: { top: "50%", left: "50%" } },
    { row: 1, col: 2, name: "중동", position: { top: "50%", left: "83.33%" } },
    { row: 2, col: 0, name: "남서", position: { top: "83.33%", left: "16.67%" } },
    { row: 2, col: 1, name: "남중", position: { top: "83.33%", left: "50%" } },
    { row: 2, col: 2, name: "남동", position: { top: "83.33%", left: "83.33%" } }
  ], []);

  // 격자 클릭 핸들러
  const handleGridClick = useCallback((gridIndex) => {
    if (selectedMode === '수동') {
      setManualTargetGrid(gridIndex);
    }
  }, [selectedMode]);

  // 쿨링포그 위치 계산
  const getDevicePositionByMode = useCallback(() => {
    const currentGrid = GRID_POSITIONS[patrolCurrentGrid];
    return {
      bottom: `${100 - parseFloat(currentGrid.position.top)}%`,
      left: currentGrid.position.left,
      transform: 'translate(-50%, 50%)'
    };
  }, [GRID_POSITIONS, patrolCurrentGrid]);

  const shouldShowTarget = useCallback(() => false, []);
  const shouldShowGridOverlay = useCallback(() => selectedMode === '수동', [selectedMode]);

  // 순찰 로직
  useEffect(() => {
    const patrolInterval = setInterval(() => {
      setPatrolCurrentGrid(prev => {
        const nextGrid = (prev + 1) % 9;
        
        // 온도 생성
        const baseTemp = 26;
        const variation = Math.random() * 6 - 3;
        const gridVariation = (nextGrid % 3) * 0.5;
        const temp = Math.round((baseTemp + variation + gridVariation) * 10) / 10;
        
        setGridTemperatures(prevTemps => ({
          ...prevTemps,
          [nextGrid]: temp
        }));
        
        return nextGrid;
      });
    }, 3000);
    
    return () => clearInterval(patrolInterval);
  }, []);

  return {
    manualTargetGrid,
    patrolCurrentGrid,
    gridTemperatures,
    GRID_POSITIONS,
    handleGridClick,
    getDevicePositionByMode,
    shouldShowTarget,
    shouldShowGridOverlay
  };
};