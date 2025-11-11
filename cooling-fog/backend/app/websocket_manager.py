async def handle_esp32_data(data: dict):
    """ESP32/라즈베리파이에서 받은 센서 데이터 처리"""
    data_type = data.get('type')
    
    if data_type == 'sensor_data':
        # 데이터 구조 수정: data.data.temperature 접근
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
        print(f"📍 위치 데이터 수신: 그리드 {position_data.get('current_grid')}")
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
        print(f"📷 카메라 상태: {camera_data.get('status')}")
        await manager.broadcast_json(camera_message)
        
    elif data_type == 'tracking_data':
        # 기존 tracking_data 처리 (하위 호환성)
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