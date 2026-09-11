import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Time, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    accountability_tone = Column(String, default="harsh") # gentle, firm, harsh, roast
    created_at = Column(DateTime, default=datetime.utcnow)

    availability_slots = relationship("AvailabilitySlot", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")

class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False) # 0=Mon, 6=Sun
    start_time = Column(String, nullable=False) # e.g. "19:00"
    end_time = Column(String, nullable=False)   # e.g. "22:00"
    capacity_minutes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="availability_slots")

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    goal_title = Column(String, nullable=False)
    target_duration_months = Column(Integer, default=5)
    overview = Column(JSON, nullable=True)
    status = Column(String, default="active") # active, completed, paused
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
    tasks = relationship("Task", back_populates="roadmap")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    roadmap_id = Column(String, ForeignKey("roadmaps.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    estimated_minutes = Column(Integer, default=60)
    scheduled_start = Column(DateTime, nullable=True)
    scheduled_end = Column(DateTime, nullable=True)
    status = Column(String, default="pending") # pending, in_progress, completed, overdue
    priority = Column(String, default="medium") # low, medium, high
    google_calendar_event_id = Column(String, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tasks")
    roadmap = relationship("Roadmap", back_populates="tasks")
    notifications = relationship("NotificationLog", back_populates="task", cascade="all, delete-orphan")

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    channel = Column(String, nullable=False) # email, whatsapp
    escalation_level = Column(String, nullable=False) # gentle, firm, harsh
    message_content = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="notifications")
