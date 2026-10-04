import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "iTantra - Indian Multilingual Neural Transceiver Platform"
    PROJECT_SUBTITLE: str = "Indian Multilingual TTS & STT Aided Neural Transceiver Radio Access"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "itantra-super-secret-jwt-token-key-2026-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./itantra.db"
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    AUDIO_STORAGE_PATH: str = os.path.join(BASE_DIR, "audio")
    MODELS_STORAGE_PATH: str = os.path.join(BASE_DIR, "models")
    DATASETS_STORAGE_PATH: str = os.path.join(BASE_DIR, "datasets")
    
    # Demo and Seed Admin
    DEMO_MODE: bool = False
    DEFAULT_ADMIN_EMAIL: str = "admin@itantra.ai"
    DEFAULT_ADMIN_PASSWORD: str = "AdminPassword123!"
    DEFAULT_DEMO_USER_EMAIL: str = "pilot@itantra.ai"
    DEFAULT_DEMO_USER_PASSWORD: str = "UserPassword123!"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure directories exist
for folder in ["inputs", "outputs", "samples"]:
    os.makedirs(os.path.join(settings.AUDIO_STORAGE_PATH, folder), exist_ok=True)
os.makedirs(settings.MODELS_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.DATASETS_STORAGE_PATH, exist_ok=True)
