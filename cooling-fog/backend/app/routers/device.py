from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/api/device", tags=["device"])

@router.post("/start")
def start_device(db: Session = Depends(get_db)):
    return {"message": "기기 시작됨", "status": "success"}

@router.post("/stop")
def stop_device(db: Session = Depends(get_db)):
    return {"message": "기기 정지됨", "status": "success"}

@router.put("/spray-intensity")
def set_spray_intensity(intensity: int, db: Session = Depends(get_db)):
    if 0 <= intensity <= 100:
        return {"message": f"분사 강도 {intensity}%로 설정됨", "intensity": intensity}
    else:
        return {"error": "분사 강도는 0-100% 사이여야 합니다"}

@router.put("/tracking-mode")
def set_tracking_mode(mode: str, db: Session = Depends(get_db)):
    if mode in ["자동", "수동", "끄기"]:
        return {"message": f"추적 모드 '{mode}'로 설정됨", "mode": mode}
    else:
        return {"error": "유효하지 않은 추적 모드입니다"}