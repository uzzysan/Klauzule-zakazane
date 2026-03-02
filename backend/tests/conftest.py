"""Pytest configuration and fixtures for FairPact backend tests."""
import asyncio
import os
from typing import AsyncGenerator, Generator
from uuid import uuid4

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from api.deps import create_access_token
from database.connection import Base, get_db
from models.user import User


# Test database URL - use PostgreSQL (same instance, different database)
# Uses the same credentials as the development database
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://fairpact:fairpact_dev_pass@localhost:5432/fairpact_test",
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def async_engine():
    """Create async engine for tests."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

    async with engine.begin() as conn:
        # Drop and recreate all tables for clean state
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for tests."""
    async_session_maker = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def app(db_session: AsyncSession) -> FastAPI:
    """Create FastAPI application for tests."""
    from main import app as fastapi_app

    async def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    yield fastapi_app

    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    import bcrypt

    user = User(
        id=uuid4(),
        email="test@example.com",
        hashed_password=bcrypt.hashpw(b"testpassword123", bcrypt.gensalt()).decode("utf-8"),
        full_name="Test User",
        is_active=True,
        is_admin=False,
        is_reviewer=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin test user."""
    import bcrypt

    user = User(
        id=uuid4(),
        email="admin@example.com",
        hashed_password=bcrypt.hashpw(b"adminpassword123", bcrypt.gensalt()).decode("utf-8"),
        full_name="Admin User",
        is_active=True,
        is_admin=True,
        is_reviewer=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def reviewer_user(db_session: AsyncSession) -> User:
    """Create a reviewer test user."""
    import bcrypt

    user = User(
        id=uuid4(),
        email="reviewer@example.com",
        hashed_password=bcrypt.hashpw(b"reviewerpassword123", bcrypt.gensalt()).decode("utf-8"),
        full_name="Reviewer User",
        is_active=True,
        is_admin=False,
        is_reviewer=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def user_token(test_user: User) -> str:
    """Generate JWT token for test user."""
    return create_access_token(test_user.id)


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Generate JWT token for admin user."""
    return create_access_token(admin_user.id)


@pytest.fixture
def reviewer_token(reviewer_user: User) -> str:
    """Generate JWT token for reviewer user."""
    return create_access_token(reviewer_user.id)


def auth_headers(token: str) -> dict:
    """Create authorization headers with JWT token."""
    return {"Authorization": f"Bearer {token}"}
