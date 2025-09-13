from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database import get_db

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

class ScheduleCreate(BaseModel):
    title: str
    start_time: str  # "09:00" 형식
    end_time: str    # "17:00" 형식
    days_of_week: List[int]  # [1,2,3,4,5] (월-금)
    intensity: int
    mode: str
    is_active: bool = True

class ScheduleUpdate(BaseModel):
    title: str = None
    start_time: str = None
    end_time: str = None
    days_of_week: List[int] = None
    intensity: int = None
    mode: str = None
    is_active: bool = None

# 임시 데이터 (나중에 데이터베이스로 대체)
fake_schedules = [
    {
        "id": 1,
        "title": "오후 쿨링 타임",
        "start_time": "23:00",
        "end_time": "01:00",
        "days_of_week": [2, 3, 4, 5],  # 화-금
        "intensity": 80,
        "mode": "자동",
        "is_active": True
    },
    {
        "id": 2,
        "title": "저녁 휴식 시간",
        "start_time": "04:00",
        "end_time": "06:00",
        "days_of_week": [6, 7],  # 토, 일
        "intensity": 60,
        "mode": "수동",
        "is_active": True
    }
]

@router.get("/")
def get_schedules(db: Session = Depends(get_db)):
    return {"schedules": fake_schedules}

@router.post("/")
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    new_schedule = {
        "id": len(fake_schedules) + 1,
        **schedule.dict()
    }
    fake_schedules.append(new_schedule)
    return {"message": "스케줄 생성됨", "schedule": new_schedule}

@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, schedule: ScheduleUpdate, db: Session = Depends(get_db)):
    for i, s in enumerate(fake_schedules):
        if s["id"] == schedule_id:
            update_data = {k: v for k, v in schedule.dict().items() if v is not None}
            fake_schedules[i].update(update_data)
            return {"message": "스케줄 업데이트됨", "schedule": fake_schedules[i]}
    raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    for i, s in enumerate(fake_schedules):
        if s["id"] == schedule_id:
            deleted_schedule = fake_schedules.pop(i)
            return {"message": "스케줄 삭제됨", "schedule": deleted_schedule}
    raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")