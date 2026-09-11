import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any
from config import settings

def generate_accountability_message(task_title: str, time_left_str: str, tone: str = "harsh") -> Dict[str, str]:
    if tone == "gentle":
        subject = f"🌱 Gentle Reminder: {task_title}"
        body = (
            f"Hi there,\n\n"
            f"Just a friendly check-in! You have '{task_title}' scheduled with {time_left_str} remaining.\n"
            f"Take a deep breath and start with a single step. You've got this!\n\n"
            f"— Your Accountability Companion"
        )
    elif tone == "firm":
        subject = f"⏱️ Action Required: {time_left_str} left for {task_title}"
        body = (
            f"Attention:\n\n"
            f"You committed to finishing '{task_title}' today. There are currently {time_left_str} remaining in your scheduled block.\n"
            f"Consistency is what separates ambition from achievement. Please log on and complete your task now.\n\n"
            f"— Task Master"
        )
    elif tone == "roast":
        subject = f"🔥 Stop Scrolling: {task_title} is waiting while you waste time"
        body = (
            f"Are you serious right now?\n\n"
            f"You want to crack GSoC and become a top-tier engineer, yet you're currently staring at feeds while '{task_title}' sits untouched with only {time_left_str} left.\n"
            f"No mentor is going to select someone who can't even sit down for their scheduled free time.\n"
            f"Close the tabs. Put the phone in another room. Write the code.\n\n"
            f"— Tough Love AI"
        )
    else:  # "harsh" (default)
        subject = f"⚠️ WAKE UP: {time_left_str} left on '{task_title}'"
        body = (
            f"Notice of Unfinished Commitment:\n\n"
            f"You scheduled your free time specifically for: '{task_title}'.\n"
            f"Time left until deadline: {time_left_str}.\n"
            f"Progress: 0% recorded.\n\n"
            f"Goals don't happen by accident. If you skip today, you'll skip tomorrow. Get up, open your workspace, and finish what you started.\n\n"
            f"— Task Master Accountability Engine"
        )
    return {"subject": subject, "body": body}

def send_email_notification(to_email: str, subject: str, body_text: str) -> bool:
    """
    Sends an email using standard SMTP.
    If SMTP_USER is not provided, logs to console (useful for dev/test mode).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[DEV MODE - Email Mock] To: {to_email} | Subject: {subject}\nBody:\n{body_text}\n" + "-"*50)
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body_text, 'plain'))

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[Email Sent Successfully] To: {to_email}")
        return True
    except Exception as e:
        print(f"[Email Send Error]: {e}")
        return False
