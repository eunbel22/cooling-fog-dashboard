from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
import json

router = APIRouter(prefix="/api/device", tags=["device"])

# ============= 레거시 엔드포인트 (하위 호환성) =============
# 이 엔드포인트들은 구버전 클라이언트 호환을 위해 유지되며,
# 내부적으로 새로운 제어 API로 리다이렉트됩니다.

@router.post("/start")
async def start_device(db: Session = Depends(get_db)):
    """레거시: 기기 시작 (내부적으로 /api/control/motor로 리다이렉트)"""
    from app.websocket_manager import manager
    
    # WebSocket으로 라즈베리파이에 명령 전송
    if manager.esp32_connection:
        try:
            await manager.esp32_connection.send_text(json.dumps({
                "type": "device_control",
                "command": "motor_control",
                "value": "start"
            }))
            print(f"📤 [레거시 API] 라즈베리파이로 시작 명령 전송")
        except Exception as e:
            print(f"⚠️  [레거시 API] 전송 실패: {e}")
    
    return {"message": "기기 시작됨", "status": "success"}

@router.post("/stop")
async def stop_device(db: Session = Depends(get_db)):
    """레거시: 기기 정지 (내부적으로 /api/control/motor로 리다이렉트)"""
    from app.websocket_manager import manager
    
    # WebSocket으로 라즈베리파이에 명령 전송
    if manager.esp32_connection:
        try:
            await manager.esp32_connection.send_text(json.dumps({
                "type": "device_control",
                "command": "motor_control",
                "value": "stop"
            }))
            print(f"📤 [레거시 API] 라즈베리파이로 정지 명령 전송")
        except Exception as e:
            print(f"⚠️  [레거시 API] 전송 실패: {e}")
    
    return {"message": "기기 정지됨", "status": "success"}

@router.put("/tracking-mode")
async def set_tracking_mode(mode: str, db: Session = Depends(get_db)):
    """레거시: 추적 모드 설정 (내부적으로 /api/control/mode로 리다이렉트)"""
    from app.websocket_manager import manager
    
    # 한글 모드를 영어로 변환
    mode_map = {
        "자동": "auto",
        "수동": "manual",
        "끄기": "manual"  # 끄기는 수동 모드로 처리
    }
    
    api_mode = mode_map.get(mode, "manual")
    
    # WebSocket으로 라즈베리파이에 명령 전송
    if manager.esp32_connection:
        try:
            await manager.esp32_connection.send_text(json.dumps({
                "type": "device_control",
                "command": "set_mode",
                "value": api_mode
            }))
            print(f"📤 [레거시 API] 라즈베리파이로 모드 변경 명령 전송: {mode} -> {api_mode}")
        except Exception as e:
            print(f"⚠️  [레거시 API] 전송 실패: {e}")
    
    if mode in ["자동", "수동", "끄기"]:
        return {"message": f"추적 모드 '{mode}'로 설정됨", "mode": mode}
    else:
        return {"error": "유효하지 않은 추적 모드입니다", "valid_modes": ["자동", "수동", "끄기"]}