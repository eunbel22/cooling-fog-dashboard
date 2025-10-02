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

  // 격자 오버레이 컴포넌트
  const GridOverlay = () => {
    if (!shouldShowGridOverlay()) return null;
    
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
              height: '33.33%'
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

  // 온도 오버레이 컴포넌트
  const GridTemperatureOverlay = () => {
    if (selectedMode !== '끄기') return null;
    
    return (
      <div className="temperature-overlay">
        {GRID_POSITIONS.map((grid, index) => {
          const temp = gridTemperatures[index];
          const isCurrentGrid = patrolCurrentGrid === index;
          
          return (
            <div
              key={index}
              className={`temp-display ${isCurrentGrid ? 'measuring' : ''}`}
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
                border: isCurrentGrid ? '3px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.5)',
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
    if (temperature < 27) return '적정';
    if (temperature < 30) return '따뜻';
    return '더움';
  };

  // 온도에 따른 색상 결정 함수
  const getTempColor = (temperature) => {
    if (temperature < 24) return 'rgba(59, 130, 246, 0.8)'; // 파란색 (시원)
    if (temperature < 27) return 'rgba(34, 197, 94, 0.8)'; // 초록색 (적정)
    if (temperature < 30) return 'rgba(251, 191, 36, 0.8)'; // 노란색 (따뜻)
    if (temperature < 33) return 'rgba(239, 68, 68, 0.8)'; // 빨간색 (더움)
    return 'rgba(153, 27, 27, 0.8)'; // 진한 빨간색 (매우 더움)
  };

   // 방향에 따른 추적대상 위치 계산 함수 수정 - 경계 제한 추가
  const getTargetPosition = (direction, distance) => {
    const maxDistance = 1.5; // 1.0m → 1.5m로 변경
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const gridSize = 70; // 15%부터 85%까지가 실제 1m 범위
    const actualMovement = normalizedDistance * (gridSize / 2); // 최대 35% 이동
    
    const positions = {
      '북쪽': { 
        top: `${Math.max(15, 50 - actualMovement)}%`,
        left: '50%' 
      },
      '남쪽': { 
        top: `${Math.min(85, 50 + actualMovement)}%`,
        left: '50%' 
      },
      '동쪽': { 
        top: '50%', 
        left: `${Math.min(85, 50 + actualMovement)}%`
      },
      '서쪽': { 
        top: '50%', 
        left: `${Math.max(15, 50 - actualMovement)}%`
      },
      '북동쪽': { 
        top: `${Math.max(15, 50 - actualMovement * 0.707)}%`,  // cos(45°) ≈ 0.707
        left: `${Math.min(85, 50 + actualMovement * 0.707)}%` 
      },
      '북서쪽': { 
        top: `${Math.max(15, 50 - actualMovement * 0.707)}%`, 
        left: `${Math.max(15, 50 - actualMovement * 0.707)}%` 
      },
      '남동쪽': { 
        top: `${Math.min(85, 50 + actualMovement * 0.707)}%`, 
        left: `${Math.min(85, 50 + actualMovement * 0.707)}%` 
      },
      '남서쪽': { 
        top: `${Math.min(85, 50 + actualMovement * 0.707)}%`, 
        left: `${Math.max(15, 50 - actualMovement * 0.707)}%` 
      },
      '중앙': {
        top: '50%',
        left: '50%'
      }
    };
    
    return positions[direction] || { top: '50%', left: '50%' };
  };


    // 3. 거리 유효성 검증 함수 추가
  const validateDistance = (distance, direction) => {
    // 방향별 최대 가능 거리 계산
    const maxDistances = {
      '북쪽': 0.5,      // 중심에서 북쪽 격자 끝까지
      '남쪽': 0.5,
      '동쪽': 0.5,
      '서쪽': 0.5,
      '북동쪽': 0.707,  // 대각선 (√2/2 ≈ 0.707)
      '북서쪽': 0.707,
      '남동쪽': 0.707,
      '남서쪽': 0.707,
      '중앙': 0
    };
    
    const maxPossible = maxDistances[direction] || 0.5;
    return Math.min(distance, maxPossible);
  };

  // 4. 거리 표시 정확성 개선 - 추적 정보 섹션
  const getAccurateDistanceDisplay = () => {
    if (!humanDetected || selectedMode === '끄기') {
      return { distance: '---', showProgress: false };
    }
    
    // 거리 유효성 검증
    const validatedDistance = validateDistance(distance, direction);
    
    return {
      distance: validatedDistance,
      showProgress: true,
      progressWidth: Math.min((validatedDistance / 1.5) * 100, 100)
    };
  };

  // 5. 레이더 차트 범례에 거리 스케일 추가
  const RadarDistanceScale = () => {
    return (
      <div className="radar-distance-scale">
        <div className="scale-title">거리 스케일</div>
        <div className="scale-marks">
          <div className="scale-mark">
            <div className="mark-line" style={{width: '23%'}}></div>
            <span>0.5m</span>
          </div>
          <div className="scale-mark">
            <div className="mark-line" style={{width: '47%'}}></div>
            <span>1.0m</span>
          </div>
          <div className="scale-mark">
            <div className="mark-line" style={{width: '70%'}}></div>
            <span>1.5m</span>
          </div>
        </div>
      </div>
    );
  };

  // 6. 거리 정보 표시 개선
  const DistanceInfoCard = () => {
    const distanceInfo = getAccurateDistanceDisplay();
    
    if (!distanceInfo.showProgress) {
      return (
        <div className="tracking-section-box">
          <div className="tracking-item">
            <span>상태</span>
            <span className="no-target-message">추적 대상 없음</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="tracking-section-box">
        <div className="tracking-item">
          <span>거리</span>
          <span className="distance-value">{distanceInfo.distance}m</span>
        </div>
        <div className="progress-container">
          <div 
            className="progress-bar green" 
            style={{ 
              width: `${distanceInfo.progressWidth}%`
            }}
          ></div>
        </div>
        {/* 거리 정확성 표시 */}
        <div className="distance-accuracy">
          <span className="accuracy-label">
            {distanceInfo.distance < 0.3 ? '⚠️ 너무 가까움' : 
            distanceInfo.distance < 0.8 ? '✅ 적정 거리' : 
            '📡 추적 중'}
          </span>
        </div>
      </div>
    );
  };

  // 쿨링포그 회전도 인체 감지 상태에 따라 조정
  const getDeviceTransform = () => {
    if (selectedMode === '자동' && humanDetected) {
      return `translate(-50%, 50%) rotate(${getDeviceOrientation(direction)}deg)`;
    } else {
      return 'translate(-50%, 50%)'; // 인체 미감지시 회전 없음
    }
  };

  // 쿨링포그 장치의 방향 계산 함수 추가
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

  // 자동 분사 로직 추가 - 인체 감지와 거리에 따른 자동 분사
  const shouldAutoSpray = () => {
    if (selectedMode === '자동' && humanDetected && isRunning) {
      return distance <= 1.5; // 1.5m 이내에 있을 때만 분사
    }
    return false;
  };

  // 추적 정보 섹션에서 거리와 방향은 인체 감지시에만 의미있음
  const getTrackingInfo = () => {
    if (!humanDetected && selectedMode !== '끄기') {
      return {
        distance: '---',
        direction: '---',
        showProgress: false
      };
    }
    return {
      distance: distance,
      direction: direction,
      showProgress: true
    };
  };

 
  return (
    <div className="tab-content">
      <div className="visualization-content">
        {/* 좌측: 레이더뷰 */}
        <div className="radar-section">
          <h4>{selectedMode === '끄기' ? '구역별 온도 측정' : '레이더뷰'}</h4>
          
          <div className="radar-feed">
            <div className="radar-chart">
              <div className="radar-grid">
                <div className="grid-line vertical-1"></div>
                <div className="grid-line vertical-2"></div>
                <div className="grid-line horizontal-1"></div>
                <div className="grid-line horizontal-2"></div>
                
                <GridOverlay />
                <GridTemperatureOverlay />
                
                <div 
                  className="radar-device"
                  style={{
                    ...getDevicePositionByMode(),
                    transform: getDeviceTransform()
                  }}
                >
                  {shouldAutoSpray() && (
                    <div className="auto-spray-indicator">💨</div>
                  )}
                </div>
                
                {shouldShowTarget(humanDetected) && (
                  <div 
                    className="radar-target"
                    style={{
                      ...getTargetPosition(direction, distance),
                      transform: 'translate(-50%, -50%)',
                      transition: 'all 0.5s ease',
                      opacity: humanDetected ? 1 : 0
                    }}
                  ></div>
                )}
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
              {shouldShowTarget(humanDetected) && (
                <div className="legend-item">
                  <div className="legend-dot green"></div>
                  <span>추적대상</span>
                </div>
              )}
              {selectedMode === '수동' && (
                <div className="legend-item">
                  <div className="legend-dot blue"></div>
                  <span>클릭 가능 구역</span>
                </div>
              )}
              {selectedMode === '끄기' && (
                <div className="legend-item">
                  <div className="legend-dot orange"></div>
                  <span>측정 구역</span>
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
              <span>인체 감지:</span>
              <span style={{color: humanDetected ? '#10b981' : '#6b7280'}}>
                {humanDetected ? '감지됨' : '감지 안됨'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationTab;