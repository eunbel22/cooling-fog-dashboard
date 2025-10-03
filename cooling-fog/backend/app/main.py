from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models import device, sensor, schedule
from app.routers import device as device_router, schedule as schedule_router
from app.websocket_manager import (
    manager, generate_sensor_data, generate_tracking_data, 
    handle_esp32_data, send_motor_move, send_spray_water,
    send_start_device, send_stop_device, send_spray_intensity, 
    send_tracking_mode, send_manual_position, update_patrol_position
)
from pydantic import BaseModel
import asyncio
import json

# 데이터베이스 테이블 생성
device.Base.metadata.create_all(bind=engine)
sensor.Base.metadata.create_all(bind=engine)
schedule.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoolingFog API", version="1.0.0")

# CORS 설정
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

# === WebSocket 엔드포인트 ===

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """웹 클라이언트용 WebSocket"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # 클라이언트로부터 제어 명령 수신 가능
            try:
                message = json.loads(data)
                if message.get("type") == "control":
                    command = message.get("command")
                    value = message.get("value")
                    
                    if command == "motor_move":
                        await send_motor_move(value)
                    elif command == "spray_water":
                        await send_spray_water(value)
                        
            except json.JSONDecodeError:
                pass  # ping 메시지 등 무시
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/esp32")
async def esp32_websocket(websocket: WebSocket):
    """ESP32 하드웨어용 WebSocket"""
    await manager.connect_esp32(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_esp32_data(message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"ESP32 WebSocket 오류: {e}")
        manager.disconnect(websocket)

# === REST API 엔드포인트 ===

class MotorMoveRequest(BaseModel):
    motor_move: int  # 10: 순찰, 11: 추적, 1-9: 수동

class SprayWaterRequest(BaseModel):
    spray_water: int  # 0: 정지, 1: 시작

@app.post("/api/control/motor")
async def control_motor(request: MotorMoveRequest):
    """모터 제어 API"""
    if request.motor_move not in list(range(1, 10)) + [10, 11]:
        raise HTTPException(status_code=400, detail="유효하지 않은 motor_move 값입니다.")
    
    await send_motor_move(request.motor_move)
    
    mode_name = "순찰" if request.motor_move == 10 else "추적" if request.motor_move == 11 else f"수동(구역 {request.motor_move})"
    
    return {
        "success": True,
        "message": f"모터 제어 명령 전송: {mode_name}",
        "motor_move": request.motor_move
    }

@app.post("/api/control/spray")
async def control_spray(request: SprayWaterRequest):
    """쿨링포그 제어 API"""
    if request.spray_water not in [0, 1]:
        raise HTTPException(status_code=400, detail="유효하지 않은 spray_water 값입니다.")
    
    await send_spray_water(request.spray_water)
    
    status = "작동" if request.spray_water == 1 else "정지"
    
    return {
        "success": True,
        "message": f"쿨링포그 {status} 명령 전송",
        "spray_water": request.spray_water
    }

@app.get("/api/system/status")
async def get_system_status():
    """시스템 상태 조회"""
    return {
        "esp32_connected": manager.esp32_connection is not None,
        "web_clients": len(manager.active_connections),
        "last_data": manager.last_esp32_data
    }

# === 기존 API (호환성 유지) ===

@app.get("/")
def root():
    return {"message": "CoolingFog API Server", "version": "1.0.0"}

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
        "database_connected": True,
        "esp32_connected": manager.esp32_connection is not None
    }

@app.get("/api/sensor-data/latest")
def get_latest_sensor_data():
    """최신 센서 데이터 조회"""
    if manager.last_esp32_data:
        return {
            "device_id": "cooling-fog-001",
            "temperature": manager.last_esp32_data.get("temperature", 28.5),
            "humidity": manager.last_esp32_data.get("humidity", 65),
            "water_tank_level": manager.last_esp32_data.get("water_tank_level", 70),
            "timestamp": manager.last_esp32_data.get("timestamp", "")
        }
    
    return {
        "device_id": "cooling-fog-001",
        "temperature": 28.5,
        "humidity": 65,
        "water_tank_level": 70,
        "timestamp": ""
    }

@app.get("/api/tracking-data/latest")
def get_latest_tracking_data():
    """최신 추적 데이터 조회"""
    if manager.last_esp32_data:
        return {
            "device_id": "cooling-fog-001",
            "human_detected": manager.last_esp32_data.get("human_detected", True),
            "distance": manager.last_esp32_data.get("distance", 1.2),
            "direction": manager.last_esp32_data.get("direction", "북쪽"),
            "timestamp": manager.last_esp32_data.get("timestamp", "")
        }
    
    return {
        "device_id": "cooling-fog-001",
        "human_detected": True,
        "distance": 1.2,
        "direction": "북쪽",
        "timestamp": ""
    }

# === 시작 이벤트 ===

@app.on_event("startup")
async def startup_event():
    print("=" * 50)
    print("CoolingFog API Server 시작")
    print("포트: 8050")
    print("WebSocket 엔드포인트:")
    print("  - /ws/realtime (웹 클라이언트)")
    print("  - /ws/esp32 (ESP32 하드웨어)")
    print("=" * 50)
    print("실시간 데이터 생성 시작...")
    
    # 시뮬레이션 데이터 생성 (ESP32 미연결 시)
    asyncio.create_task(generate_sensor_data())      # 5초 주기
    asyncio.create_task(generate_tracking_data())    # 2초 주기 + 1~2초 주기

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8050)