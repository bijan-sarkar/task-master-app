import os

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        ENVIRONMENT: str = "development"
        PORT: int = 8000
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./taskmanager.db")
        SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
        SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
        SMTP_USER: str = os.getenv("SMTP_USER", "")
        SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
        EMAIL_FROM: str = os.getenv("EMAIL_FROM", "Task Master <noreply@taskmaster.dev>")
        WHATSAPP_CLOUD_API_TOKEN: str = os.getenv("WHATSAPP_CLOUD_API_TOKEN", "")
        WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "verify_secret")
        GOOGLE_APPLICATION_CREDENTIALS_JSON: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

        class Config:
            env_file = ".env"
            extra = "ignore"
except ImportError:
    class Settings:
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        PORT: int = int(os.getenv("PORT", "8000"))
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./taskmanager.db")
        SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
        SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
        SMTP_USER: str = os.getenv("SMTP_USER", "")
        SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
        EMAIL_FROM: str = os.getenv("EMAIL_FROM", "Task Master <noreply@taskmaster.dev>")
        WHATSAPP_CLOUD_API_TOKEN: str = os.getenv("WHATSAPP_CLOUD_API_TOKEN", "")
        WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "verify_secret")
        GOOGLE_APPLICATION_CREDENTIALS_JSON: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = Settings()
