// 격자 관련 상수와 함수들

// 16개 격자 구역 정의 (4x4 그리드)
export const GRID_POSITIONS = [
  // 첫 번째 행
  { row: 0, col: 0, name: "북서1", position: { top: "12.5%", left: "12.5%" } },
  { row: 0, col: 1, name: "북서2", position: { top: "12.5%", left: "37.5%" } },
  { row: 0, col: 2, name: "북동1", position: { top: "12.5%", left: "62.5%" } },
  { row: 0, col: 3, name: "북동2", position: { top: "12.5%", left: "87.5%" } },
  // 두 번째 행
  { row: 1, col: 0, name: "중서1", position: { top: "37.5%", left: "12.5%" } },
  { row: 1, col: 1, name: "중서2", position: { top: "37.5%", left: "37.5%" } },
  { row: 1, col: 2, name: "중동1", position: { top: "37.5%", left: "62.5%" } },
  { row: 1, col: 3, name: "중동2", position: { top: "37.5%", left: "87.5%" } },
  // 세 번째 행
  { row: 2, col: 0, name: "남서1", position: { top: "62.5%", left: "12.5%" } },
  { row: 2, col: 1, name: "남서2", position: { top: "62.5%", left: "37.5%" } },
  { row: 2, col: 2, name: "남동1", position: { top: "62.5%", left: "62.5%" } },
  { row: 2, col: 3, name: "남동2", position: { top: "62.5%", left: "87.5%" } },
  // 네 번째 행
  { row: 3, col: 0, name: "남서3", position: { top: "87.5%", left: "12.5%" } },
  { row: 3, col: 1, name: "남서4", position: { top: "87.5%", left: "37.5%" } },
  { row: 3, col: 2, name: "남동3", position: { top: "87.5%", left: "62.5%" } },
  { row: 3, col: 3, name: "남동4", position: { top: "87.5%", left: "87.5%" } }
];

// ㄹ자 패턴 순회 순서 정의: 1→2→3→4 → 8→7→6→5 → 9→10→11→12 → 16→15→14→13
export const PATROL_SEQUENCE = [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12];

// 구역별 온도 생성 함수 (실제로는 센서에서 측정)  
export const generateGridTemperature = (gridIndex) => {
  // 각 구역마다 약간씩 다른 온도 범위 설정
  const baseTemp = 22; // 기본 온도
  const variation = Math.random() * 6 - 3; // -3도 ~ +3도 변화
  const gridVariation = (gridIndex % 4) * 0.5; // 구역별 미세한 차이
  return Math.round((baseTemp + variation + gridVariation) * 10) / 10;
};

// 구역별 습도 생성 함수 (실제로는 센서에서 측정)
export const generateGridHumidity = (gridIndex) => {
  // 각 구역마다 약간씩 다른 습도 범위 설정
  const baseHumidity = 65; // 기본 습도
  const variation = Math.random() * 20 - 10; // -10% ~ +10% 변화
  const gridVariation = (gridIndex % 4) * 2; // 구역별 미세한 차이
  return Math.round(baseHumidity + variation + gridVariation);
};