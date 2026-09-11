from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: str
    phone_number: Optional[str] = None
    timezone: str = "Asia/Dhaka"
    accountability_tone: str = "harsh"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class AvailabilitySlotCreate(BaseModel):
    day_of_week: int # 0=Monday, 6=Sunday
    start_time: str # "19:00"
    end_time: str   # "22:00"
    capacity_minutes: int

class AvailabilitySlotResponse(AvailabilitySlotCreate):
    id: str
    user_id: str
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_minutes: int = 60
    priority: str = "medium"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_minutes: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None

class TaskScheduleRequest(BaseModel):
    task_ids: Optional[List[str]] = None
    raw_tasks_text: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    user_id: str
    roadmap_id: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: str
    google_calendar_event_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class CustomRoadmapRequest(BaseModel):
    goal_title: str
    target_duration_months: int = 3
    daily_hours_weekdays: float = 2.0
    daily_hours_weekends: float = 4.0
    milestones_rough_text: str

class RoadmapCreateRequest(BaseModel):
    goal_title: str = "Crack GSoC in 5 Months from Zero"
    target_duration_months: int = 5
    daily_hours_weekdays: float = 2.0
    daily_hours_weekends: float = 4.0

class RoadmapResponse(BaseModel):
    id: str
    goal_title: str
    target_duration_months: int
    status: str
    overview: Dict[str, Any]
    created_at: datetime
    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    weekly_completion_rate: float
    today_tasks: List[TaskResponse]
    upcoming_tasks: List[TaskResponse]
    all_tasks: List[TaskResponse] = []
