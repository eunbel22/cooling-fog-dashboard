import React from 'react';
import '../../styles/tabs/ControlTab.css';

const ControlTab = ({ 
  isLoading,
  error,
  setError,
  isRunning,
  selectedMode,
  handleDeviceToggle,
  handleEmergencyStop,
  handleTrackingModeChange
}) => {
  return (
    <div className="tab-content">
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="controls-row">
        {/* 기기 제어 */}
        <div className="control-section-half">
          <h3>
            <img src="/assets/icons/device-control.svg" alt="device-control" className="section-icon" />
            기기 제어
          </h3>
          
          <div className="control-content-vertical">
            {/* 시작/일시정지 버튼 */}
            <button 
              onClick={handleDeviceToggle}
              disabled={isLoading}
              className={`control-button ${isRunning ? 'pause-button' : 'start-button'} ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <span>처리중...</span>
              ) : (
                <>
                  {isRunning ? 
                    <img src="/assets/icons/pause.svg" alt="pause" className="button-icon" /> : 
                    <img src="/assets/icons/start.svg" alt="start" className="button-icon" />
                  }
                  <span>{isRunning ? '일시정지' : '시작'}</span>
                </>
              )}
            </button>

            {/* 긴급 정지 버튼 */}
            <button 
              className="stop-button-compact"
              onClick={handleEmergencyStop}
              disabled={isLoading}
            >
              <img src="/assets/icons/stop.svg" alt="stop" className="button-icon" />
              <span>긴급 정지</span>
            </button>
          </div>
        </div>

        {/* 추적 제어 */}
        <div className="tracking-section-half">
          <h3>
            <img src="/assets/icons/tracking-control.svg" alt="tracking-control" className="section-icon" />
            추적제어
          </h3>
          
          <div className="tracking-content-vertical">
            <div className="mode-selector-vertical">
              <div className="mode-buttons-full">
                {['자동', '수동', '끄기'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleTrackingModeChange(mode)}
                    disabled={isLoading}
                    className={`mode-button-full ${
                      mode === '자동' && selectedMode === mode ? 'active-blue' :
                      mode === '수동' && selectedMode === mode ? 'active-white' :
                      mode === '끄기' && selectedMode === mode ? 'active-gray' :
                      'inactive'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>                  
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlTab;