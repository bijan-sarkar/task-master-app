import time
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Task, User, NotificationLog
from services.email_service import generate_accountability_message, send_email_notification
from services.whatsapp_service import send_whatsapp_message

def check_deadlines_and_notify():
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find pending tasks that have a scheduled_end within the next 60 minutes or are overdue within 3 hours
        lower_bound = now - timedelta(hours=3)
        upper_bound = now + timedelta(minutes=60)

        tasks = db.query(Task).filter(
            Task.status.in_(["pending", "in_progress"]),
            Task.scheduled_end >= lower_bound,
            Task.scheduled_end <= upper_bound
        ).all()

        for task in tasks:
            user = db.query(User).filter(User.id == task.user_id).first()
            if not user:
                continue

            # Calculate time left
            diff = task.scheduled_end - now
            total_seconds = diff.total_seconds()

            if total_seconds > 0:
                mins_left = int(total_seconds / 60)
                time_left_str = f"{mins_left} minutes"
                escalation = "firm"
            else:
                mins_overdue = int(abs(total_seconds) / 60)
                time_left_str = f"OVERDUE by {mins_overdue} minutes"
                escalation = "harsh"

            # Check if notification was already sent in the last 30 minutes
            recent_notif = db.query(NotificationLog).filter(
                NotificationLog.task_id == task.id,
                NotificationLog.sent_at >= now - timedelta(minutes=30)
            ).first()

            if recent_notif:
                continue

            # Generate tone-adjusted message
            content = generate_accountability_message(
                task_title=task.title,
                time_left_str=time_left_str,
                tone=user.accountability_tone or "harsh"
            )

            # Send Email
            if user.email:
                send_email_notification(
                    to_email=user.email,
                    subject=content["subject"],
                    body_text=content["body"]
                )
                db.add(NotificationLog(
                    task_id=task.id,
                    channel="email",
                    escalation_level=escalation,
                    message_content=content["body"]
                ))

            # Send WhatsApp (if phone number is available)
            if user.phone_number:
                send_whatsapp_message(
                    to_phone=user.phone_number,
                    message_text=f"{content['subject']}\n\n{content['body']}"
                )
                db.add(NotificationLog(
                    task_id=task.id,
                    channel="whatsapp",
                    escalation_level=escalation,
                    message_content=content["body"]
                ))

            db.commit()
    except Exception as e:
        print(f"[Worker Error]: {e}")
    finally:
        db.close()

def run_worker_loop():
    print("[Task Master Background Monitor Started] Checking tasks every 60 seconds...")
    while True:
        check_deadlines_and_notify()
        time.sleep(60)

if __name__ == "__main__":
    run_worker_loop()
