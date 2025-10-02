import { useState, useEffect } from 'react';
import { scheduleAPI } from '../services/api';

export const useScheduleManager = () => {
  const [schedules, setSchedules] = useState([
    {
      id: 1,
      title: '오후 쿨링 타임',
      time: '오후 11:00 - 오전 01:00',
      intensity: '80%',
      mode: '자동',
      repeat: '화, 수, 목, 금',
      isActive: true
    },
    {
      id: 2,
      title: '저녁 휴식 시간',
      time: '오전 04:00 - 오전 06:00',
      intensity: '60%',
      mode: '수동',
      repeat: '토, 일',
      isActive: true
    }
  ]);

  const [activeSchedules, setActiveSchedules] = useState([]);
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [lastScheduleCheck, setLastScheduleCheck] = useState(null);

  // 스케줄 데이터 로드
  const loadSchedules = async () => {
    try {
      const response = await scheduleAPI.getAll();
      const backendSchedules = response.data.schedules;
      
      const formattedSchedules = backendSchedules.map(schedule => {
        const dayMap = {1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일'};
        const koreanDays = schedule.days_of_week.map(dayNum => dayMap[dayNum]);
        
        return {
          id: schedule.id,
          title: schedule.title,
          time: `${schedule.start_time} - ${schedule.end_time}`,
          intensity: `${schedule.intensity}%`,
          mode: schedule.mode,
          repeat: koreanDays.join(', '),
          isActive: schedule.is_active
        };
      });
      
      setSchedules(formattedSchedules);
      return { success: true };
    } catch (err) {
      console.error('Schedule loading error:', err);
      return { success: false, error: '스케줄을 불러오는 중 오류가 발생했습니다.' };
    }
  };

  // 현재 요일 반환 (1: 월, 2: 화, ..., 7: 일)
  const getCurrentDayNumber = () => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 ? 7 : day;
  };

  // 현재 시간을 분 단위로 반환
  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // 활성 스케줄 확인
  const checkActiveSchedules = () => {
    if (!schedulerEnabled || !schedules || schedules.length === 0) {
      return [];
    }
    
    const currentDay = getCurrentDayNumber();
    const currentMinutes = getCurrentMinutes();
    const currentTime = new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    
    const newActiveSchedules = [];
    
    schedules.forEach(schedule => {
      if (!schedule.isActive) return;
      
      const dayMap = {'월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7};
      const scheduleDays = schedule.repeat.split(', ').map(day => dayMap[day]).filter(Boolean);
      
      if (!scheduleDays.includes(currentDay)) return;
      
      const parseTime = (timeStr) => {
        let [period, time] = timeStr.includes('오전') || timeStr.includes('오후') 
          ? [timeStr.includes('오후') ? 'PM' : 'AM', timeStr.replace(/오전 |오후 /, '')]
          : ['24H', timeStr];
        
        const [hours, minutes] = time.split(':').map(Number);
        let adjustedHours = hours;
        
        if (period === 'PM' && hours !== 12) adjustedHours += 12;
        if (period === 'AM' && hours === 12) adjustedHours = 0;
        
        return adjustedHours * 60 + minutes;
      };
      
      try {
        let [startTime, endTime] = schedule.time.split(' - ');
        const startMinutes = parseTime(startTime);
        let endMinutes = parseTime(endTime);
        
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60;
        }
        
        let isInRange = false;
        if (endMinutes > 24 * 60) {
          isInRange = (currentMinutes >= startMinutes) || (currentMinutes <= endMinutes - 24 * 60);
        } else {
          isInRange = (currentMinutes >= startMinutes && currentMinutes < endMinutes);
        }
        
        if (isInRange) {
          newActiveSchedules.push({
            ...schedule,
            startMinutes,
            endMinutes: endMinutes > 24 * 60 ? endMinutes - 24 * 60 : endMinutes,
            currentTime
          });
        }
      } catch (error) {
        console.error(`스케줄 "${schedule.title}" 시간 파싱 오류:`, error);
      }
    });
    
    setActiveSchedules(prev => {
      const isSame = JSON.stringify(prev) === JSON.stringify(newActiveSchedules);
      if (isSame) return prev;
      return newActiveSchedules;
    });
    
    setLastScheduleCheck(new Date());
    
    return newActiveSchedules;
  };

  // 스케줄에 따른 장치 제어 실행
  const executeScheduleControl = (activeScheduleList, handleTrackingModeChange, handleDeviceToggle, selectedMode, isRunning) => {
    if (activeScheduleList.length === 0) return;
    
    const primarySchedule = activeScheduleList.reduce((latest, current) => {
      return current.startMinutes > latest.startMinutes ? current : latest;
    });
    
    console.log(`스케줄 "${primarySchedule.title}" 실행 중:`, {
      intensity: primarySchedule.intensity,
      mode: primarySchedule.mode,
      time: primarySchedule.currentTime
    });
    
    if (primarySchedule.mode !== selectedMode) {
      console.log(`추적 모드 변경: ${selectedMode} → ${primarySchedule.mode}`);
      handleTrackingModeChange(primarySchedule.mode);
    }
    
    if (!isRunning) {
      console.log('스케줄에 의한 장치 시작');
      handleDeviceToggle();
    }
  };

  // 스케줄 활성/비활성 토글
  const toggleScheduleStatus = (scheduleId) => {
    setSchedules(prevSchedules => 
      prevSchedules.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, isActive: !schedule.isActive }
          : schedule
      )
    );
  };

  // 스케줄 삭제
  const deleteSchedule = async (scheduleId) => {
    try {
      await scheduleAPI.delete(scheduleId);
      await loadSchedules();
      return { success: true };
    } catch (err) {
      console.error('Schedule deletion error:', err);
      return { success: false, error: '스케줄 삭제 중 오류가 발생했습니다.' };
    }
  };

  // 스케줄 생성
  const createSchedule = async (scheduleData) => {
    try {
      await scheduleAPI.create(scheduleData);
      await loadSchedules();
      return { success: true };
    } catch (err) {
      console.error('Schedule creation error:', err);
      return { success: false, error: '스케줄 생성 중 오류가 발생했습니다.' };
    }
  };

  return {
    schedules,
    setSchedules,
    activeSchedules,
    schedulerEnabled,
    setSchedulerEnabled,
    lastScheduleCheck,
    loadSchedules,
    checkActiveSchedules,
    executeScheduleControl,
    toggleScheduleStatus,
    deleteSchedule,
    createSchedule
  };
};