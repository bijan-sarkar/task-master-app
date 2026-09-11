from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models, schemas
from services.scheduler import allocate_tasks_to_free_time
from services.roadmap import generate_gsoc_5month_curriculum, generate_custom_curriculum
from services.email_service import generate_accountability_message, send_email_notification
from services.calendar_service import generate_google_calendar_url
from services.whatsapp_service import send_whatsapp_message

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Master & Accountability Engine API",
    description="Backend API for scheduling tasks, custom roadmaps, email alerts, Google Calendar sync, and tough-love accountability notifications.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "system": "Task Master API", "timestamp": datetime.utcnow()}

# ==================== USER ENDPOINTS ====================
@app.post("/api/users", response_model=schemas.UserResponse)
def create_or_get_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        return existing
    new_user = models.User(
        email=user_data.email,
        name=user_data.name,
        phone_number=user_data.phone_number,
        timezone=user_data.timezone,
        accountability_tone=user_data.accountability_tone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== AVAILABILITY SLOTS ====================
@app.post("/api/availability/{user_id}")
def set_availability(user_id: str, slots: List[schemas.AvailabilitySlotCreate], db: Session = Depends(get_db)):
    db.query(models.AvailabilitySlot).filter(models.AvailabilitySlot.user_id == user_id).delete()
    for s in slots:
        new_slot = models.AvailabilitySlot(
            user_id=user_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time,
            end_time=s.end_time,
            capacity_minutes=s.capacity_minutes
        )
        db.add(new_slot)
    db.commit()
    return {"status": "success", "count": len(slots)}

@app.get("/api/availability/{user_id}", response_model=List[schemas.AvailabilitySlotResponse])
def get_availability(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.AvailabilitySlot).filter(models.AvailabilitySlot.user_id == user_id).all()

# ==================== TASK & SCHEDULING ====================
@app.post("/api/tasks/create/{user_id}", response_model=schemas.TaskResponse)
def create_single_task(user_id: str, task_in: schemas.TaskCreate, db: Session = Depends(get_db)):
    task = models.Task(
        user_id=user_id,
        title=task_in.title,
        description=task_in.description,
        estimated_minutes=task_in.estimated_minutes,
        priority=task_in.priority
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task_details(task_id: str, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.estimated_minutes is not None:
        task.estimated_minutes = task_update.estimated_minutes
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.status is not None:
        task.status = task_update.status
        if task_update.status == "completed":
            task.completed_at = datetime.utcnow()
    if task_update.scheduled_start is not None:
        task.scheduled_start = task_update.scheduled_start
    if task_update.scheduled_end is not None:
        task.scheduled_end = task_update.scheduled_end

    if task.scheduled_start and task.scheduled_end:
        task.google_calendar_event_id = generate_google_calendar_url(
            title=task.title,
            description=task.description or "Task scheduled via Task Master",
            start_dt=task.scheduled_start,
            end_dt=task.scheduled_end
        )

    db.commit()
    db.refresh(task)
    return task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"status": "deleted", "task_id": task_id}

@app.post("/api/tasks/bulk-raw/{user_id}")
def parse_and_create_raw_tasks(user_id: str, raw_text: str, db: Session = Depends(get_db)):
    lines = [line.strip("- *• \t\r") for line in raw_text.splitlines() if line.strip()]
    created_tasks = []
    for line in lines:
        task = models.Task(
            user_id=user_id,
            title=line,
            estimated_minutes=60,
            priority="medium"
        )
        db.add(task)
        created_tasks.append(task)
    db.commit()
    return {"status": "created", "tasks_count": len(created_tasks)}

@app.post("/api/tasks/schedule/{user_id}")
def trigger_task_scheduling(user_id: str, db: Session = Depends(get_db)):
    user_slots = db.query(models.AvailabilitySlot).filter(models.AvailabilitySlot.user_id == user_id).all()
    if not user_slots:
        raise HTTPException(status_code=400, detail="Please set up your free-time availability slots first.")

    unscheduled_tasks = db.query(models.Task).filter(
        models.Task.user_id == user_id,
        models.Task.status == "pending",
        models.Task.scheduled_start == None
    ).all()

    if not unscheduled_tasks:
        return {"status": "no_tasks_to_schedule", "scheduled_count": 0}

    allocations = allocate_tasks_to_free_time(unscheduled_tasks, user_slots)
    
    for alloc in allocations:
        task = db.query(models.Task).filter(models.Task.id == alloc["task_id"]).first()
        if task:
            task.scheduled_start = alloc["scheduled_start"]
            task.scheduled_end = alloc["scheduled_end"]
            task.google_calendar_event_id = generate_google_calendar_url(
                title=task.title,
                description=task.description or "Task scheduled via Task Master",
                start_dt=task.scheduled_start,
                end_dt=task.scheduled_end
            )
    
    db.commit()
    return {"status": "success", "scheduled_count": len(allocations), "allocations": allocations}

@app.patch("/api/tasks/{task_id}/status")
def update_task_status(task_id: str, status: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status
    if status == "completed":
        task.completed_at = datetime.utcnow()
    db.commit()
    return {"status": "updated", "task_id": task.id, "new_status": task.status}

# ==================== DASHBOARD SUMMARY ====================
@app.get("/api/dashboard/{user_id}", response_model=schemas.DashboardSummary)
def get_dashboard_data(user_id: str, db: Session = Depends(get_db)):
    tasks = db.query(models.Task).filter(models.Task.user_id == user_id).order_by(models.Task.created_at.desc()).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "completed")
    pending = sum(1 for t in tasks if t.status == "pending")
    overdue = sum(1 for t in tasks if t.status in ["pending", "in_progress"] and t.scheduled_end and t.scheduled_end < datetime.utcnow())

    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    today_tasks = [t for t in tasks if t.scheduled_start and today_start <= t.scheduled_start < today_end]
    upcoming_tasks = [t for t in tasks if t.scheduled_start and t.scheduled_start >= today_end][:10]

    return schemas.DashboardSummary(
        total_tasks=total,
        completed_tasks=completed,
        pending_tasks=pending,
        overdue_tasks=overdue,
        weekly_completion_rate=completion_rate,
        today_tasks=today_tasks,
        upcoming_tasks=upcoming_tasks,
        all_tasks=tasks
    )

# ==================== ROADMAPS (CUSTOM & PRESETS) ====================
@app.post("/api/roadmap/custom/{user_id}")
def generate_and_populate_custom_roadmap(user_id: str, payload: schemas.CustomRoadmapRequest, db: Session = Depends(get_db)):
    curriculum = generate_custom_curriculum(
        goal_title=payload.goal_title,
        duration_months=payload.target_duration_months,
        rough_notes=payload.milestones_rough_text
    )

    roadmap = models.Roadmap(
        user_id=user_id,
        goal_title=curriculum["title"],
        target_duration_months=payload.target_duration_months,
        overview=curriculum
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    # Populate tasks from the generated curriculum into database
    tasks_to_create = []
    for phase in curriculum["phases"]:
        for week in phase["weeks"]:
            for item in week["tasks"]:
                t = models.Task(
                    user_id=user_id,
                    roadmap_id=roadmap.id,
                    title=f"[M{phase['month']} - W{week['week']}] {item['title']}",
                    description=f"Phase: {phase['theme']} | Focus: {week['focus']}",
                    estimated_minutes=item["minutes"],
                    priority=item["priority"]
                )
                tasks_to_create.append(t)
    
    db.add_all(tasks_to_create)
    db.commit()

    return {
        "status": "success",
        "roadmap_id": roadmap.id,
        "phases_count": len(curriculum["phases"]),
        "total_tasks_generated": len(tasks_to_create),
        "curriculum": curriculum
    }

@app.post("/api/roadmap/gsoc/{user_id}")
def generate_and_populate_gsoc_roadmap(user_id: str, db: Session = Depends(get_db)):
    curriculum = generate_gsoc_5month_curriculum()
    
    roadmap = models.Roadmap(
        user_id=user_id,
        goal_title=curriculum["title"],
        target_duration_months=5,
        overview=curriculum
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    tasks_to_create = []
    for phase in curriculum["phases"]:
        for week in phase["weeks"]:
            for item in week["tasks"]:
                t = models.Task(
                    user_id=user_id,
                    roadmap_id=roadmap.id,
                    title=f"[Month {phase['month']} - Week {week['week']}] {item['title']}",
                    description=f"Phase: {phase['theme']} | Focus: {week['focus']}",
                    estimated_minutes=item["minutes"],
                    priority=item["priority"]
                )
                tasks_to_create.append(t)
    
    db.add_all(tasks_to_create)
    db.commit()

    return {
        "status": "success",
        "roadmap_id": roadmap.id,
        "phases_count": len(curriculum["phases"]),
        "total_tasks_generated": len(tasks_to_create),
        "curriculum": curriculum
    }

# ==================== TEST NOTIFICATION ====================
@app.post("/api/notifications/test-reminder/{task_id}")
def trigger_test_reminder(task_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    user = db.query(models.User).filter(models.User.id == task.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    content = generate_accountability_message(
        task_title=task.title,
        time_left_str="45 minutes",
        tone=user.accountability_tone or "harsh"
    )

    if user.email:
        background_tasks.add_task(
            send_email_notification,
            to_email=user.email,
            subject=content["subject"],
            body_text=content["body"]
        )

    if user.phone_number:
        background_tasks.add_task(
            send_whatsapp_message,
            to_phone=user.phone_number,
            message_text=f"{content['subject']}\n\n{content['body']}"
        )

    return {"status": "dispatched", "task": task.title, "preview": content}
