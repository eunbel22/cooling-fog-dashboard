import { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';

export const useDeviceControl = (setIsLoading, setError) => {
  // localStorage에서 초기값 로드
  const [isRunning, setIsRunning] = useState(() => {
    try {
      const saved = localStorage.getItem('coolingFog_isRunning');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.error('localStorage 읽기 오류:', error);
      return false;
    }
  });

  const [selectedMode, setSelectedMode] = useState(() => {
    try {
      const saved = localStorage.getItem('coolingFog_selectedMode');
      return saved ? JSON.parse(saved) : '자동';
    } catch (error) {
      console.error('localStorage 읽기 오류:', error);
      return '자동';
    }
  });

  // isRunning 상태 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('coolingFog_isRunning', JSON.stringify(isRunning));
      console.log('💾 [상태저장] isRunning:', isRunning);
    } catch (error) {
      console.error('localStorage 저장 오류:', error);
    }
  }, [isRunning]);

  // selectedMode 상태 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('coolingFog_selectedMode', JSON.stringify(selectedMode));
      console.log('💾 [상태저장] selectedMode:', selectedMode);
    } catch (error) {
      console.error('localStorage 저장 오류:', error);
    }
  }, [selectedMode]);
  
  // 기기 시작/정지 함수
  const handleDeviceToggle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newRunningState = !isRunning;
      
      if (isRunning) {
        await deviceAPI.stop();
        console.log('🛑 [기기 제어] 정지 요청');
      } else {
        await deviceAPI.start();
        console.log('▶️ [기기 제어] 시작 요청');
      }
      
      setIsRunning(newRunningState);
      console.log(`🔄 [상태 변경] isRunning: ${isRunning} → ${newRunningState}`);
      
    } catch (err) {
      setError('기기 제어 중 오류가 발생했습니다.');
      console.error('Device control error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 추적 모드 변경 함수
  const handleTrackingModeChange = async (mode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deviceAPI.setTrackingMode(mode);
      setSelectedMode(mode);
      console.log(`🔄 [모드 변경] selectedMode: ${selectedMode} → ${mode}`);
      
    } catch (err) {
      setError('추적 모드 설정 중 오류가 발생했습니다.');
      console.error('Tracking mode error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 긴급 정지 함수
  const handleEmergencyStop = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deviceAPI.stop();
      setIsRunning(false);
      console.log('🚨 [긴급 정지] 모든 동작 중단');
      
    } catch (err) {
      setError('긴급 정지 중 오류가 발생했습니다.');
      console.error('Emergency stop error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 외부에서 상태 강제 설정 (웹소켓 등에서 사용)
  const forceSetIsRunning = (newState) => {
    if (newState !== isRunning) {
      setIsRunning(newState);
      console.log(`🔄 [외부 상태 동기화] isRunning: ${isRunning} → ${newState}`);
    }
  };

  const forceSetSelectedMode = (newMode) => {
    if (newMode !== selectedMode) {
      setSelectedMode(newMode);
      console.log(`🔄 [외부 상태 동기화] selectedMode: ${selectedMode} → ${newMode}`);
    }
  };
  
  return {
    isRunning,
    setIsRunning: forceSetIsRunning,
    selectedMode,
    setSelectedMode: forceSetSelectedMode,
    handleDeviceToggle,
    handleTrackingModeChange,
    handleEmergencyStop
  };
};