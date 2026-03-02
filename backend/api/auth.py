"""Authentication API endpoints."""
from datetime import datetime
from typing import Optional
from uuid import UUID

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import create_access_token, get_current_user
from config import settings
from database.connection import get_db
from models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# Pydantic schemas
class UserRegister(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """Schema for user response."""

    id: UUID
    email: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    is_reviewer: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithToken(BaseModel):
    """Schema for user with token response."""

    user: UserResponse
    token: TokenResponse


# Endpoints
@router.post("/register", response_model=UserWithToken, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> UserWithToken:
    """
    Register a new user.

    - **email**: User's email address (must be unique)
    - **password**: User's password (min 8 characters recommended)
    - **full_name**: Optional full name
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "EMAIL_EXISTS", "message": "Email already registered"}},
        )

    # Validate password length
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "WEAK_PASSWORD",
                    "message": "Password must be at least 8 characters",
                }
            },
        )

    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=True,
        is_admin=False,
        is_reviewer=False,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate token
    access_token = create_access_token(new_user.id)

    return UserWithToken(
        user=UserResponse.model_validate(new_user),
        token=TokenResponse(
            access_token=access_token,
            expires_in=settings.access_token_expire_minutes * 60,
        ),
    )


@router.post("/login", response_model=UserWithToken)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> UserWithToken:
    """
    Login with email and password.

    Returns access token on success.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
            },
        )

    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "USER_INACTIVE", "message": "User account is inactive"}},
        )

    # Update last login
    user.last_login_at = datetime.utcnow()
    await db.commit()

    # Generate token
    access_token = create_access_token(user.id)

    return UserWithToken(
        user=UserResponse.model_validate(user),
        token=TokenResponse(
            access_token=access_token,
            expires_in=settings.access_token_expire_minutes * 60,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current authenticated user's information."""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: User = Depends(get_current_user),
) -> TokenResponse:
    """
    Refresh access token.

    Requires valid existing token.
    """
    access_token = create_access_token(current_user.id)

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Change user's password.

    Requires current password for verification.
    """
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "NO_PASSWORD",
                    "message": "User registered via OAuth, cannot change password",
                }
            },
        )

    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {"code": "INVALID_PASSWORD", "message": "Current password is incorrect"}
            },
        )

    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "WEAK_PASSWORD",
                    "message": "Password must be at least 8 characters",
                }
            },
        )

    current_user.hashed_password = get_password_hash(new_password)
    await db.commit()

    return {"message": "Password changed successfully"}
