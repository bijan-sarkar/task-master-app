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

class DIUSemester(Base):
    __tablename__ = "diu_semesters"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False) # e.g. "Semester 3 (Level 2 Term 1)"
    term = Column(String, nullable=False, default="Spring 2025") # e.g. "Spring 2025"
    department = Column(String, nullable=False, default="CSE") # CSE, SWE, CIS, EEE
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    courses = relationship("DIUCourse", back_populates="semester", cascade="all, delete-orphan")

class DIUCourse(Base):
    __tablename__ = "diu_courses"

    id = Column(String, primary_key=True, default=generate_uuid)
    semester_id = Column(String, ForeignKey("diu_semesters.id"), nullable=False)
    code = Column(String, nullable=False, index=True) # e.g. "CSE221"
    name = Column(String, nullable=False) # e.g. "Data Structures"
    credits = Column(String, default="3.0")
    department = Column(String, default="CSE")
    description = Column(Text, nullable=True)
    prerequisites_guide = Column(JSON, nullable=True) # foundational requirements, tips for A+, pitfalls
    target_grade = Column(String, default="A+")
    created_at = Column(DateTime, default=datetime.utcnow)

    semester = relationship("DIUSemester", back_populates="courses")
    topics = relationship("DIUTopic", back_populates="course", cascade="all, delete-orphan")
    past_questions = relationship("DIUPastQuestion", back_populates="course", cascade="all, delete-orphan")

class DIUTopic(Base):
    __tablename__ = "diu_topics"

    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("diu_courses.id"), nullable=False)
    name = Column(String, nullable=False)
    exam_term = Column(String, nullable=False) # "midterm" or "final"
    priority_stars = Column(Integer, default=5) # 1 to 5
    priority_label = Column(String, default="Critical") # Critical, High, Medium, Low
    importance_score = Column(Integer, default=90) # 0 to 100
    repeat_frequency = Column(String, default="Frequently asked") # e.g. "Appeared in 6/7 recent DIU exams"
    marks_weightage = Column(String, default="10 - 15 marks")
    expected_question_types = Column(JSON, default=list) # ["code", "dry_run", "difference"]
    status = Column(String, default="pending") # "pending", "learning", "mastered"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("DIUCourse", back_populates="topics")

class DIUPastQuestion(Base):
    __tablename__ = "diu_past_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("diu_courses.id"), nullable=True)
    course_code = Column(String, nullable=False, index=True) # e.g. "CSE221"
    exam_term = Column(String, nullable=False) # "midterm" or "final"
    exam_session = Column(String, nullable=False) # e.g. "Fall 2024", "Spring 2024"
    question_type = Column(String, nullable=False) # "code", "dry_run", "theory", "difference", "math", "diagram"
    question_text = Column(Text, nullable=False)
    marks = Column(Integer, default=5)
    topic_name = Column(String, nullable=True)
    solution_hints = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("DIUCourse", back_populates="past_questions")

