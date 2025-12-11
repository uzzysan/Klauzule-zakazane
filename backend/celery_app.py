"""Celery application configuration."""
from celery import Celery

from config import settings

# Create Celery app
celery_app = Celery(
    "fairpact",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["tasks.document_processing"],
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
}
