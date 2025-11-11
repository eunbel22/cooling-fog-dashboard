// 격자 관련 상수와 함수들

// 25개 격자 구역 정의 (5x5 그리드)
export const GRID_POSITIONS = [
  // 첫 번째 행 (row 0)
  { row: 0, col: 0, name: "A1", position: { top: "10%", left: "10%" } },
  { row: 0, col: 1, name: "A2", position: { top: "10%", left: "30%" } },
  { row: 0, col: 2, name: "A3", position: { top: "10%", left: "50%" } },
  { row: 0, col: 3, name: "A4", position: { top: "10%", left: "70%" } },
  { row: 0, col: 4, name: "A5", position: { top: "10%", left: "90%" } },
  
  // 두 번째 행 (row 1)
  { row: 1, col: 0, name: "B1", position: { top: "30%", left: "10%" } },
  { row: 1, col: 1, name: "B2", position: { top: "30%", left: "30%" } },
  { row: 1, col: 2, name: "B3", position: { top: "30%", left: "50%" } },
  { row: 1, col: 3, name: "B4", position: { top: "30%", left: "70%" } },
  { row: 1, col: 4, name: "B5", position: { top: "30%", left: "90%" } },
  
  // 세 번째 행 (row 2)
  { row: 2, col: 0, name: "C1", position: { top: "50%", left: "10%" } },
  { row: 2, col: 1, name: "C2", position: { top: "50%", left: "30%" } },
  { row: 2, col: 2, name: "C3", position: { top: "50%", left: "50%" } },
  { row: 2, col: 3, name: "C4", position: { top: "50%", left: "70%" } },
  { row: 2, col: 4, name: "C5", position: { top: "50%", left: "90%" } },
  
  // 네 번째 행 (row 3)
  { row: 3, col: 0, name: "D1", position: { top: "70%", left: "10%" } },
  { row: 3, col: 1, name: "D2", position: { top: "70%", left: "30%" } },
  { row: 3, col: 2, name: "D3", position: { top: "70%", left: "50%" } },
  { row: 3, col: 3, name: "D4", position: { top: "70%", left: "70%" } },
  { row: 3, col: 4, name: "D5", position: { top: "70%", left: "90%" } },
  
  // 다섯 번째 행 (row 4)
  { row: 4, col: 0, name: "E1", position: { top: "90%", left: "10%" } },
  { row: 4, col: 1, name: "E2", position: { top: "90%", left: "30%" } },
  { row: 4, col: 2, name: "E3", position: { top: "90%", left: "50%" } },
  { row: 4, col: 3, name: "E4", position: { top: "90%", left: "70%" } },
  { row: 4, col: 4, name: "E5", position: { top: "90%", left: "90%" } }
];

// ㄹ자 패턴 순회 순서 정의 (5x5)
// A1→A2→A3→A4→A5 → B5→B4→B3→B2→B1 → C1→C2→C3→C4→C5 → D5→D4→D3→D2→D1 → E1→E2→E3→E4→E5
export const PATROL_SEQUENCE = [
  // 첫 번째 행: 왼쪽→오른쪽 (0→1→2→3→4)
  0, 1, 2, 3, 4,
  // 두 번째 행: 오른쪽→왼쪽 (9→8→7→6→5)
  9, 8, 7, 6, 5,
  // 세 번째 행: 왼쪽→오른쪽 (10→11→12→13→14)
  10, 11, 12, 13, 14,
  // 네 번째 행: 오른쪽→왼쪽 (19→18→17→16→15)
  19, 18, 17, 16, 15,
  // 다섯 번째 행: 왼쪽→오른쪽 (20→21→22→23→24)
  20, 21, 22, 23, 24
];

// 구역별 온도 생성 함수 (실제로는 센서에서 측정)  
/*export const generateGridTemperature = (gridIndex) => {
  // 각 구역마다 약간씩 다른 온도 범위 설정
  const baseTemp = 22; // 기본 온도
  const variation = Math.random() * 6 - 3; // -3도 ~ +3도 변화
  const gridVariation = (gridIndex % 5) * 0.5; // 구역별 미세한 차이
  return Math.round((baseTemp + variation + gridVariation) * 10) / 10;
};

// 구역별 습도 생성 함수 (실제로는 센서에서 측정)
export const generateGridHumidity = (gridIndex) => {
  // 각 구역마다 약간씩 다른 습도 범위 설정
  const baseHumidity = 65; // 기본 습도
  const variation = Math.random() * 20 - 10; // -10% ~ +10% 변화
  const gridVariation = (gridIndex % 5) * 2; // 구역별 미세한 차이
  return Math.round(baseHumidity + variation + gridVariation);
};*/

// 실제 센서 데이터 우선, 랜덤 생성은 테스트용
const USE_RANDOM_DATA = false;

export const generateGridTemperature = (gridIndex) => {
  if (!USE_RANDOM_DATA) return null; // 센서 모드일 땐 null 반환
  const baseTemp = 22;
  const variation = Math.random() * 6 - 3;
  const gridVariation = (gridIndex % 5) * 0.5;
  return Math.round((baseTemp + variation + gridVariation) * 10) / 10;
};

export const generateGridHumidity = (gridIndex) => {
  if (!USE_RANDOM_DATA) return null;
  const baseHumidity = 65;
  const variation = Math.random() * 20 - 10;
  const gridVariation = (gridIndex % 5) * 2;
  return Math.round(baseHumidity + variation + gridVariation);
};
