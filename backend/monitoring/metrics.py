"""Prometheus metrics configuration for FairPact API."""
from typing import Callable
from prometheus_fastapi_instrumentator import Instrumentator, metrics
from prometheus_fastapi_instrumentator.metrics import Info
from prometheus_client import Counter, Histogram, Gauge
import time

# Initialize Instrumentator with configuration
instrumentator = Instrumentator(
    should_group_status_codes=False,  # Track individual status codes
    should_ignore_untemplated=True,   # Ignore non-templated paths (404s etc)
    should_respect_env_var=True,      # Allow disabling with ENABLE_METRICS=false
    should_instrument_requests_inprogress=True,  # Track concurrent requests
    excluded_handlers=["/health/live", "/health/ready", "/metrics"],  # Exclude health checks
    env_var_name="ENABLE_METRICS",
    inprogress_name="http_requests_inprogress",
    inprogress_labels=True,
)

# Add default metrics
instrumentator.add(metrics.default())
instrumentator.add(metrics.latency())
instrumentator.add(metrics.requests())

# Custom metric: Unique visitor sessions
visitor_sessions_total = Counter(
    "visitor_sessions_total",
    "Total number of unique visitor sessions",
    labelnames=("user_type",)  # guest or authenticated
)

# Custom metric: Document uploads
document_uploads_total = Counter(
    "document_uploads_total",
    "Total number of documents uploaded",
    labelnames=("file_type", "status")  # file_type: pdf, docx, image | status: success, error
)

# Custom metric: Analysis duration
analysis_duration_seconds = Histogram(
    "analysis_duration_seconds",
    "Time spent analyzing documents",
    labelnames=("analysis_type",),  # ocr, nlp, vector_search, gemini
    buckets=(0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0)
)

# Custom metric: Active users
active_users_gauge = Gauge(
    "active_users_total",
    "Number of active users in the last time window",
    labelnames=("time_window",)  # 5m, 1h, 24h
)

# Custom metric: Endpoint requests by status
endpoint_requests_by_status = Counter(
    "endpoint_requests_by_status_total",
    "Number of requests per endpoint and status code",
    labelnames=("method", "endpoint", "status_code")
)


def track_endpoint_requests() -> Callable[[Info], None]:
    """
    Custom metric function to track requests per endpoint with status codes.
    This provides more granular data than default metrics.
    """
    def instrumentation(info: Info) -> None:
        if info.modified_handler:  # Only track templated endpoints
            endpoint_requests_by_status.labels(
                method=info.method,
                endpoint=info.modified_handler,
                status_code=info.response.status_code
            ).inc()
    
    return instrumentation


def track_response_size() -> Callable[[Info], None]:
    """
    Custom metric to track response sizes for bandwidth monitoring.
    """
    METRIC = Histogram(
        "http_response_size_bytes",
        "HTTP response size in bytes",
        labelnames=("method", "endpoint"),
        buckets=(100, 1000, 10000, 100000, 1000000, 10000000)
    )
    
    def instrumentation(info: Info) -> None:
        if info.modified_handler:
            content_length = info.response.headers.get("content-length", "0")
            try:
                size = int(content_length)
                METRIC.labels(
                    method=info.method,
                    endpoint=info.modified_handler
                ).observe(size)
            except (ValueError, TypeError):
                pass
    
    return instrumentation


# Register custom metrics
instrumentator.add(track_endpoint_requests())
instrumentator.add(track_response_size())


# Helper functions for use in application code
def record_visitor_session(user_type: str = "guest"):
    """Record a new visitor session."""
    visitor_sessions_total.labels(user_type=user_type).inc()


def record_document_upload(file_type: str, status: str = "success"):
    """Record a document upload."""
    document_uploads_total.labels(file_type=file_type, status=status).inc()


def record_analysis_duration(analysis_type: str, duration: float):
    """Record analysis duration."""
    analysis_duration_seconds.labels(analysis_type=analysis_type).observe(duration)


def update_active_users(time_window: str, count: int):
    """Update active users count."""
    active_users_gauge.labels(time_window=time_window).set(count)


class AnalysisTimer:
    """Context manager for timing analysis operations."""
    
    def __init__(self, analysis_type: str):
        self.analysis_type = analysis_type
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        record_analysis_duration(self.analysis_type, duration)
