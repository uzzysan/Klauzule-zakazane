"""FairPact API - Contract Analysis Application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.analysis import router as analysis_router
from api.documents import router as documents_router
from api.jobs import router as jobs_router
from config import settings

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

# Include routers
app.include_router(documents_router)
app.include_router(jobs_router)
app.include_router(analysis_router)


@app.get("/")
def read_root() -> dict:
    """Root endpoint."""
    return {
        "message": "Welcome to FairPact API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "environment": settings.app_env}
