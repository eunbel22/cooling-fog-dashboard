import React from 'react';
import '../../styles/tabs/DashboardTab.css';

const DashboardTab = ({ 
  temperature, 
  humidity, 
  waterTank, 
  humanDetected, 
  distance, 
  direction 
}) => {
  // 인체 감지 상태에 따른 아이콘 결정
  const getHumanDetectionIcon = () => {
    return humanDetected 
      ? "/assets/icons/people-icon (2).svg"
      : "/assets/icons/people-no-icon.svg";
  };

  const getHumanDetectionStyle = () => {
    return humanDetected ? 'status-good' : 'status-normal';
  };

  return (
    <div className={`tab-content ${waterTank <= 10 ? 'dashboard-danger' : ''}`}>
      {/* 안전상태 경고 알림 */}
      {waterTank <= 10 && (
        <div className="safety-alert">
          <strong>⚠️ 주의</strong> 물탱크 부족 ({waterTank}%) - 즉시 보충이 필요합니다
        </div>
      )}
      
      {/* 상태 카드들 - 5개 */}
      <div className="dashboard-grid">
        {/* 온도 카드 */}
        <div className="dashboard-card temperature-card">
          <div className="card-icon-large">
            <img src="/assets/icons/temperature.svg" alt="temperature" />
          </div>
          <div className="card-content">
            <div className="card-label">온도</div>
            <div className="card-value-large">
              <span className="main-value">{temperature}</span>
              <span className="value-unit">°C</span>
            </div>
          </div>
        </div>

        {/* 습도 카드 */}
        <div className="dashboard-card humidity-card">
          <div className="card-icon-large">
            <img src="/assets/icons/humidity.svg" alt="humidity" />
          </div>
          <div className="card-content">
            <div className="card-label">습도</div>
            <div className="card-value-large">
              <span className="main-value">{humidity}</span>
              <span className="value-unit">%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill humidity" 
                style={{ width: `${humidity}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 물탱크 카드 */}
        <div className="dashboard-card water-card">
          <div className="card-icon-large">
            <img src="/assets/icons/water-tank-icon.svg" alt="water-tank" />
          </div>
          <div className="card-content">
            <div className="card-label">물탱크</div>
            <div className="card-value-large">
              <span className="main-value">{waterTank}</span>
              <span className="value-unit">%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill water" 
                style={{ width: `${waterTank}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 인체 감지 카드 */}
        <div className="dashboard-card detection-card">
          <div className="card-icon-large">
            <img src={getHumanDetectionIcon()} alt="human-detection" />
          </div>
          <div className="card-content">
            <div className="card-label">인체 감지</div>
            <div className="card-status">
              <span className={`status-text ${getHumanDetectionStyle()}`}>
                {humanDetected ? '감지됨' : '감지 안됨'}
              </span>
            </div>
            <div className="detection-indicator">
              <div className={`detection-dot ${humanDetected ? 'active' : 'inactive'}`}></div>
            </div>
          </div>
        </div>

        {/* 거리 방향 카드 */}
        <div className="dashboard-card distance-card">
          <div className="card-icon-large">
            <img src="/assets/icons/street-direction-icon.svg" alt="direction" />
          </div>
          <div className="card-content">
            <div className="card-label">거리 방향</div>
            <div className="distance-info">
              <div className="distance-value-large">{distance}m</div>
              <div className="direction-value-large">{direction}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;