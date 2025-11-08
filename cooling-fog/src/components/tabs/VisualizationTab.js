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
  isSpraying,
  handleGridClick,
  getDevicePositionByMode,
  shouldShowTarget,
  shouldShowGridOverlay
}) => {

  // 온도 표시 영역 - 수동 모드에서 클릭 가능
  const GridTemperatureOverlay = () => {
    const isManualMode = selectedMode === '수동';
    
    return (
      <div 
        className="temperature-overlay"
        style={{
          pointerEvents: 'none', // 부모는 클릭 차단
          zIndex: isManualMode ? 100 : 4 // 수동 모드에서 높게, 하지만 장치(1000)보다는 낮게
        }}
      >
        {GRID_POSITIONS.map((grid, index) => {
          const temp = gridTemperatures[index];
          const isCurrentGrid = patrolCurrentGrid === index;
          const isHotZone = temp >= 22; // 22도 이상인 구역
          const isSprayingHere = isSpraying && isCurrentGrid; // 현재 구역에서 분사 중
          const isSelected = manualTargetGrid === index;
          
          return (
            <div
              key={index}
              className={`temp-display ${isCurrentGrid ? 'measuring' : ''} ${isHotZone ? 'hot-zone' : ''} ${isSprayingHere ? 'spraying' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                top: `${(grid.row * 20) + 2}%`,
                left: `${(grid.col * 20) + 2}%`,
                width: '16%',
                height: '16%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: temp ? getTempColor(temp) : 'rgba(200, 200, 200, 0.3)',
                border: isSelected ? '4px solid #3b82f6' : 
                        isSprayingHere ? '4px solid #10b981' : 
                        isCurrentGrid ? '3px solid #f59e0b' : 
                        isHotZone ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease',
                boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.6)' : 
                           isSprayingHere ? '0 0 20px rgba(16, 185, 129, 0.6)' : 'none',
                cursor: isManualMode ? 'pointer' : 'default',
                pointerEvents: isManualMode ? 'auto' : 'none', // 수동 모드에서만 클릭 가능
                zIndex: isManualMode ? 101 : 5 // 수동 모드에서 부모보다 높게, 하지만 장치보다는 낮게
              }}
              onMouseDown={(e) => {
                // mousedown 이벤트로 변경 (더 빠른 반응)
                if (isManualMode) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🖱️ 클릭됨: 구역 ${index} (${grid.name}), 현재 순찰 구역: ${patrolCurrentGrid}`);
                  handleGridClick(index);
                }
              }}
              onClick={(e) => {
                // onClick도 유지 (백업)
                if (isManualMode) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🖱️ onClick: 구역 ${index} (${grid.name})`);
                  handleGridClick(index);
                }
              }}
            >
              <div style={{ fontSize: '0.55rem', marginBottom: '0.2rem', opacity: 0.9 }}>
                {grid.name}
              </div>
              {temp ? (
                <>
                  <div className="temp-value">{temp}°C</div>
                  <div className="temp-status" style={{ fontSize: '0.55rem', marginTop: '2px' }}>
                    {getTempStatusText(temp)}
                  </div>
                  {/* 분사 중일 때 표시 */}
                  {isSprayingHere && (
                    <div className="spray-icon">💨</div>
                  )}
                  {/* 선택된 구역 표시 (수동 모드) */}
                  {isSelected && isManualMode && (
                    <div style={{ 
                      fontSize: '0.5rem', 
                      marginTop: '0.2rem', 
                      color: '#3b82f6', 
                      background: 'white', 
                      padding: '0.1rem 0.3rem', 
                      borderRadius: '0.2rem',
                      fontWeight: 'bold'
                    }}>
                      선택됨
                    </div>
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

 // 온도 상태 텍스트 반환 함수 (22도 기준)
  const getTempStatusText = (temperature) => {
    if (temperature < 20) return '시원';
    if (temperature < 22) return '적정';
    if (temperature < 24) return '따뜻';
    if (temperature < 26) return '더움';
    return '매우더움';
  };

  // 온도에 따른 색상 결정 함수 (22도 기준)
  const getTempColor = (temperature) => {
    if (temperature < 20) return 'rgba(59, 130, 246, 0.8)'; // 파란색 (시원)
    if (temperature < 22) return 'rgba(34, 197, 94, 0.8)'; // 초록색 (적정)
    if (temperature < 24) return 'rgba(251, 191, 36, 0.8)'; // 노란색 (따뜻)
    if (temperature < 26) return 'rgba(239, 68, 68, 0.8)'; // 빨간색 (더움)
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

  const getModeDescription = () => {
    if (selectedMode === '자동') {
      return '추적 중 - 가축 감지 시 22도 이상이면 자동분사';
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
                <div className="grid-line vertical-3"></div>
                <div className="grid-line vertical-4"></div>
                <div className="grid-line horizontal-1"></div>
                <div className="grid-line horizontal-2"></div>
                <div className="grid-line horizontal-3"></div>
                <div className="grid-line horizontal-4"></div>
                
                {/* 온도 표시 - 수동 모드에서 클릭 가능 */}
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
                <span>22도 이상 (고온)</span>
              </div>
              {isSpraying && (
                <div className="legend-item">
                  <div className="legend-dot" style={{backgroundColor: '#10b981'}}></div>
                  <span>💨 분사 중</span>
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
              <span>가축 감지:</span>
              <span style={{color: humanDetected ? '#10b981' : '#6b7280'}}>
                {humanDetected ? '감지됨' : '감지 안됨'}
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
              <span style={{color: gridTemperatures[patrolCurrentGrid] >= 22 ? '#ef4444' : '#10b981'}}>
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