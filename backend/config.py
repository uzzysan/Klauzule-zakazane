"""Application configuration using Pydantic settings."""
from functools import lru_cache
from typing import List

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_env: str = "development"
    debug: bool = True
    api_version: str = "v1"

    # Database
    database_url: SecretStr
    database_pool_size: int = 20
    database_max_overflow: int = 10

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_password: str = ""

    # Authentication
    secret_key: SecretStr
    jwt_secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: SecretStr = SecretStr("")

    # Storage (MinIO/S3)
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str
    minio_secret_key: SecretStr
    minio_bucket_name: str = "fairpact-uploads"
    minio_secure: bool = False

    # Guest file retention
    guest_file_retention_hours: int = 24

    # OCR
    tesseract_cmd: str = "/usr/bin/tesseract"
    tesseract_languages: str = "pol+eng"

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]

    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_guest: int = 10
    rate_limit_free: int = 60
    rate_limit_pro: int = 300

    # External APIs
    gemini_api_key: SecretStr = SecretStr("")

    # Monitoring
    sentry_dsn: str = ""
    sentry_environment: str = "development"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: str | List[str]) -> List[str]:
        """Parse comma-separated origins string into list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings instance
settings = get_settings()
