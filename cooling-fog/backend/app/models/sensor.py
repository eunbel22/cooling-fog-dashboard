from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class SensorData(Base):
    __tablename__ = "sensor_data"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    battery_level = Column(Float)
    water_tank_level = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class TrackingData(Base):
    __tablename__ = "tracking_data"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), index=True)
    human_detected = Column(Boolean, default=False)
    distance = Column(Float)
    direction = Column(String(20))
    spray_active = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())