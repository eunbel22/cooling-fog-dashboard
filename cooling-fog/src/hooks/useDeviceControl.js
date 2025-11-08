import { useState, useEffect, useRef } from 'react';
import { deviceAPI } from '../services/api';

export const useDeviceControl = (setIsLoading, setError) => {
  // 상태 변경 추적을 위한 ref
  const isInitializedRef = useRef(false);
  const lastStoredStateRef = useRef(null);

  // localStorage에서 초기값 로드 (더 안전한 방식)
  const getInitialRunningState = () => {
    try {
      const saved = localStorage.getItem('coolingFog_isRunning');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        lastStoredStateRef.current = parsed;
        console.log('📱 [초기화] localStorage에서 isRunning 복원:', parsed);
        return parsed;
      } else {
        console.log('📱 [초기화] localStorage가 비어있음, false로 설정');
        return false;
      }
    } catch (error) {
      console.error('📱 [오류] localStorage 읽기 실패:', error);
      return false;
    }
  };

  const getInitialModeState = () => {
    try {
      const saved = localStorage.getItem('coolingFog_selectedMode');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        console.log('📱 [초기화] localStorage에서 selectedMode 복원:', parsed);
        return parsed;
      } else {
        console.log('📱 [초기화] localStorage가 비어있음, 자동으로 설정');
        return '자동';
      }
    } catch (error) {
      console.error('📱 [오류] localStorage 읽기 실패:', error);
      return '자동';
    }
  };

  const [isRunning, setIsRunning] = useState(getInitialRunningState);
  const [selectedMode, setSelectedMode] = useState(getInitialModeState);

  // 컴포넌트 마운트 완료 표시
  useEffect(() => {
    isInitializedRef.current = true;
    console.log('🚀 [useDeviceControl] 초기화 완료');
  }, []);

  // isRunning 상태 변경 시 localStorage에 저장 (초기화 완료 후에만)
  useEffect(() => {
    if (!isInitializedRef.current) return; // 초기화 중에는 저장하지 않음

    // 이전 상태와 같으면 저장하지 않음 (무한 루프 방지)
    if (lastStoredStateRef.current === isRunning) return;

    try {
      localStorage.setItem('coolingFog_isRunning', JSON.stringify(isRunning));
      lastStoredStateRef.current = isRunning;
      console.log('💾 [상태저장] isRunning:', isRunning);
    } catch (error) {
      console.error('💾 [오류] localStorage 저장 실패:', error);
    }
  }, [isRunning]);

  // selectedMode 상태 변경 시 localStorage에 저장 (초기화 완료 후에만)
  useEffect(() => {
    if (!isInitializedRef.current) return; // 초기화 중에는 저장하지 않음

    try {
      localStorage.setItem('coolingFog_selectedMode', JSON.stringify(selectedMode));
      console.log('💾 [상태저장] selectedMode:', selectedMode);
    } catch (error) {
      console.error('💾 [오류] localStorage 저장 실패:', error);
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

  // 외부에서 상태 강제 설정 (웹소켓 등에서 사용)
  const forceSetIsRunning = (newState) => {
    if (newState !== isRunning) {
      setIsRunning(newState);
      console.log(`📡 [외부 동기화] isRunning: ${isRunning} → ${newState}`);
    }
  };

  const forceSetSelectedMode = (newMode) => {
    if (newMode !== selectedMode) {
      setSelectedMode(newMode);
      console.log(`📡 [외부 동기화] selectedMode: ${selectedMode} → ${newMode}`);
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