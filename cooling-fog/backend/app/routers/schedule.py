from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import time as dt_time
from app.database import get_db
from app.models.schedule import Schedule

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

class ScheduleCreate(BaseModel):
    title: str
    start_time: str  # "09:00" 형식
    end_time: str    # "17:00" 형식
    days_of_week: List[int]  # [1,2,3,4,5] (월-금)
    mode: str
    is_active: bool = True

class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days_of_week: Optional[List[int]] = None
    mode: Optional[str] = None
    is_active: Optional[bool] = None

def parse_time(time_str: str) -> dt_time:
    """문자열 시간을 time 객체로 변환"""
    hour, minute = map(int, time_str.split(':'))
    return dt_time(hour=hour, minute=minute)

def format_schedule(schedule: Schedule) -> dict:
    """Schedule 모델을 딕셔너리로 변환"""
    return {
        "id": schedule.id,
        "title": schedule.title,
        "start_time": schedule.start_time.strftime("%H:%M"),
        "end_time": schedule.end_time.strftime("%H:%M"),
        "days_of_week": schedule.days_of_week,
        "mode": schedule.mode,
        "is_active": schedule.is_active
    }

@router.get("/")
def get_schedules(db: Session = Depends(get_db)):
    """모든 스케줄 조회"""
    schedules = db.query(Schedule).all()
    formatted_schedules = [format_schedule(s) for s in schedules]
    return {"schedules": formatted_schedules}

@router.post("/")
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    """새 스케줄 생성"""
    try:
        new_schedule = Schedule(
            device_id="cooling-fog-001",
            title=schedule.title,
            start_time=parse_time(schedule.start_time),
            end_time=parse_time(schedule.end_time),
            days_of_week=schedule.days_of_week,
            mode=schedule.mode,
            is_active=schedule.is_active
        )
        
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)
        
        return {
            "message": "스케줄 생성됨",
            "schedule": format_schedule(new_schedule)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"스케줄 생성 실패: {str(e)}")

@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, schedule: ScheduleUpdate, db: Session = Depends(get_db)):
    """스케줄 수정"""
    db_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not db_schedule:
        raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")
    
    try:
        update_data = schedule.dict(exclude_unset=True)
        
        # 시간 문자열을 time 객체로 변환
        if "start_time" in update_data:
            update_data["start_time"] = parse_time(update_data["start_time"])
        if "end_time" in update_data:
            update_data["end_time"] = parse_time(update_data["end_time"])
        
        for key, value in update_data.items():
            setattr(db_schedule, key, value)
        
        db.commit()
        db.refresh(db_schedule)
        
        return {
            "message": "스케줄 업데이트됨",
            "schedule": format_schedule(db_schedule)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"스케줄 수정 실패: {str(e)}")

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """스케줄 삭제"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")
    
    try:
        db.delete(schedule)
        db.commit()
        return {"message": "스케줄 삭제됨", "schedule_id": schedule_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"스케줄 삭제 실패: {str(e)}")

@router.get("/{schedule_id}")
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """특정 스케줄 조회"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")
    
    return {"schedule": format_schedule(schedule)}