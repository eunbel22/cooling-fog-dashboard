import { useState } from 'react';
import { deviceAPI } from '../services/api';

export const useDeviceControl = (setIsLoading, setError) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMode, setSelectedMode] = useState('자동');
  
  // 기기 시작/정지 함수 수정
  const handleDeviceToggle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isRunning) {
        await deviceAPI.stop();
        setIsRunning(false);
      } else {
        await deviceAPI.start();
        setIsRunning(true);
      }
    } catch (err) {
      setError('기기 제어 중 오류가 발생했습니다.');
      console.error('Device control error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  // 추적 모드 변경 함수 수정
  const handleTrackingModeChange = async (mode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deviceAPI.setTrackingMode(mode);
      setSelectedMode(mode);
    } catch (err) {
      setError('추적 모드 설정 중 오류가 발생했습니다.');
      console.error('Tracking mode error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 긴급 정지 함수 수정
  const handleEmergencyStop = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deviceAPI.stop();
      setIsRunning(false);
    } catch (err) {
      setError('긴급 정지 중 오류가 발생했습니다.');
      console.error('Emergency stop error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isRunning,
    setIsRunning,
    selectedMode,
    setSelectedMode,
    handleDeviceToggle,
    handleTrackingModeChange,
    handleEmergencyStop
  };
};