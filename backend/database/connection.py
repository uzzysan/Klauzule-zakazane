"""Database connection and session management."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from config import settings


def get_database_url() -> str:
    """Get async database URL."""
    return settings.database_url.get_secret_value().replace(
        "postgresql://", "postgresql+asyncpg://"
    )


# Create async engine for FastAPI (web server context)
engine = create_async_engine(
    get_database_url(),
    echo=settings.debug,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,
)

# Create async session factory for FastAPI
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session (for FastAPI)."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database session (for FastAPI)."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_celery_db_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for database session in Celery tasks.

    Creates a fresh engine and session for each task to avoid
    event loop issues with prefork workers.
    """
    # Create a fresh engine for this task (not shared with other loops)
    task_engine = create_async_engine(
        get_database_url(),
        echo=settings.debug,
        pool_size=5,  # Smaller pool for task
        max_overflow=2,
        pool_pre_ping=True,
    )

    task_session_factory = async_sessionmaker(
        task_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with task_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    # Dispose the engine to clean up connections
    await task_engine.dispose()
