from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models import device, sensor, schedule
from app.routers import device as device_router, schedule as schedule_router
from app.websocket_manager import (
    manager, generate_sensor_data, generate_tracking_data, 
    handle_esp32_data, send_start_device, send_stop_device, 
    send_spray_intensity, send_tracking_mode, send_manual_position,
    update_patrol_position  # 새로 추가
)
import asyncio

# 모든 데이터베이스 테이블 생성
device.Base.metadata.create_all(bind=engine)
sensor.Base.metadata.create_all(bind=engine)
schedule.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoolingFog API", version="1.0.0")

# CORS 설정 (프론트엔드 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 라우터 포함
app.include_router(device_router.router)
app.include_router(schedule_router.router)

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 클라이언트로부터 메시지 수신 (연결 유지용)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    # 기기 상태 데이터 생성 제거 - 사용자가 직접 제어
    # asyncio.create_task(generate_device_status())  # 이 줄 제거 또는 주석 처리
    
    # 선택: 패턴 기반 데이터를 원한다면 다음으로 교체
    # asyncio.create_task(generate_realistic_tracking_data())
    
    print("실시간 데이터 생성 시작: 센서 데이터, 추적 데이터")
    # 백그라운드에서 실시간 데이터 생성 시작
    asyncio.create_task(generate_sensor_data())
    asyncio.create_task(generate_tracking_data())
    # generate_device_status() 호출 제거

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
        "distance": 1.2,  # 예시 값을 1.5m 범위 내로 조정
        "direction": "북쪽",
        "timestamp": "2025-09-13T12:30:00"
    }