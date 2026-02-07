"""FairPact API - Contract Analysis Application."""
from api.admin import router as admin_router
from api.analysis import router as analysis_router
from api.auth import router as auth_router
from api.documents import router as documents_router
from api.health import router as health_router
from api.jobs import router as jobs_router
from config import settings
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from middleware import UserTrackingMiddleware
from monitoring import instrumentator
from prometheus_client import REGISTRY, generate_latest
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

# Initialize Sentry if DSN is configured
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        traces_sample_rate=1.0,  # Capture 100% of transactions for performance monitoring
        profiles_sample_rate=1.0,  # Enable profiling
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),  # Track requests by endpoint
            CeleryIntegration(),  # Automatically capture Celery task errors
        ],
        send_default_pii=True,  # Include user IP and headers (optional, adjust for privacy)
    )

# Create FastAPI app
app = FastAPI(
    title="FairPact API",
    description="Contract analysis API for identifying prohibited clauses",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add user tracking middleware for metrics
app.add_middleware(UserTrackingMiddleware)

# Include routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(jobs_router)
app.include_router(analysis_router)
app.include_router(admin_router)


@app.get("/")
def read_root() -> dict:
    """Root endpoint."""
    return {
        "message": "Welcome to FairPact API",
        "version": "0.1.0",
        "docs": "/docs",
    }


# Initialize Prometheus metrics instrumentation
instrumentator.instrument(app)


@app.get("/metrics")
def metrics() -> Response:
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(REGISTRY), media_type="text/plain")


