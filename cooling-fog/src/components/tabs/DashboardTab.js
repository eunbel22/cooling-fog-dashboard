import React from 'react';
import '../../styles/tabs/DashboardTab.css';

const DashboardTab = ({ 
  temperature, 
  humidity,
  humanDetected,
  isLoading,
  error,
  setError,
  isRunning,
  selectedMode,
  handleDeviceToggle,
  handleEmergencyStop,
  handleTrackingModeChange
}) => {
  // 가축 감지 상태에 따른 아이콘 결정
  const getHumanDetectionIcon = () => {
    return humanDetected 
      ? "/assets/icons/people-icon.svg"
      : "/assets/icons/people-no-icon.svg";
  };

  const getHumanDetectionStyle = () => {
    return humanDetected ? 'status-good' : 'status-normal';
  };

  return (
    <div className="tab-content">
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {/* 3열 레이아웃 */}
      <div className="dashboard-three-columns">
        
        {/* 왼쪽: 센서 정보 (온도 + 습도 + 가축감지) */}
        <div className="sensor-column">
          {/* 온도 카드 */}
          <div className="dashboard-card-compact temperature-card">
            <div className="card-icon-compact">
              <img src="/assets/icons/temperature.svg" alt="temperature" />
            </div>
            <div className="card-content-compact">
              <div className="card-label">온도</div>
              <div className="card-value-compact">
                <span className="main-value">{temperature}</span>
                <span className="value-unit">°C</span>
              </div>
            </div>
          </div>

          {/* 습도 카드 */}
          <div className="dashboard-card-compact humidity-card">
            <div className="card-icon-compact">
              <img src="/assets/icons/humidity.svg" alt="humidity" />
            </div>
            <div className="card-content-compact">
              <div className="card-label">습도</div>
              <div className="card-value-compact">
                <span className="main-value">{humidity}</span>
                <span className="value-unit">%</span>
              </div>
              <div className="progress-bar-container-compact">
                <div 
                  className="progress-bar-fill humidity" 
                  style={{ width: `${humidity}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 가축 감지 카드 */}
          <div className="dashboard-card-compact detection-card">
            <div className="card-icon-compact">
              <img src={getHumanDetectionIcon()} alt="human-detection" />
            </div>
            <div className="card-content-compact">
              <div className="card-label">가축 감지</div>
              <div className="card-status">
                <span className={`status-text ${getHumanDetectionStyle()}`}>
                  {humanDetected ? '감지됨' : '감지 안됨'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 중간: 기기 제어 */}
        <div className="control-column">
          <h3 className="column-title">
            <img src="/assets/icons/device-control.svg" alt="device-control" className="section-icon" />
            기기 제어
          </h3>
          
          <div className="control-buttons">
            {/* 시작/일시정지 버튼 */}
            <button 
              onClick={handleDeviceToggle}
              disabled={isLoading}
              className={`control-button-large ${isRunning ? 'pause-button' : 'start-button'} ${isLoading ? 'loading' : ''}`}
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
              className="stop-button-large"
              onClick={handleEmergencyStop}
              disabled={isLoading}
            >
              <img src="/assets/icons/stop.svg" alt="stop" className="button-icon" />
              <span>긴급 정지</span>
            </button>
          </div>
        </div>

        {/* 오른쪽: 분사 모드 */}
        <div className="mode-column">
          <h3 className="column-title">
            <img src="/assets/icons/tracking-control.svg" alt="tracking-control" className="section-icon" />
            분사 모드
          </h3>
          
          <div className="mode-selector">
            <div className="mode-buttons">
              {['자동', '수동'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleTrackingModeChange(mode)}
                  disabled={isLoading}
                  className={`mode-button ${
                    mode === '자동' && selectedMode === mode ? 'active-blue' :
                    mode === '수동' && selectedMode === mode ? 'active-white' :
                    'inactive'
                  }`}
                >
                  {mode === '자동' ? '자동' : '수동'}
                </button>
              ))}
            </div>
            
            {/* 모드 설명 */}
            <div className="mode-description">
              {selectedMode === '자동' && (
                <p>🌡️ 가축 감지 + 22도 이상 구역에 10초 분사</p>
              )}
              {selectedMode === '수동' && (
                <p>👆 순찰 중 클릭한 구역에 10초 분사</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;