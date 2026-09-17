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
from services.diu_catalog import get_all_diu_presets, get_course_details, DIU_COURSE_CATALOG

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

# ==================== DIU SEMESTER TRACKER ENDPOINTS ====================
@app.get("/api/diu/presets")
def get_diu_presets():
    """Returns DIU official curricula, semester bundles, and comprehensive course metadata."""
    return get_all_diu_presets()

@app.get("/api/diu/semesters/{user_id}", response_model=List[schemas.DIUSemesterResponse])
def get_user_diu_semesters(user_id: str, db: Session = Depends(get_db)):
    """Retrieves all registered semesters and enrolled courses for a student."""
    return db.query(models.DIUSemester).filter(models.DIUSemester.user_id == user_id).order_by(models.DIUSemester.created_at.desc()).all()

@app.post("/api/diu/semesters/{user_id}", response_model=schemas.DIUSemesterResponse)
def create_user_diu_semester(user_id: str, payload: schemas.DIUSemesterCreate, db: Session = Depends(get_db)):
    """Creates a new semester for the student and sets it as active."""
    # Ensure previous semesters are not marked active if needed
    db.query(models.DIUSemester).filter(models.DIUSemester.user_id == user_id).update({"is_active": 0})
    semester = models.DIUSemester(
        user_id=user_id,
        title=payload.title,
        term=payload.term,
        department=payload.department,
        is_active=1
    )
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return semester

