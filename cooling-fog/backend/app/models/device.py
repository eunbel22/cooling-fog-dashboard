from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    status = Column(String(20), default="inactive")
    is_running = Column(Boolean, default=False)
    spray_intensity = Column(Integer, default=0)
    tracking_mode = Column(String(20), default="자동")
    location = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())