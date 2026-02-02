"""Celery application configuration."""
from celery import Celery
from celery.schedules import crontab
from config import settings
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration

# Initialize Sentry if DSN is configured
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        integrations=[CeleryIntegration()],
    )

# Create Celery app
celery_app = Celery(
    "fairpact",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["tasks.document_processing", "tasks.sync"],
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=270,  # 4.5 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

# Task routing (optional - for future scaling)
celery_app.conf.task_routes = {
    "tasks.process_document": {"queue": "documents"},
    "tasks.test_celery": {"queue": "documents"},
    "tasks.sync.sync_prohibited_clauses": {"queue": "sync"},
}

# Celery Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "sync-prohibited-clauses-daily": {
        "task": "tasks.sync.sync_prohibited_clauses",
        "schedule": crontab(hour=3, minute=0),  # Run daily at 3:00 AM UTC
        "options": {"queue": "sync"},
    },
}
