from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models import device, sensor, schedule
from app.routers import device as device_router, schedule as schedule_router

# 모든 데이터베이스 테이블 생성
device.Base.metadata.create_all(bind=engine)
sensor.Base.metadata.create_all(bind=engine)
schedule.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoolingFog API", version="1.0.0")

# 라우터 포함
app.include_router(device_router.router)
app.include_router(schedule_router.router)

# CORS 설정 (프론트엔드 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "CoolingFog API Server"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/device/status")
def get_device_status(db: Session = Depends(get_db)):
    return {
        "device_id": "cooling-fog-001",
        "status": "active",
        "is_running": False,
        "spray_intensity": 40,
        "tracking_mode": "자동",
        "database_connected": True
    }

@app.get("/api/sensor-data/latest")
def get_latest_sensor_data():
    return {
        "device_id": "cooling-fog-001",
        "temperature": 28.5,
        "humidity": 65,
        "battery_level": 85,
        "water_tank_level": 70,
        "timestamp": "2025-09-13T12:30:00"
    }

@app.get("/api/tracking-data/latest")
def get_latest_tracking_data():
    return {
        "device_id": "cooling-fog-001",
        "human_detected": True,
        "distance": 2.3,
        "direction": "북쪽",
        "spray_active": False,
        "timestamp": "2025-09-13T12:30:00"
    }