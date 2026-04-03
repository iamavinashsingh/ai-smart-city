from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "AI Pothole Detection API"
    MODEL_PATH: str = "yolov12l.pt"
    PORT: int = 8000
    
    # Cloudinary Settings
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    
    # MongoDB Settings
    MONGO_URI: str
    DATABASE_NAME: str = "SmartCityDB"
    COLLECTION_NAME: str = "PotholeLogs"

    model_config = SettingsConfigDict(env_file=str(Path(__file__).parent.parent.parent / ".env"))

settings = Settings()
