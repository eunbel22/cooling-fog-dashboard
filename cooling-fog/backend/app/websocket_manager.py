# websocket_manager.py - 기기제어/추적제어 랜덤값 제거

from typing import List
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import time
import random

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket 연결됨. 총 연결 수: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"WebSocket 연결 해제됨. 총 연결 수: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # 연결이 끊어진 클라이언트 제거
        for connection in disconnected:
            self.disconnect(connection)

    async def broadcast_json(self, data: dict):
        message = json.dumps(data)
        await self.broadcast(message)

# 글로벌 연결 매니저 인스턴스
manager = ConnectionManager()

# 실시간 데이터 생성 함수들
async def generate_sensor_data():
    """센서 데이터 시뮬레이션 - 환경 데이터만 랜덤 생성"""
    while True:
        data = {
            "type": "sensor_data",
            "timestamp": int(time.time()),
            "data": {
                # 온도: 25.0~32.0°C 범위에서 랜덤 생성
                "temperature": round(random.uniform(25.0, 32.0), 1),
                
                # 습도: 60~80% 범위에서 랜덤 생성
                "humidity": random.randint(60, 80),
                
                # 배터리: 80~100% 범위에서 랜덤 생성 (하드웨어 상태)
                "battery_level": random.randint(80, 100),
                
                # 물탱크: 60~90% 범위에서 랜덤 생성 (하드웨어 상태)
                "water_tank_level": random.randint(60, 90)
            }
        }
        await manager.broadcast_json(data)
        await asyncio.sleep(2)  # 2초마다 업데이트

async def generate_tracking_data():
    """추적 데이터 시뮬레이션 - 거리, 방향, 인체감지만 랜덤"""
    directions = ["북쪽", "남쪽", "동쪽", "서쪽", "북동쪽", "북서쪽", "남동쪽", "남서쪽"]
    
    while True:
        data = {
            "type": "tracking_data",
            "timestamp": int(time.time()),
            "data": {
                # 인체 감지: True/False 랜덤 (센서 데이터)
                "human_detected": random.choice([True, False]),
                
                # 거리: 0.5~1.0m 범위에서 랜덤 (센서 데이터)
                "distance": round(random.uniform(0.5, 1.0), 1),
                
                # 방향: 8방향 중 랜덤 선택 (센서 데이터)
                "direction": random.choice(directions),
                
                # spray_active는 제거 - 기기 제어와 연관됨
            }
        }
        await manager.broadcast_json(data)
        await asyncio.sleep(1)  # 1초마다 업데이트

# 기기 상태 데이터 생성 함수 제거
# generate_device_status() 함수는 더 이상 사용하지 않음
# 기기 제어(is_running, spray_intensity, tracking_mode)는 사용자가 직접 조작

# 패턴 기반 추적 데이터 (선택사항)
async def generate_realistic_tracking_data():
    """더 현실적인 추적 데이터 - 사람이 실제로 움직이는 패턴"""
    movement_pattern = [
        {"direction": "북쪽", "distance": 0.8, "duration": 5},
        {"direction": "북동쪽", "distance": 0.9, "duration": 3},
        {"direction": "동쪽", "distance": 1.0, "duration": 4},
        {"direction": "남동쪽", "distance": 0.7, "duration": 3},
        {"direction": "남쪽", "distance": 0.6, "duration": 5},
        {"direction": "남서쪽", "distance": 0.8, "duration": 3},
        {"direction": "서쪽", "distance": 0.9, "duration": 4},
        {"direction": "북서쪽", "distance": 0.7, "duration": 3},
    ]
    
    pattern_index = 0
    step_count = 0
    
    while True:
        current_step = movement_pattern[pattern_index]
        
        data = {
            "type": "tracking_data",
            "timestamp": int(time.time()),
            "data": {
                "human_detected": True,  # 패턴에서는 항상 감지됨
                "distance": current_step["distance"],
                "direction": current_step["direction"]
            }
        }
        
        await manager.broadcast_json(data)
        step_count += 1
        
        # 다음 패턴으로 이동
        if step_count >= current_step["duration"]:
            pattern_index = (pattern_index + 1) % len(movement_pattern)
            step_count = 0
        
        await asyncio.sleep(1)

# 고정 테스트 데이터 (디버깅용)
async def generate_fixed_tracking_data():
    """고정된 추적 데이터 - 테스트용"""
    while True:
        data = {
            "type": "tracking_data", 
            "timestamp": int(time.time()),
            "data": {
                "human_detected": True,
                "distance": 0.8,  # 고정 거리
                "direction": "북쪽",  # 고정 방향
            }
        }
        await manager.broadcast_json(data)
        await asyncio.sleep(1)
# ==================== 사용법 ====================
# main.py에서 원하는 함수로 변경하여 사용:

# 기본 랜덤 데이터 (현재):
# asyncio.create_task(generate_tracking_data())

# 현실적인 움직임 패턴:
# asyncio.create_task(generate_realistic_tracking_data()) 

# 고정 데모 데이터:
# asyncio.create_task(generate_fixed_demo_data())