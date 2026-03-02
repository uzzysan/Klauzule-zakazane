"""Tests for authentication API endpoints."""
from httpx import AsyncClient

from models.user import User
from tests.conftest import auth_headers


class TestRegister:
    """Tests for POST /api/v1/auth/register endpoint."""

    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User",
            },
        )

        assert response.status_code == 201
        data = response.json()

        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["full_name"] == "New User"
        assert data["user"]["is_active"] is True
        assert data["user"]["is_admin"] is False
        assert data["user"]["is_reviewer"] is False
        assert data["token"]["token_type"] == "bearer"
        assert "access_token" in data["token"]

    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration with existing email fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user.email,
                "password": "somepassword123",
            },
        )

        assert response.status_code == 409
        data = response.json()
        assert data["detail"]["error"]["code"] == "EMAIL_EXISTS"

    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with short password fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "weak@example.com",
                "password": "short",
            },
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"]["code"] == "WEAK_PASSWORD"

    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "securepassword123",
            },
        )

        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/v1/auth/login endpoint."""

    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == test_user.email
        assert data["token"]["token_type"] == "bearer"
        assert "access_token" in data["token"]

    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """Test login with wrong password fails."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            },
        )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"]["error"]["code"] == "INVALID_CREDENTIALS"

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent email fails."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "somepassword123",
            },
        )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"]["error"]["code"] == "INVALID_CREDENTIALS"

    async def test_login_inactive_user(
        self, client: AsyncClient, db_session, test_user: User
    ):
        """Test login with inactive user fails."""
        test_user.is_active = False
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            },
        )

        assert response.status_code == 403
        data = response.json()
        assert data["detail"]["error"]["code"] == "USER_INACTIVE"


class TestGetCurrentUser:
    """Tests for GET /api/v1/auth/me endpoint."""

    async def test_get_me_authenticated(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test getting current user info when authenticated."""
        response = await client.get(
            "/api/v1/auth/me",
            headers=auth_headers(user_token),
        )

        assert response.status_code == 200
        data = response.json()

        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["is_active"] is True

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Test getting current user info without token fails."""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401

    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test getting current user info with invalid token fails."""
        response = await client.get(
            "/api/v1/auth/me",
            headers=auth_headers("invalid-token"),
        )

        assert response.status_code == 401


class TestRefreshToken:
    """Tests for POST /api/v1/auth/refresh endpoint."""

    async def test_refresh_token_success(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test successful token refresh."""
        response = await client.post(
            "/api/v1/auth/refresh",
            headers=auth_headers(user_token),
        )

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data

    async def test_refresh_token_unauthenticated(self, client: AsyncClient):
        """Test token refresh without authentication fails."""
        response = await client.post("/api/v1/auth/refresh")

        assert response.status_code == 401


class TestChangePassword:
    """Tests for POST /api/v1/auth/change-password endpoint."""

    async def test_change_password_success(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test successful password change."""
        response = await client.post(
            "/api/v1/auth/change-password",
            params={
                "old_password": "testpassword123",
                "new_password": "newpassword456",
            },
            headers=auth_headers(user_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password changed successfully"

        # Verify can login with new password
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "newpassword456",
            },
        )
        assert login_response.status_code == 200

    async def test_change_password_wrong_old_password(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test password change with wrong old password fails."""
        response = await client.post(
            "/api/v1/auth/change-password",
            params={
                "old_password": "wrongpassword",
                "new_password": "newpassword456",
            },
            headers=auth_headers(user_token),
        )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"]["error"]["code"] == "INVALID_PASSWORD"

    async def test_change_password_weak_new_password(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test password change with weak new password fails."""
        response = await client.post(
            "/api/v1/auth/change-password",
            params={
                "old_password": "testpassword123",
                "new_password": "short",
            },
            headers=auth_headers(user_token),
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"]["code"] == "WEAK_PASSWORD"

    async def test_change_password_unauthenticated(self, client: AsyncClient):
        """Test password change without authentication fails."""
        response = await client.post(
            "/api/v1/auth/change-password",
            params={
                "old_password": "testpassword123",
                "new_password": "newpassword456",
            },
        )

        assert response.status_code == 401
