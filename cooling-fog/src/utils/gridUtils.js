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

// ✅ PATROL_SEQUENCE 제거됨!
// 라즈베리파이가 이미 올바른 그리드 번호로 변환해서 전송하므로
// 웹은 단순히 받은 current_grid 값을 사용하면 됩니다.

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

// ✅ 그리드 인덱스를 그리드 이름으로 변환하는 헬퍼 함수
export const getGridName = (gridIndex) => {
  if (gridIndex < 0 || gridIndex >= 25) return "Unknown";
  return GRID_POSITIONS[gridIndex].name;
};

// ✅ 그리드 번호(1-25)를 인덱스(0-24)로 변환
export const gridNumberToIndex = (gridNumber) => {
  return gridNumber - 1;
};

// ✅ 그리드 인덱스(0-24)를 번호(1-25)로 변환
export const gridIndexToNumber = (gridIndex) => {
  return gridIndex + 1;
};