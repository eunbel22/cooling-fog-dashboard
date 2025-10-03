import React from 'react';
import '../../styles/tabs/ScheduleTab.css';

const ScheduleTab = ({
  schedules,
  schedulerEnabled,
  setSchedulerEnabled,
  lastScheduleCheck,
  activeSchedules,
  toggleScheduleStatus,
  openEditScheduleModal,
  handleDeleteSchedule,
  openNewScheduleModal
}) => {
  
  // 스케줄러 상태 표시 컴포넌트
  const ScheduleStatus = () => {
    return (
      <div className="schedule-status">
        <div className="scheduler-header">
          <h4>스케줄 자동화</h4>
          <label className="scheduler-toggle">
            <input
              type="checkbox"
              checked={schedulerEnabled}
              onChange={(e) => setSchedulerEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {schedulerEnabled ? '활성' : '비활성'}
            </span>
          </label>
        </div>
        
        {schedulerEnabled && (
          <>
            <div className="current-status">
              <span className="status-label">마지막 확인:</span>
              <span className="status-time">
                {lastScheduleCheck ? lastScheduleCheck.toLocaleTimeString('ko-KR') : '대기중'}
              </span>
            </div>
            
            {activeSchedules.length > 0 ? (
              <div className="active-schedule-info">
                <div className="active-schedule-header">현재 활성 스케줄</div>
                {activeSchedules.map(schedule => (
                  <div key={schedule.id} className="active-schedule-item">
                    <div className="schedule-name">{schedule.title}</div>
                    <div className="schedule-details-mini">
                      <span>모드: {schedule.mode}</span>
                      <span>시간: {schedule.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-active-schedule">현재 활성 스케줄 없음</div>
            )}
          </>
        )}
      </div>
    );
  };


  // 수동 제어 경고 표시
  const ManualControlWarning = () => {
    if (activeSchedules.length === 0 || !schedulerEnabled) return null;
    
    return (
      <div className="manual-control-warning">
        <div className="warning-icon">⚠️</div>
        <div className="warning-text">
          <strong>스케줄 실행 중</strong><br />
          수동 조작시 스케줄 설정이 우선 적용될 수 있습니다.
        </div>
        <button 
          className="disable-scheduler-btn"
          onClick={() => setSchedulerEnabled(false)}
        >
          스케줄러 일시 중지
        </button>
      </div>
    );
  };

  return (
    <div className="tab-content">
      {/* 스케줄 자동화 상태 */}
      <ScheduleStatus />
      
      {/* 2열 레이아웃: 좌측 새 스케줄 버튼, 우측 스케줄 목록 */}
      <div className="schedule-management-layout">
        {/* 좌측: 스케줄 관리 제목과 새 스케줄 버튼 */}
        <div className="schedule-sidebar">
          <h3 className="schedule-main-title">
            <img src="/assets/icons/schedule-management.svg" alt="schedule-management" className="section-icon" />
            스케줄 관리
          </h3>
          <button className="add-schedule-button-sidebar" onClick={openNewScheduleModal}>
            + 새 스케줄
          </button>
        </div>

        {/* 우측: 스케줄 목록 */}
        <div className="schedule-content">
          <div className="schedule-list">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="schedule-item">
                <div className="schedule-content-row">
                  {/* 좌측: 제목과 상태 */}
                  <div className="schedule-left">
                    <div className="schedule-title-with-status">
                      <span className="schedule-title-text">{schedule.title}</span>
                      <span className={`schedule-status ${schedule.isActive ? 'active' : 'inactive'}`}>
                        {schedule.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="schedule-details-inline">
                      <img src="/assets/icons/time.svg" alt="time" className="inline-icon" />
                      <span>{schedule.time}</span>
                      <span>모드: {schedule.mode}</span>
                    </div>
                    <div className="schedule-repeat-inline">반복: {schedule.repeat}</div>
                  </div>

                  {/* 우측: 액션 버튼들 */}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTab;