import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState('대시보드');
  const [temperature, setTemperature] = useState(28.5);
  const [humidity, setHumidity] = useState(65);
  const [battery, setBattery] = useState(85);
  const [waterTank, setWaterTank] = useState(70);
  const [mistLevel, setMistLevel] = useState(40);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMode, setSelectedMode] = useState('자동');

  // 상태 카드 컴포넌트 (상단 4개)
  const StatusCard = ({ title, value, unit, icon, showProgress, progressColor = 'blue' }) => (
    <div className="status-card">
      <div className="status-card-header">
        <span className="status-card-title">{title}</span>
        <div className="status-card-icon">
          <span>{icon}</span>
        </div>
      </div>
      <div className="status-card-value">
        <span className="value">{value}</span>
        <span className="unit">{unit}</span>
      </div>
      {showProgress && (
        <div className="progress-container">
          <div 
            className={`progress-bar ${progressColor}`}
            style={{ width: `${value}%` }}
          ></div>
        </div>
      )}
    </div>
  );

  // 하단 정보 카드 컴포넌트
  const InfoCard = ({ title, value, unit, icon }) => (
    <div className="info-card">
      <div className="info-card-header">
        <span className="info-card-title">{title}</span>
        <div className="info-card-icon">
          <span>{icon}</span>
        </div>
      </div>
      <div className="info-card-value">
        <span className="value">{value}</span>
        <span className="unit">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* 헤더 */}
        <div className="header">
          <div className="header-left">
            <div className="app-icon">
              <span>❄️</span>
            </div>
            <div className="app-info">
              <h1>CoolingFog Pro</h1>
              <p>스마트 가습기 제어 시스템</p>
            </div>
          </div>
          <div className="header-right">
            <span>연결됨</span>
            <div className="status-dot"></div>
            <span className="time">8시</span>
          </div>
        </div>

<<<<<<< Updated upstream
        {/* 상단 상태 카드들 (4개) */}
        <div className="status-grid">
          <StatusCard 
            title="온도" 
            value="28.5" 
            unit="°C" 
            icon="🌡️"
          />
          <StatusCard 
            title="습도" 
            value="65" 
            unit="%" 
            icon="💧"
            showProgress={true}
            progressColor="blue"
          />
          <StatusCard 
            title="배터리" 
            value="85" 
            unit="%" 
            icon="🔋"
            showProgress={true}
            progressColor="blue"
          />
          <StatusCard 
            title="물탱크" 
            value="70" 
            unit="%" 
            icon="💧"
            showProgress={true}
            progressColor="purple"
          />
        </div>

        {/* 하단 정보 카드들 (4개) */}
        <div className="info-grid">
          <InfoCard 
            title="분사 강도" 
            value="40" 
            unit="%" 
            icon="🌊"
          />
          <InfoCard 
            title="안개 온도" 
            value="감지됨" 
            unit="" 
            icon="👤"
          />
          <InfoCard 
            title="거리 방향" 
            value="2.3" 
            unit="m 좋음" 
            icon="📍"
          />
          <InfoCard 
            title="안전 상태" 
            value="안전" 
            unit="" 
            icon="🛡️"
          />
        </div>

        {/* 기기 제어 섹션 */}
        <div className="control-section">
          <h3>⚙️ 기기 제어</h3>
          
          <div className="control-content">
            {/* 시작 버튼 */}
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className="start-button"
            >
              <span>▶️</span>
              <span>시작</span>
            </button>

            {/* 분사 강도 조절 */}
            <div className="slider-container">
              <div className="slider-header">
                <span>분사 강도: {mistLevel}%</span>
              </div>
              <div className="slider-wrapper">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mistLevel}
                  onChange={(e) => setMistLevel(e.target.value)}
                  className="slider"
                />
                <div className="slider-label">짧음</div>
              </div>
=======

        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          {['대시보드', '제어', '추적시각화', '스케줄 관리'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 탭별 컨텐츠 */}
        {activeTab === '대시보드' && (
          <div className="tab-content">
            {/* 상단 상태 카드들 */}
            <div className="status-grid-horizontal">
              <StatusCard 
                title="온도" 
                value="28.5" 
                unit="°C" 
                icon={<img src="/assets/icons/temperature.svg" alt="temperature" className="card-icon" />}
              />
              <StatusCard 
                title="습도" 
                value="65" 
                unit="%" 
                icon={<img src="/assets/icons/humidity.svg" alt="humidity" className="card-icon" />}
                showProgress={true}
                progressColor="blue"
              />
              <StatusCard 
                title="배터리" 
                value={battery} 
                unit="%" 
                icon={<img src="/assets/icons/battery.svg" alt="battery" className="card-icon" />}
                showProgress={true}
                progressColor="blue"
              />
              <StatusCard 
                title="물탱크" 
                value={waterTank} 
                unit="%" 
                icon={<img src="/assets/icons/water-tank-icon.svg" alt="water-tank" className="card-icon" />}
                showProgress={true}
                progressColor="purple"
              />
            </div>

            {/* 하단 정보 카드들 */}
            <div className="info-grid-horizontal">
              <InfoCard 
                title="분사 강도" 
                value={mistLevel} 
                unit="%" 
                icon={<img src="/assets/icons/Spray-sensitivity-icon.svg" alt="Spray-sensitivity" className="card-icon" />}
              />
              <InfoCard 
                title="인체 감지" 
                value={getHumanDetectionStatus()} 
                unit="" 
                icon={<img src="/assets/icons/people-icon.svg" alt="people" className="card-icon" />}
              />
              <InfoCard 
                title="거리 방향" 
                value={distance} 
                unit={`m ${direction}`} 
                icon={<img src="/assets/icons/street-direction-icon.svg" alt="street-direction" className="card-icon" />}
              />
              <InfoCard 
                title="안전 상태" 
                value="안전" 
                unit="" 
                icon={<img src="/assets/icons/safe-icon.svg" alt="safe" className="card-icon" />}
              />
>>>>>>> Stashed changes
            </div>

            {/* 긴급 정지 버튼 */}
            <button className="stop-button">
              <span>⏹️</span>
              <span>긴급 정지</span>
            </button>
          </div>
<<<<<<< Updated upstream
        </div>

        {/* 추적 제어 */}
        <div className="tracking-section">
          <h3>🎯 추적제어</h3>
          
          <div className="tracking-content">
            <div className="mode-selector">
              <span>추적 모드</span>
              <div className="mode-buttons">
                {['자동', '수동', '끄기'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`mode-button ${selectedMode === mode ? 'active' : ''}`}
                  >
                    {mode}
                  </button>
                ))}
=======
        )}

        {activeTab === '제어' && (
          <div className="tab-content">
            {/* 기기 제어와 추적 제어 - 같은 줄 */}
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
                    onClick={() => setIsRunning(!isRunning)}
                    className={`control-button ${isRunning ? 'pause-button' : 'start-button'}`}
                  >
                    {isRunning ? 
                      <img src="/assets/icons/pause.svg" alt="pause" className="button-icon" /> : 
                      <img src="/assets/icons/start.svg" alt="start" className="button-icon" />
                    }
                    <span>{isRunning ? '일시정지' : '시작'}</span>
                  </button>

                  {/* 분사 강도 조절 */}
                  <div className="slider-container-compact">
                    <div className="slider-header">
                      <span>분사 강도: {mistLevel}%</span>
                    </div>
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mistLevel}
                        onChange={(e) => setMistLevel(e.target.value)}
                        className="slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${mistLevel}%, #e5e7eb ${mistLevel}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* 긴급 정지 버튼 */}
                  <button 
                    className="stop-button-compact"
                    onClick={handleStopClick}
                  >
                    <img src="/assets/icons/stop.svg" alt="stop" className="button-icon" />
                    <span>긴급 정지</span>
                  </button>
                </div>
>>>>>>> Stashed changes
              </div>
            </div>

<<<<<<< Updated upstream
            <div className="recommendation">
              <p className="recommendation-title">추천사항</p>
              <p className="recommendation-content">
                현재 모드: 습제 모기<br />
                권장 시간: 1시간 이내 사용
              </p>
=======
              {/* 추적 제어 */}
              <div className="tracking-section-half">
                <h3>
                  <img src="/assets/icons/tracking-control.svg" alt="tracking-control" className="section-icon" />
                  추적제어
                </h3>
                
                <div className="tracking-content-vertical">
                  <div className="mode-selector-vertical">
                    <span>추적 모드</span>
                    <div className="mode-buttons-full">
                      {['자동', '수동', '끄기'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
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

                  <div className="tracking-status">
                    <p className="tracking-status-title">추적 상태</p>
                    <p className="tracking-status-content">
                      현재 모드: {selectedMode}<br />
                      안전거리: 1.0m 이상 유지
                    </p>
                  </div>
                </div>
              </div>
>>>>>>> Stashed changes
            </div>
          </div>
        )}

<<<<<<< Updated upstream
        {/* 추적 시각화 */}
        <div className="visualization-section">
          <h3>🚀 추적 시각화</h3>
          
          <div className="visualization-content">
            <div className="radar-container">
              <h4>레이더뷰</h4>
              <div className="radar-chart">
                <div className="radar-circles">
                  <div className="radar-circle outer"></div>
                  <div className="radar-circle middle"></div>
                  <div className="radar-circle inner"></div>
                  <div className="radar-center"></div>
                  <div className="radar-target"></div>
                </div>
                <div className="radar-direction">W</div>
              </div>
              <div className="radar-legend">
                <div className="legend-item">
                  <div className="legend-dot blue"></div>
                  <span>쿨링포그 장치</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot green"></div>
                  <span>추적대상</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot red"></div>
                  <span>안전구역</span>
                </div>
              </div>
            </div>
            
            <div className="tracking-info">
              <h4>추적 정보</h4>
              <div className="tracking-items">
                <div className="tracking-item">
                  <span>인체 감지</span>
                  <div className="tracking-value">
                    <span>2.3m</span>
                    <span className="status-good">켄저함</span>
=======
        {activeTab === '추적시각화' && (
          <div className="tab-content">
            {/* 레이더뷰 섹션 */}
            <div className="visualization-section">
              <h3>
                <img src="/assets/icons/tracking-visualization.svg" alt="tracking-visualization" className="section-icon" />
                레이더뷰
              </h3>
              <div className="radar-container-center">
                <div className="radar-chart">
                  <div className="radar-grid">
                    <div className="grid-line vertical-1"></div>
                    <div className="grid-line vertical-2"></div>
                    <div className="grid-line horizontal-1"></div>
                    <div className="grid-line horizontal-2"></div>
                    
                    <div className="radar-device"></div>
                    <div className="radar-target"></div>
                  </div>
                  <div className="radar-directions">
                    <div className="direction north">N</div>
                    <div className="direction east">E</div>
                    <div className="direction south">S</div>
                    <div className="direction west">W</div>
                  </div>
                </div>
                <div className="radar-legend">
                  <div className="legend-item">
                    <div className="legend-dot device"></div>
                    <span>쿨링포그 장치</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot green"></div>
                    <span>추적대상</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 추적 정보 섹션 */}
            <div className="tracking-info-section">
              <h3>
                <img src="/assets/icons/tracking-visualization.svg" alt="tracking-visualization" className="section-icon" />
                추적 정보
              </h3>
              <div className="tracking-sections-grid">
                
                {/* 인체 감지 섹션 */}
                <div className="tracking-section-box">
                  <div className="tracking-item">
                    <span>인체 감지</span>
                    <div className="tracking-value">
                      <span className="person-icon">👤</span>
                      <span className={getHumanDetectionStyle()}>{getHumanDetectionStatus()}</span>
                    </div>
>>>>>>> Stashed changes
                  </div>
                </div>
                <div className="progress-container">
                  <div className="progress-bar green" style={{ width: '70%' }}></div>
                </div>
                
                <div className="tracking-item">
                  <span>거리</span>
                  <span>4%</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar gray" style={{ width: '4%' }}></div>
                </div>
                
                <div className="tracking-item">
                  <span>방향</span>
                  <span>양호</span>
                </div>
                
                <div className="tracking-item">
                  <span>분사상태</span>
                  <div className="tracking-value">
                    <span>양호</span>
                    <span className="status-normal">양호</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

<<<<<<< Updated upstream
        {/* 스케줄 관리 */}
        <div className="schedule-section">
          <div className="schedule-header">
            <h3>📅 스케줄 관리</h3>
            <button className="add-schedule-button">+ 새 스케줄</button>
          </div>
          
          <div className="schedule-list">
            <div className="schedule-item">
              <div className="schedule-title">
                <span>오후 룰링 타임</span>
                <span className="schedule-status active">동작</span>
              </div>
              <div className="schedule-details">
                <span>🕐 오후 11:00 - 오전 01:00</span>
                <span>강도: 80%</span>
                <span>모드: 자동</span>
              </div>
              <div className="schedule-repeat">반복: 화, 수, 목금</div>
              <div className="schedule-actions">
                <button>🟢</button>
                <button>✏️</button>
                <button>🗑️</button>
              </div>
            </div>
            
            <div className="schedule-item">
              <div className="schedule-title">
                <span>저녁 휴식 시간</span>
                <span className="schedule-status active">동작</span>
              </div>
              <div className="schedule-details">
                <span>🕐 오전 04:00 - 오전 06:00</span>
                <span>강도: 60%</span>
                <span>모드: 수동</span>
              </div>
              <div className="schedule-repeat">반복: 토, 일</div>
              <div className="schedule-actions">
                <button>🟢</button>
                <button>✏️</button>
                <button>🗑️</button>
=======
        {activeTab === '스케줄 관리' && (
          <div className="tab-content">
            {/* 스케줄 관리 */}
            <div className="schedule-section">
              <div className="schedule-header">
                <h3>
                  <img src="/assets/icons/schedule-management.svg" alt="schedule-management" className="section-icon" />
                  스케줄 관리
                </h3>
                <button className="add-schedule-button" onClick={openNewScheduleModal}>+ 새 스케줄</button>
              </div>
              
              <div className="schedule-list">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="schedule-item">
                    <div className="schedule-title">
                      <span>{schedule.title}</span>
                      <span className={`schedule-status ${schedule.isActive ? 'active' : 'inactive'}`}>
                        {schedule.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="schedule-details">
                      <span>
                        <img src="/assets/icons/time.svg" alt="time" className="inline-icon" />
                        {schedule.time}
                      </span>
                      <span>강도: {schedule.intensity}</span>
                      <span>모드: {schedule.mode}</span>
                    </div>
                    <div className="schedule-repeat">반복: {schedule.repeat}</div>
                    <div className="schedule-actions">
                      <button onClick={() => toggleScheduleStatus(schedule.id)}>
                        <img 
                          src="/assets/icons/power.svg" 
                          alt="power" 
                          className={`action-icon ${schedule.isActive ? 'power-active' : 'power-inactive'}`} 
                        />
                      </button>
                      <button onClick={() => openEditScheduleModal(schedule)}>
                        <img src="/assets/icons/edit.svg" alt="edit" className="action-icon" />
                      </button>
                      <button onClick={() => handleDeleteSchedule(schedule.id)}>
                        <img src="/assets/icons/delete.svg" alt="delete" className="action-icon" />
                      </button>
                    </div>
                  </div>
                ))}
>>>>>>> Stashed changes
              </div>
            </div>
          </div>
        )}



        {/* 하단 정보 */}
        <div className="footer-section">
          <div className="footer-grid">
            <div className="footer-column">
              <h4>📞 고객지원</h4>
              <div className="footer-content">
                <p>📱 1588-1234</p>
                <p>✉️ support@coolingfog.com</p>
                <p>⏰ 평일 09:00 - 18:00</p>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>❓ 도움말</h4>
              <div className="footer-content">
                <p>사용자 매뉴얼</p>
                <p>자주 묻는 질문</p>
                <p>문제 해결 가이드</p>
                <p>원격지원 요청</p>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>🔒 정책 및 정보</h4>
              <div className="footer-content">
                <p>📋 개인정보처리방침</p>
                <p>📜 이용약관</p>
                <p>⭕ 안전 사용 가이드</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;