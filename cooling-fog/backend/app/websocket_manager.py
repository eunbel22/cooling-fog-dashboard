from typing import List, Dict, Any
from fastapi import WebSocket
import json

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

# 글로벌 매니저 인스턴스
manager = ConnectionManager()