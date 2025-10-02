// 시간 관련 유틸리티 함수들
  // 현재 요일을 숫자로 반환하는 함수 (1: 월, 2: 화, ..., 7: 일)
  export const getCurrentDayNumber = () => {
    const today = new Date();
    const day = today.getDay(); // 0: 일요일, 1: 월요일, ...
    return day === 0 ? 7 : day; // 일요일을 7로 변경
  };

  // 시간을 분 단위로 변환하는 함수
  export const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 현재 시간을 분 단위로 반환
  export const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };