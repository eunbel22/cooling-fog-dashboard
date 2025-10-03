from sqlalchemy import Column, Integer, String, Time, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), index=True)
    title = Column(String(100))
    start_time = Column(Time)
    end_time = Column(Time)
    days_of_week = Column(JSON)  # [1,2,3,4,5] for Mon-Fri
    mode = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    