import urllib.parse
from datetime import datetime
from typing import Dict, Any, Optional

def generate_google_calendar_url(title: str, description: str, start_dt: datetime, end_dt: datetime) -> str:
    """
    Generates a 1-click Google Calendar Web Add URL.
    Does not require Google Cloud OAuth tokens and works immediately for any user.
    """
    start_str = start_dt.strftime("%Y%m%dT%H%M%SZ")
    end_str = end_dt.strftime("%Y%m%dT%H%M%SZ")
    
    params = {
        "action": "TEMPLATE",
        "text": title,
        "details": description,
        "dates": f"{start_str}/{end_str}"
    }
    return "https://calendar.google.com/calendar/render?" + urllib.parse.urlencode(params)

def sync_task_to_google_calendar_api(task_data: Dict[str, Any], credentials_json_path: Optional[str] = None) -> Optional[str]:
    """
    Uses official Google Calendar API if service account or client credentials exist.
    Returns event ID or None.
    """
    if not credentials_json_path:
        # Fall back to web URL generator
        return None

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        SCOPES = ['https://www.googleapis.com/auth/calendar']
        creds = service_account.Credentials.from_service_account_file(credentials_json_path, scopes=SCOPES)
        service = build('calendar', 'v3', credentials=creds)

        event = {
            'summary': task_data['title'],
            'description': task_data.get('description', 'Task managed by Task Master AI'),
            'start': {
                'dateTime': task_data['scheduled_start'].isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': task_data['scheduled_end'].isoformat(),
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 30},
                    {'method': 'popup', 'minutes': 10},
                ],
            },
        }

        created_event = service.events().insert(calendarId='primary', body=event).execute()
        return created_event.get('id')
    except Exception as e:
        print(f"[Google Calendar API Sync Error]: {e}")
        return None
