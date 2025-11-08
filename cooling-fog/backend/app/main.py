from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models import device, sensor, schedule
from app.routers import device as device_router, schedule as schedule_router
from app.websocket_manager import manager
from pydantic import BaseModel
import asyncio
import json

# 데이터베이스 테이블 생성
device.Base.metadata.create_all(bind=engine)
sensor.Base.metadata.create_all(bind=engine)
schedule.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoolingFog API", version="2.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://3.36.112.6",
        "http://3.36.112.6:3000",
        "https://3.36.112.6",
        "https://3.36.112.6:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 포함
app.include_router(device_router.router)
app.include_router(schedule_router.router)

# ============= WebSocket 엔드포인트 =============

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """웹 클라이언트용 WebSocket"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("type") == "control":
                    # 웹에서 온 제어 명령 처리
                    await handle_web_control(message)
                        
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/esp32")
async def esp32_websocket(websocket: WebSocket):
    """라즈베리파이 하드웨어용 WebSocket"""
    await manager.connect_esp32(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            
            # 모든 데이터를 웹 클라이언트에 브로드캐스트
            if msg_type in ["sensor_data", "position_data", "detection_data", "camera_data", "tracking_data"]:
                await manager.broadcast(json.dumps(message))
                
                # 마지막 데이터 저장
                if msg_type == "sensor_data" and "data" in message:
                    manager.last_esp32_data.update(message["data"])
                elif msg_type == "position_data" and "data" in message:
                    manager.last_esp32_data.update(message["data"])
                elif msg_type == "detection_data" and "data" in message:
                    manager.last_esp32_data.update(message["data"])
                elif msg_type == "camera_data" and "data" in message:
                    manager.last_esp32_data["camera"] = message["data"]
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("라즈베리파이 연결 종료")
    except Exception as e:
        print(f"ESP32 WebSocket 오류: {e}")
        manager.disconnect(websocket)

# ============= 웹 제어 명령 처리 =============

async def handle_web_control(message: dict):
    """웹에서 온 제어 명령 처리"""
    command = message.get("command")
    value = message.get("value")
    
    if command == "set_mode":
        # 모드 변경 (auto/manual)
        await send_to_raspberry({"type": "device_control", "command": "set_mode", "value": value})
    
    elif command == "motor_control":
        # 모터 제어 (start/stop)
        await send_to_raspberry({"type": "device_control", "command": "motor_control", "value": value})
    
    elif command == "move_to_grid":
        # 그리드 이동 (1~25)
        await send_to_raspberry({"type": "device_control", "command": "move_to_grid", "value": value})

async def send_to_raspberry(data: dict):
    """라즈베리파이로 명령 전송"""
    if manager.esp32_connection:
        try:
            await manager.esp32_connection.send_text(json.dumps(data))
            print(f"📤 라즈베리파이로 전송: {data}")
            return True
        except:
            print("⚠️  라즈베리파이 연결 없음")
            return False
    return False

# ============= REST API 엔드포인트 =============

class ModeRequest(BaseModel):
    mode: str  # "auto" or "manual"

class MotorControlRequest(BaseModel):
    control: str  # "start" or "stop"

class GridMoveRequest(BaseModel):
    grid: int  # 1~25

@app.post("/api/control/mode")
async def set_mode(request: ModeRequest):
    """모드 설정 (auto: AI 추적, manual: 순찰)"""
    if request.mode not in ["auto", "manual"]:
        raise HTTPException(status_code=400, detail="유효하지 않은 모드입니다.")
    
    success = await send_to_raspberry({
        "type": "device_control",
        "command": "set_mode",
        "value": request.mode
    })
    
    return {
        "success": success,
        "message": f"모드 변경: {request.mode}",
        "mode": request.mode
    }

@app.post("/api/control/motor")
async def control_motor(request: MotorControlRequest):
    """모터 제어 (start/stop)"""
    if request.control not in ["start", "stop"]:
        raise HTTPException(status_code=400, detail="유효하지 않은 제어 명령입니다.")
    
    success = await send_to_raspberry({
        "type": "device_control",
        "command": "motor_control",
        "value": request.control
    })
    
    return {
        "success": success,
        "message": f"모터 {request.control}",
        "control": request.control
    }

@app.post("/api/control/grid")
async def move_to_grid(request: GridMoveRequest):
    """특정 그리드로 이동 (1~25)"""
    if not 1 <= request.grid <= 25:
        raise HTTPException(status_code=400, detail="그리드는 1~25 범위여야 합니다.")
    
    success = await send_to_raspberry({
        "type": "device_control",
        "command": "move_to_grid",
        "value": request.grid
    })
    
    return {
        "success": success,
        "message": f"그리드 {request.grid}로 이동",
        "grid": request.grid
    }

@app.get("/api/system/status")
async def get_system_status():
    """시스템 상태 조회"""
    return {
        "raspberry_pi_connected": manager.esp32_connection is not None,
        "web_clients": len(manager.active_connections),
        "last_data": manager.last_esp32_data
    }

# ============= 기존 API (호환성 유지) =============

@app.get("/")
def root():
    return {"message": "CoolingFog API Server", "version": "2.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/device/status")
def get_device_status(db: Session = Depends(get_db)):
    return {
        "device_id": "cooling-fog-001",
        "status": "active",
        "raspberry_pi_connected": manager.esp32_connection is not None,
        "database_connected": True
    }

@app.get("/api/sensor-data/latest")
def get_latest_sensor_data():
    """최신 센서 데이터 조회"""
    if manager.last_esp32_data:
        return {
            "device_id": "cooling-fog-001",
            "temperature": manager.last_esp32_data.get("temperature", 28.0),
            "humidity": manager.last_esp32_data.get("humidity", 65.0),
            "timestamp": manager.last_esp32_data.get("timestamp", "")
        }
    
    return {
        "device_id": "cooling-fog-001",
        "temperature": 28.0,
        "humidity": 65.0,
        "timestamp": ""
    }

@app.get("/api/position-data/latest")
def get_latest_position_data():
    """최신 위치 데이터 조회"""
    if manager.last_esp32_data:
        return {
            "device_id": "cooling-fog-001",
            "current_grid": manager.last_esp32_data.get("current_grid", 1),
            "x": manager.last_esp32_data.get("x", 0.0),
            "y": manager.last_esp32_data.get("y", 0.0),
            "timestamp": manager.last_esp32_data.get("timestamp", "")
        }
    
    return {
        "device_id": "cooling-fog-001",
        "current_grid": 1,
        "x": 0.0,
        "y": 0.0,
        "timestamp": ""
    }

@app.get("/api/detection-data/latest")
def get_latest_detection_data():
    """최신 가축 감지 데이터 조회"""
    if manager.last_esp32_data:
        return {
            "device_id": "cooling-fog-001",
            "livestock_detected": manager.last_esp32_data.get("livestock_detected", False),
            "timestamp": manager.last_esp32_data.get("timestamp", "")
        }
    
    return {
        "device_id": "cooling-fog-001",
        "livestock_detected": False,
        "timestamp": ""
    }

@app.get("/api/camera-data/latest")
def get_latest_camera_data():
    """최신 AI 카메라 데이터 조회"""
    if "camera" in manager.last_esp32_data:
        camera_data = manager.last_esp32_data["camera"]
        return {
            "device_id": "cooling-fog-001",
            "status": camera_data.get("status", "inactive"),
            "fps": camera_data.get("fps", 0),
            "detected_objects": camera_data.get("detected_objects", []),
            "timestamp": manager.last_esp32_data.get("timestamp", "")
        }
    
    return {
        "device_id": "cooling-fog-001",
        "status": "inactive",
        "fps": 0,
        "detected_objects": [],
        "timestamp": ""
    }

# ============= 시작 이벤트 =============

@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("🌊 CoolingFog API Server v2.0")
    print("=" * 60)
    print("포트: 8050")
    print("WebSocket 엔드포인트:")
    print("  - /ws/realtime (웹 클라이언트)")
    print("  - /ws/esp32 (라즈베리파이)")
    print("=" * 60)
    print("새로운 기능:")
    print("  - AI 추적 모드 (auto)")
    print("  - 수동 순찰 모드 (manual)")
    print("  - 5x5 그리드 시스템 (1~25)")
    print("  - AI 카메라 데이터")
    print("  - 가축 감지 데이터")
    print("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8050)