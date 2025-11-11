from typing import List, Dict, Any
from fastapi import WebSocket
import json
import time

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.esp32_connection: WebSocket = None
        self.last_esp32_data: Dict[str, Any] = {}
    
    async def connect(self, websocket: WebSocket):
        """웹 클라이언트 연결"""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ 웹 클라이언트 연결. 총 {len(self.active_connections)}개")
    
    async def connect_esp32(self, websocket: WebSocket):
        """라즈베리파이 연결"""
        await websocket.accept()
        self.esp32_connection = websocket
        print("✅ 라즈베리파이가 연결되었습니다.")
    
    def disconnect(self, websocket: WebSocket):
        """연결 해제"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"❌ 웹 클라이언트 연결 해제. 총 {len(self.active_connections)}개")
        
        if websocket == self.esp32_connection:
            self.esp32_connection = None
            print("❌ 라즈베리파이 연결이 해제되었습니다.")
    
    async def send_to_esp32(self, data: dict):
        """라즈베리파이로 데이터 전송"""
        if self.esp32_connection:
            try:
                await self.esp32_connection.send_text(json.dumps(data))
                print(f"📤 라즈베리파이로 명령 전송: {data.get('command')}")
                return True
            except:
                self.esp32_connection = None
                return False
        return False
    
    async def broadcast(self, message: str):
        """모든 웹 클라이언트에 브로드캐스트"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_json(self, data: dict):
        """JSON 데이터를 모든 웹 클라이언트에 브로드캐스트"""
        message = json.dumps(data)
        await self.broadcast(message)

# 글로벌 매니저 인스턴스
manager = ConnectionManager()


# ============= 데이터 처리 함수 =============

async def handle_esp32_data(data: dict):
    """라즈베리파이에서 받은 센서 데이터 처리"""
    data_type = data.get('type')
    
    if data_type == 'sensor_data':
        # 센서 데이터 처리
        sensor_data = data.get('data', {})
        sensor_message = {
            "type": "sensor_data",
            "timestamp": data.get('timestamp', int(time.time())),
            "data": {
                "temperature": sensor_data.get('temperature', 25.0),
                "humidity": sensor_data.get('humidity', 60)
            }
        }
        print(f"📊 센서 데이터 수신: {sensor_data.get('temperature')}°C, {sensor_data.get('humidity')}%")
        await manager.broadcast_json(sensor_message)
        
    elif data_type == 'position_data':
        # 위치 데이터 처리
        position_data = data.get('data', {})
        position_message = {
            "type": "position_data",
            "timestamp": data.get('timestamp', int(time.time())),
            "data": {
                "current_grid": position_data.get('current_grid', 1),
                "x": position_data.get('x', 0.0),
                "y": position_data.get('y', 0.0)
            }
        }
        print(f"📍 위치 데이터 수신: 그리드 {position_data.get('current_grid')}, 좌표 ({position_data.get('x'):.2f}, {position_data.get('y'):.2f})")
        await manager.broadcast_json(position_message)
        
    elif data_type == 'detection_data':
        # 가축 감지 데이터 처리
        detection_data = data.get('data', {})
        detection_message = {
            "type": "detection_data",
            "timestamp": data.get('timestamp', int(time.time())),
            "data": {
                "livestock_detected": detection_data.get('livestock_detected', False)
            }
        }
        print(f"🐷 가축 감지: {detection_data.get('livestock_detected')}")
        await manager.broadcast_json(detection_message)
        
    elif data_type == 'camera_data':
        # AI 카메라 데이터 처리
        camera_data = data.get('data', {})
        camera_message = {
            "type": "camera_data",
            "timestamp": data.get('timestamp', int(time.time())),
            "data": {
                "status": camera_data.get('status', 'inactive'),
                "fps": camera_data.get('fps', 0),
                "detected_objects": camera_data.get('detected_objects', [])
            }
        }
        print(f"📷 카메라 상태: {camera_data.get('status')}, FPS: {camera_data.get('fps')}")
        await manager.broadcast_json(camera_message)
        
    elif data_type == 'tracking_data':
        # 기존 tracking_data 처리 (하위 호환성)
        tracking_data = data.get('data', {})
        tracking_message = {
            "type": "tracking_data",
            "timestamp": data.get('timestamp', int(time.time())),
            "data": {
                "human_detected": tracking_data.get('human_detected', False),
                "distance": tracking_data.get('distance', 0.0),
                "direction": tracking_data.get('direction', '북쪽')
            }
        }
        await manager.broadcast_json(tracking_message)
    
    # 마지막 데이터 저장
    manager.last_esp32_data.update(data)


# ============= 제어 명령 함수 =============

async def send_device_control(command: str, value: Any = None):
    """라즈베리파이로 제어 명령 전송"""
    control_data = {
        "type": "device_control",
        "command": command,
        "value": value,
        "timestamp": int(time.time())
    }
    
    success = await manager.send_to_esp32(control_data)
    if not success:
        print(f"⚠️  라즈베리파이 연결 없음. 명령 전송 실패: {command}")
    
    return success


async def send_set_mode(mode: str):
    """모드 설정 (auto/manual)"""
    return await send_device_control("set_mode", mode)


async def send_motor_control(control: str):
    """모터 제어 (start/stop)"""
    return await send_device_control("motor_control", control)


async def send_move_to_grid(grid: int):
    """수동 그리드 이동 (1~25)"""
    if 1 <= grid <= 25:
        return await send_device_control("move_to_grid", grid)
    else:
        print(f"❌ 잘못된 그리드 번호: {grid}")
        return False