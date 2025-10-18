import React from 'react';
import '../../styles/tabs/VisualizationTab.css';

const VisualizationTab = ({
  selectedMode,
  humanDetected,
  direction,
  distance,
  isRunning,
  isConnected,
  manualTargetGrid,
  patrolCurrentGrid,
  gridTemperatures,
  GRID_POSITIONS,
  handleGridClick,
  getDevicePositionByMode,
  shouldShowTarget,
  shouldShowGridOverlay
}) => {

  // 격자 오버레이 컴포넌트 - 수동 모드에서만 표시
  const GridOverlay = () => {
    if (selectedMode !== '수동') return null;
    
    return (
      <div className="grid-overlay">
        {GRID_POSITIONS.map((grid, index) => (
          <div
            key={index}
            className={`grid-cell ${manualTargetGrid === index ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              top: `${(grid.row * 33.33)}%`,
              left: `${(grid.col * 33.33)}%`,
              width: '33.33%',
              height: '33.33%',
              cursor: 'pointer'  // 추가
            }}
            onClick={() => handleGridClick(index)}
          >
            <div style={{ textAlign: 'center' }}>
              {grid.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 온도 오버레이 컴포넌트 - 항상 표시
  const GridTemperatureOverlay = () => {
    return (
      <div className="temperature-overlay">
        {GRID_POSITIONS.map((grid, index) => {
          const temp = gridTemperatures[index];
          const isCurrentGrid = patrolCurrentGrid === index;
          const isHotZone = temp >= 25; // 25도 이상인 구역
          
          return (
            <div
              key={index}
              className={`temp-display ${isCurrentGrid ? 'measuring' : ''} ${isHotZone ? 'hot-zone' : ''}`}
              style={{
                position: 'absolute',
                top: `${(grid.row * 33.33) + 5}%`,
                left: `${(grid.col * 33.33) + 5}%`,
                width: '23.33%',
                height: '23.33%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: temp ? getTempColor(temp) : 'rgba(200, 200, 200, 0.3)',
                border: isCurrentGrid ? '3px solid #f59e0b' : isHotZone ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease'
              }}
            >
              {temp ? (
                <>
                  <div className="temp-value">{temp}°C</div>
                  <div className="temp-status" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                    {getTempStatusText(temp)}
                  </div>
                  {/* 자동 모드에서 25도 이상이면 분사 표시 */}
                  {selectedMode === '자동' && isHotZone && isCurrentGrid && (
                    <div className="auto-spray-icon">💨</div>
                  )}
                </>
              ) : (
                <div className="temp-placeholder">측정중...</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 온도 상태 텍스트 반환 함수
  const getTempStatusText = (temperature) => {
    if (temperature < 24) return '시원';
    if (temperature < 25) return '적정';
    if (temperature < 27) return '따뜻';
    if (temperature < 30) return '더움';
    return '매우더움';
  };

  // 온도에 따른 색상 결정 함수
  const getTempColor = (temperature) => {
    if (temperature < 24) return 'rgba(59, 130, 246, 0.8)'; // 파란색 (시원)
    if (temperature < 25) return 'rgba(34, 197, 94, 0.8)'; // 초록색 (적정)
    if (temperature < 27) return 'rgba(251, 191, 36, 0.8)'; // 노란색 (따뜻)
    if (temperature < 30) return 'rgba(239, 68, 68, 0.8)'; // 빨간색 (더움)
    return 'rgba(153, 27, 27, 0.8)'; // 진한 빨간색 (매우 더움)
  };

  // 쿨링포그 장치의 방향 계산 함수
  const getDeviceOrientation = (direction) => {
    const rotations = {
      '북쪽': 0,
      '북동쪽': 45,
      '동쪽': 90,
      '남동쪽': 135,
      '남쪽': 180,
      '남서쪽': 225,
      '서쪽': 270,
      '북서쪽': 315
    };
    
    return rotations[direction] || 0;
  };

  // 쿨링포그 회전
  const getDeviceTransform = () => {
    return 'translate(-50%, 50%)';
  };

  // 모드별 설명 텍스트
  const getModeDescription = () => {
    if (selectedMode === '자동') {
      return '순찰 중 - 25도 이상 구역에 자동 분사';
    } else if (selectedMode === '수동') {
      return '순찰 중 - 클릭한 구역에만 분사';
    }
    return '대기 중';
  };

  return (
    <div className="tab-content">
      {/* 모드 설명 배너 */}
      <div className="mode-description-banner" style={{
        backgroundColor: selectedMode === '자동' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '0.5rem',
        border: `1px solid ${selectedMode === '자동' ? '#3b82f6' : '#f97316'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>
            {selectedMode === '자동' ? '🌡️' : '👆'}
          </span>
          <span style={{ fontWeight: 'bold', color: selectedMode === '자동' ? '#3b82f6' : '#f97316' }}>
            {getModeDescription()}
          </span>
        </div>
      </div>

      <div className="visualization-content">
        {/* 좌측: 레이더뷰 */}
        <div className="radar-section">
          <h4>구역별 온도 측정</h4>
          
          <div className="radar-feed">
            <div className="radar-chart">
              <div className="radar-grid">
                <div className="grid-line vertical-1"></div>
                <div className="grid-line vertical-2"></div>
                <div className="grid-line horizontal-1"></div>
                <div className="grid-line horizontal-2"></div>
                
                {/* 수동 모드에서만 클릭 가능한 격자 표시 */}
                <GridOverlay />
                
                {/* 온도 오버레이는 항상 표시 */}
                <GridTemperatureOverlay />
                
                <div 
                  className="radar-device"
                  style={getDevicePositionByMode()}
                ></div>
              </div>
              
              <div className="radar-directions">
                <div className="direction north">N</div>
                <div className="direction east">E</div>
                <div className="direction south">S</div>
                <div className="direction west">W</div>
              </div>
            </div>
          </div>
          
          <div className="radar-info">
            <div className="radar-legend">
              <div className="legend-item">
                <div className="legend-dot device"></div>
                <span>쿨링포그 장치</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{backgroundColor: '#ef4444'}}></div>
                <span>25도 이상 (고온)</span>
              </div>
              {selectedMode === '수동' && (
                <div className="legend-item">
                  <div className="legend-dot blue"></div>
                  <span>클릭하여 분사</span>
                </div>
              )}
              {selectedMode === '자동' && (
                <div className="legend-item">
                  <span>💨 자동 분사 중</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 카메라 피드 */}
        <div className="camera-section">
          <h4>카메라 피드</h4>
          <div className="camera-feed">
            <div className="camera-placeholder">
              <div>📹</div>
              <div>카메라 연결 대기중</div>
              <div style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>
                실시간 영상이 여기에 표시됩니다
              </div>
            </div>
          </div>
          
          <div className="camera-info">
            <div className="camera-status">
              <span>연결 상태:</span>
              <span style={{color: isConnected ? '#10b981' : '#ef4444'}}>
                {isConnected ? '연결됨' : '연결 끊김'}
              </span>
            </div>
            <div className="camera-status">
              <span>현재 구역:</span>
              <span style={{color: '#3b82f6'}}>
                {patrolCurrentGrid !== null ? GRID_POSITIONS[patrolCurrentGrid]?.name : '대기중'}
              </span>
            </div>
            <div className="camera-status">
              <span>현재 온도:</span>
              <span style={{color: gridTemperatures[patrolCurrentGrid] >= 25 ? '#ef4444' : '#10b981'}}>
                {patrolCurrentGrid !== null && gridTemperatures[patrolCurrentGrid] 
                  ? `${gridTemperatures[patrolCurrentGrid]}°C` 
                  : '---'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationTab;