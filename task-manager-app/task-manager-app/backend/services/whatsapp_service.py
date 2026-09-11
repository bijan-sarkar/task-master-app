import os
import requests
from typing import Dict, Any, Optional
from config import settings

def send_whatsapp_message(to_phone: str, message_text: str, template_name: Optional[str] = None, params: Optional[list] = None) -> Dict[str, Any]:
    """
    Dispatches a message using Meta WhatsApp Cloud API.
    If tokens are not set, runs in mock dev mode.
    """
    if not settings.WHATSAPP_CLOUD_API_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
        print(f"[DEV MODE - WhatsApp Mock] To: {to_phone}\nMessage:\n{message_text}\n" + "-"*50)
        return {"status": "mock_sent", "recipient": to_phone}

    url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_CLOUD_API_TOKEN}",
        "Content-Type": "application/json"
    }

    if template_name and params:
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en_US"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": str(p)} for p in params]
                    }
                ]
            }
        }
    else:
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {"body": message_text}
        }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        return response.json()
    except Exception as e:
        print(f"[WhatsApp Cloud API Error]: {e}")
        return {"error": str(e)}
