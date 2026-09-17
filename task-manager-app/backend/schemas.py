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

# ==================== DIU SEMESTER TRACKER SCHEMAS ====================
class DIUTopicResponse(BaseModel):
    id: str
    course_id: str
    name: str
    exam_term: str # "midterm" or "final"
    priority_stars: int
    priority_label: str
    importance_score: int
    repeat_frequency: str
    marks_weightage: str
    expected_question_types: List[str] = []
    status: str
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class DIUTopicStatusUpdate(BaseModel):
    status: str # "pending", "learning", "mastered"

class DIUPastQuestionCreate(BaseModel):
    course_code: str
    exam_term: str # "midterm" or "final"
    exam_session: str # "Fall 2024", etc.
    question_type: str # "code", "dry_run", "theory", "difference", "math", "diagram"
    question_text: str
    marks: int = 5
    topic_name: Optional[str] = None
    solution_hints: Optional[str] = None

class DIUPastQuestionResponse(DIUPastQuestionCreate):
    id: str
    course_id: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class DIUCourseCreate(BaseModel):
    code: str
    name: str
    credits: str = "3.0"
    department: str = "CSE"
    description: Optional[str] = None
    prerequisites_guide: Optional[Dict[str, Any]] = None

class DIUCourseResponse(BaseModel):
    id: str
    semester_id: str
    code: str
    name: str
    credits: str
    department: str
    description: Optional[str] = None
    prerequisites_guide: Optional[Dict[str, Any]] = None
    target_grade: str
    created_at: datetime
    topics: List[DIUTopicResponse] = []
    class Config:
        from_attributes = True

class DIUSemesterCreate(BaseModel):
    title: str # e.g. "Semester 3 (Level 2 Term 1)"
    term: str = "Spring 2025"
    department: str = "CSE"

class DIUSemesterResponse(BaseModel):
    id: str
    user_id: str
    title: str
    term: str
    department: str
    is_active: int
    created_at: datetime
    courses: List[DIUCourseResponse] = []
    class Config:
        from_attributes = True

class CourseAnalysisResponse(BaseModel):
    course: DIUCourseResponse
    midterm_topics: List[DIUTopicResponse]
    final_topics: List[DIUTopicResponse]
    past_questions_count: int
    midterm_readiness_pct: float
    final_readiness_pct: float

