from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────────────────────
    PROJECT_NAME: str = "AI Pothole Detection API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"  # "development" | "production"
    PORT: int = 7860
    LOG_LEVEL: str = "INFO"

    # ── AI Model ──────────────────────────────────────────────────────────────
    MODEL_PATH: str = "yolov12l.pt"
    CONFIDENCE_THRESHOLD: float = 0.25
    MAX_IMAGE_SIZE_MB: int = 10  # reject payloads bigger than this

    # ── Cloudinary ────────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # ── MongoDB ───────────────────────────────────────────────────────────────
    MONGO_URI: str
    DATABASE_NAME: str = "SmartCityDB"
    COLLECTION_NAME: str = "PotholeLogs"
    MONGO_TIMEOUT_MS: int = 5000  # Connection / server-selection timeout

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins. "*" in production is insecure;
    # override via env var: ALLOWED_ORIGINS="https://your-app.vercel.app"
    ALLOWED_ORIGINS: str = "*"

    @field_validator("CONFIDENCE_THRESHOLD")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("CONFIDENCE_THRESHOLD must be between 0.0 and 1.0")
        return v

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        if v.upper() not in valid:
            raise ValueError(f"LOG_LEVEL must be one of {valid}")
        return v.upper()

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse ALLOWED_ORIGINS into a Python list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
