// 격자 관련 상수와 함수들

//9개 격자 구역 정의 (3x3 그리드)
export const GRID_POSITIONS = [
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


// 구역별 온도 생성 함수 (실제로는 센서에서 측정)  
export const generateGridTemperature = (gridIndex) => {
    // 각 구역마다 약간씩 다른 온도 범위 설정
    const baseTemp = 26; // 기본 온도
    const variation = Math.random() * 6 - 3; // -3도 ~ +3도 변화
    const gridVariation = (gridIndex % 3) * 0.5; // 구역별 미세한 차이
    return Math.round((baseTemp + variation + gridVariation) * 10) / 10;
  };