@app.post("/api/diu/courses/enroll/{semester_id}", response_model=schemas.DIUCourseResponse)
def enroll_course(semester_id: str, payload: schemas.DIUCourseCreate, db: Session = Depends(get_db)):
    """Enrolls in a course and automatically loads its topics, past questions, and prerequisite survival guide."""
    semester = db.query(models.DIUSemester).filter(models.DIUSemester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    catalog_data = get_course_details(payload.code)
    course = models.DIUCourse(
        semester_id=semester_id,
        code=payload.code,
        name=payload.name or catalog_data.get("name", payload.code),
        credits=payload.credits or catalog_data.get("credits", "3.0"),
        department=payload.department or catalog_data.get("department", "CSE"),
        description=payload.description or catalog_data.get("description", ""),
        prerequisites_guide=payload.prerequisites_guide or catalog_data.get("prerequisites_guide")
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Automatically populate Midterm topics
    mid_topics = catalog_data.get("midterm_topics", [])
    for t in mid_topics:
        db.add(models.DIUTopic(
            course_id=course.id,
            name=t["name"],
            exam_term="midterm",
            priority_stars=t.get("priority_stars", 5),
            priority_label=t.get("priority_label", "Critical"),
            importance_score=t.get("importance_score", 90),
            repeat_frequency=t.get("repeat_frequency", "Frequently asked"),
            marks_weightage=t.get("marks_weightage", "10 - 15 marks"),
            expected_question_types=t.get("expected_question_types", ["code", "dry_run"]),
            description=t.get("description", ""),
            status="pending"
        ))

    # Automatically populate Final topics
    final_topics = catalog_data.get("final_topics", [])
    for t in final_topics:
        db.add(models.DIUTopic(
            course_id=course.id,
            name=t["name"],
            exam_term="final",
            priority_stars=t.get("priority_stars", 5),
            priority_label=t.get("priority_label", "Critical"),
            importance_score=t.get("importance_score", 90),
            repeat_frequency=t.get("repeat_frequency", "Frequently asked"),
            marks_weightage=t.get("marks_weightage", "10 - 15 marks"),
            expected_question_types=t.get("expected_question_types", ["code", "diagram"]),
            description=t.get("description", ""),
            status="pending"
        ))

    # Automatically populate past questions
    past_qs = catalog_data.get("past_questions", [])
    for q in past_qs:
        db.add(models.DIUPastQuestion(
            course_id=course.id,
            course_code=course.code,
            exam_term=q["exam_term"],
            exam_session=q["exam_session"],
            question_type=q["question_type"],
            question_text=q["question_text"],
            marks=q.get("marks", 5),
            topic_name=q.get("topic_name"),
            solution_hints=q.get("solution_hints")
        ))

    db.commit()
    db.refresh(course)
    return course

@app.delete("/api/diu/courses/{course_id}")
def delete_course(course_id: str, db: Session = Depends(get_db)):
    """Removes an enrolled course and associated topics and past questions."""
    course = db.query(models.DIUCourse).filter(models.DIUCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"status": "deleted", "course_id": course_id}

@app.get("/api/diu/courses/{course_id}/analysis", response_model=schemas.CourseAnalysisResponse)
def get_course_analysis(course_id: str, db: Session = Depends(get_db)):
    """Retrieves full exam preparation analysis for a course, with midterm vs final breakdown, priority ratings, and readiness."""
    course = db.query(models.DIUCourse).filter(models.DIUCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    topics = db.query(models.DIUTopic).filter(models.DIUTopic.course_id == course_id).all()
    midterm_topics = [t for t in topics if t.exam_term == "midterm"]
    final_topics = [t for t in topics if t.exam_term == "final"]

    midterm_topics.sort(key=lambda x: x.priority_stars, reverse=True)
    final_topics.sort(key=lambda x: x.priority_stars, reverse=True)

    mid_mastered = sum(1 for t in midterm_topics if t.status == "mastered")
    mid_pct = round((mid_mastered / len(midterm_topics) * 100), 1) if midterm_topics else 0.0

    final_mastered = sum(1 for t in final_topics if t.status == "mastered")
    final_pct = round((final_mastered / len(final_topics) * 100), 1) if final_topics else 0.0

    past_count = db.query(models.DIUPastQuestion).filter(
        (models.DIUPastQuestion.course_id == course_id) | (models.DIUPastQuestion.course_code == course.code)
    ).count()

    return schemas.CourseAnalysisResponse(
        course=course,
        midterm_topics=midterm_topics,
        final_topics=final_topics,
        past_questions_count=past_count,
        midterm_readiness_pct=mid_pct,
        final_readiness_pct=final_pct
    )

@app.patch("/api/diu/topics/{topic_id}/status")
def update_topic_status(topic_id: str, payload: schemas.DIUTopicStatusUpdate, db: Session = Depends(get_db)):
    """Toggles topic preparation status (pending, learning, mastered)."""
    topic = db.query(models.DIUTopic).filter(models.DIUTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    topic.status = payload.status
    db.commit()
    return {"status": "updated", "topic_id": topic_id, "new_status": topic.status}

@app.get("/api/diu/questions", response_model=List[schemas.DIUPastQuestionResponse])
def get_past_questions(
    course_code: str = None,
    exam_term: str = None,
    question_type: str = None,
    exam_session: str = None,
    db: Session = Depends(get_db)
):
    """Queries previous years' DIU exam questions with multi-filters."""
    query = db.query(models.DIUPastQuestion)
    if course_code:
        query = query.filter(models.DIUPastQuestion.course_code == course_code)
    if exam_term:
        query = query.filter(models.DIUPastQuestion.exam_term == exam_term)
    if question_type:
        query = query.filter(models.DIUPastQuestion.question_type == question_type)
    if exam_session:
        query = query.filter(models.DIUPastQuestion.exam_session == exam_session)
    
    results = query.order_by(models.DIUPastQuestion.created_at.desc()).all()
    
    # If database is fresh and query matched nothing, supplement with catalog questions
    if not results and course_code:
        catalog = get_course_details(course_code)
        preset_qs = catalog.get("past_questions", [])
        filtered = []
        for q in preset_qs:
            if exam_term and q["exam_term"] != exam_term:
                continue
            if question_type and q["question_type"] != question_type:
                continue
            if exam_session and q["exam_session"] != exam_session:
                continue
            filtered.append(models.DIUPastQuestion(
                id=f"preset-{len(filtered)+1}",
                course_code=course_code,
                exam_term=q["exam_term"],
                exam_session=q["exam_session"],
                question_type=q["question_type"],
                question_text=q["question_text"],
                marks=q.get("marks", 5),
                topic_name=q.get("topic_name"),
                solution_hints=q.get("solution_hints")
            ))
        return filtered

    return results

@app.post("/api/diu/questions", response_model=schemas.DIUPastQuestionResponse)
def add_past_question(payload: schemas.DIUPastQuestionCreate, db: Session = Depends(get_db)):
    """Allows students to contribute a past exam question to the question bank."""
    question = models.DIUPastQuestion(
        course_code=payload.course_code,
        exam_term=payload.exam_term,
        exam_session=payload.exam_session,
        question_type=payload.question_type,
        question_text=payload.question_text,
        marks=payload.marks,
        topic_name=payload.topic_name,
        solution_hints=payload.solution_hints
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@app.post("/api/diu/topics/{topic_id}/create-task")
def schedule_topic_study_task(topic_id: str, user_id: str, db: Session = Depends(get_db)):
    """Converts an exam topic into a concrete revision task in the student's task scheduler."""
    topic = db.query(models.DIUTopic).filter(models.DIUTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    course = db.query(models.DIUCourse).filter(models.DIUCourse.id == topic.course_id).first()
    
    types_str = ", ".join(topic.expected_question_types or ["Exam practice"])
    task = models.Task(
        user_id=user_id,
        title=f"[{course.code if course else 'DIU'} {topic.exam_term.title()}] Revise: {topic.name}",
        description=f"Priority: {topic.priority_label} ({topic.priority_stars}★) | Expected Question Types: {types_str} | Marks: {topic.marks_weightage}",
        estimated_minutes=90,
        priority="high" if topic.priority_stars >= 4 else "medium"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"status": "created", "task_id": task.id, "title": task.title}
