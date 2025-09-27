from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import time
import random
import math

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.esp32_connection: WebSocket = None
        self.last_esp32_data: Dict[str, Any] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket 연결됨. 총 연결 수: {len(self.active_connections)}")

    async def connect_esp32(self, websocket: WebSocket):
        """ESP32 전용 연결 함수"""
        await websocket.accept()
        self.esp32_connection = websocket
        print("ESP32 장치가 연결되었습니다.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket == self.esp32_connection:
            self.esp32_connection = None
            print("ESP32 장치 연결이 해제되었습니다.")
        print(f"WebSocket 연결 해제됨. 총 연결 수: {len(self.active_connections)}")

    async def send_to_esp32(self, data: dict):
        """ESP32로 제어 명령 전송"""
        if self.esp32_connection:
            try:
                await self.esp32_connection.send_text(json.dumps(data))
                return True
            except:
                self.esp32_connection = None
                return False
        return False

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

# websocket_manager.py에서 AdvancedWalkingSimulator 클래스 수정

class AdvancedWalkingSimulator:
    def __init__(self):
        # 사람의 현재 위치
        self.current_x = random.uniform(-0.4, 0.4)
        self.current_y = random.uniform(-0.4, 0.4)
        
        # 쿨링포그 장치의 위치 (센서 위치)
        self.device_x = 0.0
        self.device_y = 0.0
        
        # 쿨링포그의 현재 모드와 상태
        self.device_mode = "자동"  # 자동, 수동, 끄기
        self.device_target_grid = None  # 수동 모드에서의 목표 격자
        self.device_patrol_index = 0  # 끄기 모드에서의 순찰 위치
        
        # 격자 위치 정의 (9개 구역)
        self.grid_positions = [
            (-0.33, 0.33),   # 북서 (0)
            (0.0, 0.33),     # 북중 (1) 
            (0.33, 0.33),    # 북동 (2)
            (-0.33, 0.0),    # 중서 (3)
            (0.0, 0.0),      # 중앙 (4)
            (0.33, 0.0),     # 중동 (5)
            (-0.33, -0.33),  # 남서 (6)
            (0.0, -0.33),    # 남중 (7)
            (0.33, -0.33)    # 남동 (8)
        ]
        
        # 걷기 패턴 설정 (사람의 움직임)
        self.walking_patterns = [
            "random_walk", "circle_walk", "figure_eight", 
            "back_forth", "corner_tour", "edge_walk"
        ]
        
        self.current_pattern = "random_walk"
        self.pattern_timer = 0
        self.pattern_duration = random.uniform(10, 20)
        
        # 패턴별 상태 변수
        self.circle_angle = random.uniform(0, 2 * math.pi)
        self.circle_radius = random.uniform(0.3, 0.6)
        self.circle_center_x = random.uniform(-0.2, 0.2)
        self.circle_center_y = random.uniform(-0.2, 0.2)
        self.figure_eight_time = 0
        self.back_forth_direction = 1
        self.back_forth_axis = random.choice(['x', 'y'])
        self.corner_index = 0
        self.edge_progress = 0
        
        # 사람의 걷기 속도와 상태
        self.base_speed = 0.3
        self.current_speed = self.base_speed
        self.is_walking = True
        self.rest_timer = 0
        
        # 부드러운 움직임을 위한 변수
        self.velocity_x = 0.0
        self.velocity_y = 0.0
        self.acceleration = 1.5
        
        # 경계 설정
        self.boundary = 0.5  # ±0.5m = 1m 전체

    def update_device_position(self, mode, target_grid=None, patrol_index=None):
        """쿨링포그 장치 위치 업데이트"""
        self.device_mode = mode
        
        if mode == "자동":
            # 자동 모드: 사람을 추적하되 안전거리 유지
            distance_to_human = self.get_distance_from_device()
            if distance_to_human > 0.3:  # 안전거리 30cm
                # 사람을 향해 천천히 이동
                dx = self.current_x - self.device_x
                dy = self.current_y - self.device_y
                if distance_to_human > 0:
                    move_distance = min(0.1, distance_to_human - 0.3)  # 안전거리 유지
                    self.device_x += (dx / distance_to_human) * move_distance * 0.5
                    self.device_y += (dy / distance_to_human) * move_distance * 0.5
            
        elif mode == "수동" and target_grid is not None:
            # 수동 모드: 지정된 격자로 이동
            self.device_target_grid = target_grid
            target_x, target_y = self.grid_positions[target_grid]
            
            # 목표 지점으로 부드럽게 이동
            dx = target_x - self.device_x
            dy = target_y - self.device_y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance > 0.05:
                move_speed = 0.15  # 수동 모드 이동 속도
                self.device_x += (dx / distance) * move_speed
                self.device_y += (dy / distance) * move_speed
            
        elif mode == "끄기":
            # 끄기 모드: 격자 순찰
            if patrol_index is not None:
                self.device_patrol_index = patrol_index
            
            target_x, target_y = self.grid_positions[self.device_patrol_index]
            
            # 순찰 지점으로 이동
            dx = target_x - self.device_x
            dy = target_y - self.device_y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance > 0.05:
                move_speed = 0.1  # 순찰 모드 이동 속도
                self.device_x += (dx / distance) * move_speed
                self.device_y += (dy / distance) * move_speed
        
        # 장치도 경계 내로 제한
        self.device_x = max(-self.boundary, min(self.boundary, self.device_x))
        self.device_y = max(-self.boundary, min(self.boundary, self.device_y))

    def get_distance_from_device(self):
        """쿨링포그 센서에서 사람까지의 실제 거리"""
        dx = self.current_x - self.device_x
        dy = self.current_y - self.device_y
        distance = math.sqrt(dx**2 + dy**2)
        return distance

    def get_direction_from_device(self):
        """쿨링포그 센서에서 본 사람의 방향"""
        dx = self.current_x - self.device_x
        dy = self.current_y - self.device_y
        
        if abs(dx) < 0.03 and abs(dy) < 0.03:
            return "중앙"
        
        # 쿨링포그를 기준으로 한 각도 계산
        angle = math.atan2(dy, dx)
        angle_degrees = math.degrees(angle)
        if angle_degrees < 0:
            angle_degrees += 360

        # 8방향 매핑
        if angle_degrees < 22.5 or angle_degrees >= 337.5:
            return "동쪽"
        elif angle_degrees < 67.5:
            return "북동쪽"
        elif angle_degrees < 112.5:
            return "북쪽"
        elif angle_degrees < 157.5:
            return "북서쪽"
        elif angle_degrees < 202.5:
            return "서쪽"
        elif angle_degrees < 247.5:
            return "남서쪽"
        elif angle_degrees < 292.5:
            return "남쪽"
        else:
            return "남동쪽"

    def get_device_position_for_frontend(self):
        """프론트엔드용 쿨링포그 위치 반환 (격자 좌표계)"""
        # 백엔드 좌표 (-0.5~0.5)를 프론트엔드 좌표계로 변환
        # 프론트엔드에서는 bottom과 left 퍼센트로 표현
        
        # x: -0.5(0%) ~ 0.5(100%) -> left: 15% ~ 85%
        left_percent = 15 + ((self.device_x + 0.5) / 1.0) * 70
        
        # y: -0.5(bottom:85%) ~ 0.5(bottom:15%) 
        bottom_percent = 85 - ((self.device_y + 0.5) / 1.0) * 70
        
        return {
            "bottom": f"{bottom_percent:.1f}%",
            "left": f"{left_percent:.1f}%"
        }

    def get_human_position_for_frontend(self):
        """프론트엔드용 사람 위치 반환 (격자 좌표계)"""
        # x: -0.5(0%) ~ 0.5(100%) -> left: 15% ~ 85%
        left_percent = 15 + ((self.current_x + 0.5) / 1.0) * 70
        
        # y: -0.5(85%) ~ 0.5(15%) -> top: 85% ~ 15%
        top_percent = 85 - ((self.current_y + 0.5) / 1.0) * 70
        
        return {
            "top": f"{top_percent:.1f}%",
            "left": f"{left_percent:.1f}%"
        }

    # 기존 사람 움직임 관련 함수들은 그대로 유지...
    def switch_pattern(self):
        """새로운 걷기 패턴으로 전환"""
        self.current_pattern = random.choice(self.walking_patterns)
        self.pattern_duration = random.uniform(8, 15)
        self.pattern_timer = 0
        
        if self.current_pattern == "circle_walk":
            self.circle_angle = random.uniform(0, 2 * math.pi)
            self.circle_radius = random.uniform(0.25, 0.45)
            max_center = self.boundary - self.circle_radius
            self.circle_center_x = random.uniform(-max_center, max_center)
            self.circle_center_y = random.uniform(-max_center, max_center)
        elif self.current_pattern == "figure_eight":
            self.figure_eight_time = 0
        elif self.current_pattern == "corner_tour":
            self.corner_index = random.randint(0, 3)
        elif self.current_pattern == "back_forth":
            self.back_forth_axis = random.choice(['x', 'y', 'diagonal'])
        elif self.current_pattern == "edge_walk":
            self.edge_progress = 0

    def get_pattern_target(self, delta_time):
        """현재 패턴에 따른 목표 위치 반환"""
        target_x, target_y = self.current_x, self.current_y
        
        if self.current_pattern == "random_walk":
            if random.random() < 0.15:
                angle = random.uniform(0, 2 * math.pi)
                distance = random.uniform(0.2, 0.5)
                target_x = self.current_x + distance * math.cos(angle)
                target_y = self.current_y + distance * math.sin(angle)
        
        elif self.current_pattern == "circle_walk":
            self.circle_angle += delta_time * 0.4
            target_x = self.circle_center_x + self.circle_radius * math.cos(self.circle_angle)
            target_y = self.circle_center_y + self.circle_radius * math.sin(self.circle_angle)
        
        elif self.current_pattern == "figure_eight":
            self.figure_eight_time += delta_time * 0.3
            scale = 0.35
            target_x = scale * math.sin(self.figure_eight_time)
            target_y = scale * math.sin(2 * self.figure_eight_time) * 0.7
        
        elif self.current_pattern == "back_forth":
            if self.back_forth_axis == 'x':
                target_x = self.back_forth_direction * 0.4
                target_y = self.current_y
            elif self.back_forth_axis == 'y':
                target_x = self.current_x
                target_y = self.back_forth_direction * 0.4
            else:  # diagonal
                target_x = self.back_forth_direction * 0.3
                target_y = self.back_forth_direction * 0.3
                
            dist_to_target = math.sqrt((self.current_x - target_x)**2 + (self.current_y - target_y)**2)
            if dist_to_target < 0.1:
                self.back_forth_direction *= -1
        
        elif self.current_pattern == "corner_tour":
            corners = [(-0.4, -0.4), (0.4, -0.4), (0.4, 0.4), (-0.4, 0.4)]
            target_x, target_y = corners[self.corner_index]
            
            dist_to_corner = math.sqrt((self.current_x - target_x)**2 + (self.current_y - target_y)**2)
            if dist_to_corner < 0.1:
                self.corner_index = (self.corner_index + 1) % 4
        
        elif self.current_pattern == "edge_walk":
            self.edge_progress += delta_time * 0.3
            perimeter = self.edge_progress % 4
            if perimeter < 1:
                target_x = -0.4 + 0.8 * perimeter
                target_y = 0.4
            elif perimeter < 2:
                target_x = 0.4
                target_y = 0.4 - 0.8 * (perimeter - 1)
            elif perimeter < 3:
                target_x = 0.4 - 0.8 * (perimeter - 2)
                target_y = -0.4
            else:
                target_x = -0.4
                target_y = -0.4 + 0.8 * (perimeter - 3)
        
        target_x = max(-self.boundary, min(self.boundary, target_x))
        target_y = max(-self.boundary, min(self.boundary, target_y))
        
        return target_x, target_y

    def update_position(self, delta_time):
        """사람의 위치 업데이트"""
        self.pattern_timer += delta_time
        
        if self.pattern_timer >= self.pattern_duration:
            if random.random() < 0.15:
                self.is_walking = False
                self.rest_timer = random.uniform(0.5, 2)
                return
            else:
                self.switch_pattern()

        if not self.is_walking:
            self.velocity_x *= 0.85
            self.velocity_y *= 0.85
            self.rest_timer -= delta_time
            
            if self.rest_timer <= 0:
                self.is_walking = True
                self.switch_pattern()
        else:
            target_x, target_y = self.get_pattern_target(delta_time)
            
            dx = target_x - self.current_x
            dy = target_y - self.current_y
            distance = math.sqrt(dx * dx + dy * dy)
            
            if distance > 0.03:
                dir_x = dx / distance
                dir_y = dy / distance
                
                force_magnitude = self.acceleration * min(distance, 1.0)
                self.velocity_x += dir_x * force_magnitude * delta_time
                self.velocity_y += dir_y * force_magnitude * delta_time
                
                vel_magnitude = math.sqrt(self.velocity_x**2 + self.velocity_y**2)
                if vel_magnitude > self.current_speed:
                    self.velocity_x = (self.velocity_x / vel_magnitude) * self.current_speed
                    self.velocity_y = (self.velocity_y / vel_magnitude) * self.current_speed
            
            self.velocity_x *= 0.92
            self.velocity_y *= 0.92

        self.current_x += self.velocity_x * delta_time
        self.current_y += self.velocity_y * delta_time
        
        if abs(self.current_x) > self.boundary:
            self.current_x = self.boundary * (1 if self.current_x > 0 else -1)
            self.velocity_x *= -0.3
        
        if abs(self.current_y) > self.boundary:
            self.current_y = self.boundary * (1 if self.current_y > 0 else -1)
            self.velocity_y *= -0.3

# 글로벌 고급 걷기 시뮬레이터
advanced_walking_sim = AdvancedWalkingSimulator()

# 현재 장치 모드 상태 저장
current_device_mode = "자동"
current_manual_grid = None
current_patrol_index = 0

# ESP32에서 받은 데이터 처리
async def handle_esp32_data(data: dict):
    """ESP32에서 받은 센서 데이터를 웹 클라이언트들에게 브로드캐스트"""
    data_type = data.get('type')
    
    if data_type == 'sensor_data':
        # 센서 데이터 브로드캐스트
        sensor_message = {
            "type": "sensor_data",
            "timestamp": int(time.time()),
            "data": {
                "temperature": data.get('temperature', 25.0),
                "humidity": data.get('humidity', 60),
                "battery_level": data.get('battery_level', 85),
                "water_tank_level": data.get('water_tank_level', 70)
            }
        }
        await manager.broadcast_json(sensor_message)
        
    elif data_type == 'tracking_data':
        # 추적 데이터 브로드캐스트
        tracking_message = {
            "type": "tracking_data",
            "timestamp": int(time.time()),
            "data": {
                "human_detected": data.get('human_detected', False),
                "distance": data.get('distance', 0.0),
                "direction": data.get('direction', '북쪽')
            }
        }
        await manager.broadcast_json(tracking_message)
    
    # 마지막 데이터 저장
    manager.last_esp32_data.update(data)

# ESP32 제어 명령 전송 함수들
async def send_device_control(command: str, value: Any = None):
    """ESP32로 장치 제어 명령 전송"""
    control_data = {
        "type": "device_control",
        "command": command,
        "value": value,
        "timestamp": int(time.time())
    }
    
    success = await manager.send_to_esp32(control_data)
    if success:
        print(f"ESP32로 명령 전송: {command} = {value}")
    else:
        print(f"ESP32 연결 없음. 명령 무시: {command}")
    
    return success

# 장치 모드 변경 함수들
async def update_device_mode(mode, **kwargs):
    """장치 모드 변경"""
    global current_device_mode, current_manual_grid, current_patrol_index
    
    current_device_mode = mode
    
    if mode == "수동" and "grid_index" in kwargs:
        current_manual_grid = kwargs["grid_index"]
    elif mode == "끄기" and "patrol_index" in kwargs:
        current_patrol_index = kwargs["patrol_index"]
    
    print(f"장치 모드 변경: {mode}")

# ESP32 제어 명령 전송 함수들 수정
async def send_start_device():
    success = await send_device_control("start")
    if not success:
        # 시뮬레이션에서는 별도 처리 불필요
        pass
    return success

async def send_stop_device():
    success = await send_device_control("stop")
    if not success:
        # 시뮬레이션에서는 별도 처리 불필요
        pass
    return success

async def send_spray_intensity(intensity: int):
    success = await send_device_control("spray_intensity", intensity)
    return success

async def send_tracking_mode(mode: str):
    success = await send_device_control("tracking_mode", mode)
    if not success:
        # 시뮬레이션 모드 업데이트
        await update_device_mode(mode)
    return success

async def send_manual_position(grid_index: int):
    success = await send_device_control("manual_position", grid_index)
    if not success:
        # 시뮬레이션 모드 업데이트
        await update_device_mode("수동", grid_index=grid_index)
    return success

# 실시간 데이터 생성 함수들

async def generate_sensor_data():
    """센서 데이터 시뮬레이션 - 환경 데이터만 랜덤 생성"""
    while True:
        if not manager.esp32_connection:  # ESP32 연결이 없을 때만 시뮬레이션
            data = {
                "type": "sensor_data",
                "timestamp": int(time.time()),
                "data": {
                    "temperature": round(random.uniform(25.0, 32.0), 1),
                    "humidity": random.randint(60, 80),
                    "battery_level": random.randint(80, 100),
                    "water_tank_level": random.randint(60, 90)
                }
            }
            await manager.broadcast_json(data)
        await asyncio.sleep(2)  # 2초마다 업데이트

        
async def generate_advanced_walking_data():
    """쿨링포그 센서 기반 측정으로 추적 데이터 생성"""
    global current_device_mode, current_manual_grid, current_patrol_index
    last_time = time.time()
    
    while True:
        if not manager.esp32_connection:  # ESP32 연결이 없을 때만 시뮬레이션
            current_time = time.time()
            delta_time = min(current_time - last_time, 0.1)
            last_time = current_time
            
            # 사람 위치 업데이트
            advanced_walking_sim.update_position(delta_time)
            
            # 쿨링포그 위치 업데이트 (모드에 따라)
            advanced_walking_sim.update_device_position(
                current_device_mode, 
                current_manual_grid, 
                current_patrol_index
            )
            
            # 쿨링포그 센서에서 측정한 거리와 방향
            distance = advanced_walking_sim.get_distance_from_device()
            direction = advanced_walking_sim.get_direction_from_device()
            
            # 센서 감지 범위 확인 (1.5m 범위)
            human_detected = distance <= 1.5
            
            # 추적 데이터 전송
            tracking_data = {
                "type": "tracking_data",
                "timestamp": int(time.time()),
                "data": {
                    "human_detected": human_detected,
                    "distance": round(distance, 1) if human_detected else 0.0,
                    "direction": direction if human_detected else "중앙"
                }
            }
            
            # 위치 데이터도 함께 전송 (프론트엔드 위치 동기화용)
            position_data = {
                "type": "position_data",
                "timestamp": int(time.time()),
                "data": {
                    "device_position": advanced_walking_sim.get_device_position_for_frontend(),
                    "human_position": advanced_walking_sim.get_human_position_for_frontend() if human_detected else None,
                    "device_mode": current_device_mode
                }
            }
            
            await manager.broadcast_json(tracking_data)
            await manager.broadcast_json(position_data)
        
        await asyncio.sleep(0.3)  # 300ms마다 업데이트

# 순찰 모드 업데이트 함수 추가
async def update_patrol_position(patrol_index: int):
    """순찰 모드에서 위치 업데이트"""
    global current_patrol_index
    current_patrol_index = patrol_index
    await update_device_mode("끄기", patrol_index=patrol_index)

async def generate_tracking_data():
    """추적 데이터 생성 - 새로운 센서 기반 시스템 사용"""
    await generate_advanced_walking_data()

# 기존 시뮬레이션 함수들 (선택적 사용)
async def generate_realistic_tracking_data():
    """더 현실적인 추적 데이터 - 사람이 실제로 움직이는 패턴"""
    movement_pattern = [
        {"direction": "북쪽", "distance": 0.8, "duration": 5},
        {"direction": "북동쪽", "distance": 1.2, "duration": 3},
        {"direction": "동쪽", "distance": 1.5, "duration": 4},
        {"direction": "남동쪽", "distance": 0.7, "duration": 3},
        {"direction": "남쪽", "distance": 0.6, "duration": 5},
        {"direction": "남서쪽", "distance": 1.0, "duration": 3},
        {"direction": "서쪽", "distance": 1.3, "duration": 4},
        {"direction": "북서쪽", "distance": 0.9, "duration": 3},
    ]
    
    pattern_index = 0
    step_count = 0
    
    while True:
        if not manager.esp32_connection:  # ESP32 연결이 없을 때만 시뮬레이션
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
        if not manager.esp32_connection:
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