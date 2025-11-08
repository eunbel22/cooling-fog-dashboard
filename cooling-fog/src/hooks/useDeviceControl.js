import { useState, useEffect, useRef } from 'react';
import { deviceAPI } from '../services/api';

// 전역 메모리 상태 (탭 간 공유)
let globalIsRunning = false;
let globalSelectedMode = '자동';

export const useDeviceControl = (setIsLoading, setError) => {
  // 전역 상태로 초기화
  const [isRunning, setIsRunning] = useState(globalIsRunning);
  const [selectedMode, setSelectedMode] = useState(globalSelectedMode);
  
  // 상태 변경 시 전역 변수도 업데이트
  useEffect(() => {
    globalIsRunning = isRunning;
    console.log('🔄 [전역 상태] isRunning 업데이트:', isRunning);
  }, [isRunning]);

  useEffect(() => {
    globalSelectedMode = selectedMode;
    console.log('🔄 [전역 상태] selectedMode 업데이트:', selectedMode);
  }, [selectedMode]);
  
  // 기기 시작/정지 함수
  const handleDeviceToggle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newRunningState = !isRunning;
      
      if (isRunning) {
        await deviceAPI.stop();
        console.log('🛑 [사용자 액션] 정지 버튼 클릭');
      } else {
        await deviceAPI.start();
        console.log('▶️ [사용자 액션] 시작 버튼 클릭');
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
      console.log('🚨 [사용자 액션] 긴급정지 버튼 클릭');
      
    } catch (err) {
      setError('긴급 정지 중 오류가 발생했습니다.');
      console.error('Emergency stop error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 외부에서 상태 강제 설정 (웹소켓 등에서 사용) - 제거
  const forceSetIsRunning = (newState) => {
    console.log('⚠️ [외부 동기화 무시] isRunning 설정 시도 무시됨:', newState);
    // 외부에서의 상태 변경을 무시
  };

  const forceSetSelectedMode = (newMode) => {
    console.log('⚠️ [외부 동기화 무시] selectedMode 설정 시도 무시됨:', newMode);
    // 외부에서의 모드 변경도 무시
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