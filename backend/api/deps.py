"""API dependencies for authentication and authorization."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.connection import get_db
from models.user import User

# Security scheme - optional for endpoints that support both guest and authenticated users
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get the current authenticated user from JWT token.

    Raises HTTPException 401 if token is invalid or user not found.
    Required for protected endpoints.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}},
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid token payload"}},
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "INVALID_TOKEN", "message": f"Token validation failed: {str(e)}"}},
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "USER_NOT_FOUND", "message": "User not found"}},
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "USER_INACTIVE", "message": "User account is inactive"}},
        )

    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.

    Used for endpoints that support both guest and authenticated users.
    Does not raise an exception if no token is provided.
    """
    if credentials is None:
        return None

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current user and verify they have admin privileges.

    Raises HTTPException 403 if user is not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Admin privileges required"}},
        )
    return current_user


async def get_reviewer_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current user and verify they have reviewer privileges.

    Raises HTTPException 403 if user is not a reviewer or admin.
    """
    if not (current_user.is_reviewer or current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Reviewer privileges required"}},
        )
    return current_user


def create_access_token(user_id: UUID, expires_delta_minutes: Optional[int] = None) -> str:
    """
    Create a JWT access token for a user.

    Args:
        user_id: The user's UUID
        expires_delta_minutes: Token expiration in minutes (default from settings)

    Returns:
        Encoded JWT token string
    """
    from datetime import timedelta

    if expires_delta_minutes is None:
        expires_delta_minutes = settings.access_token_expire_minutes

    expire = datetime.utcnow() + timedelta(minutes=expires_delta_minutes)

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )

    return encoded_jwt
