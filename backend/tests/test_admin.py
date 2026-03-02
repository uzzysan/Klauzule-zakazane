"""Tests for admin API endpoints."""
from uuid import uuid4

from httpx import AsyncClient

from models.user import User
from tests.conftest import auth_headers


class TestAdminHealth:
    """Tests for GET /api/v1/admin/health endpoint."""

    async def test_health_check(self, client: AsyncClient):
        """Test admin health check endpoint."""
        response = await client.get("/api/v1/admin/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "admin"


class TestGetMetrics:
    """Tests for GET /api/v1/admin/metrics endpoint."""

    async def test_get_metrics_as_reviewer(
        self, client: AsyncClient, reviewer_user: User, reviewer_token: str
    ):
        """Test getting metrics as reviewer."""
        response = await client.get(
            "/api/v1/admin/metrics",
            headers=auth_headers(reviewer_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_metrics_as_admin(
        self, client: AsyncClient, admin_user: User, admin_token: str
    ):
        """Test getting metrics as admin."""
        response = await client.get(
            "/api/v1/admin/metrics",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_metrics_unauthorized(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test getting metrics as regular user fails."""
        response = await client.get(
            "/api/v1/admin/metrics",
            headers=auth_headers(user_token),
        )

        assert response.status_code == 403

    async def test_get_metrics_unauthenticated(self, client: AsyncClient):
        """Test getting metrics without authentication fails."""
        response = await client.get("/api/v1/admin/metrics")

        assert response.status_code == 401


class TestGetPendingReviews:
    """Tests for GET /api/v1/admin/pending-reviews endpoint."""

    async def test_get_pending_reviews_as_reviewer(
        self, client: AsyncClient, reviewer_user: User, reviewer_token: str
    ):
        """Test getting pending reviews as reviewer."""
        response = await client.get(
            "/api/v1/admin/pending-reviews",
            headers=auth_headers(reviewer_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_pending_reviews_with_limit(
        self, client: AsyncClient, reviewer_user: User, reviewer_token: str
    ):
        """Test getting pending reviews with custom limit."""
        response = await client.get(
            "/api/v1/admin/pending-reviews",
            params={"limit": 5},
            headers=auth_headers(reviewer_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_pending_reviews_unauthorized(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test getting pending reviews as regular user fails."""
        response = await client.get(
            "/api/v1/admin/pending-reviews",
            headers=auth_headers(user_token),
        )

        assert response.status_code == 403


class TestSubmitFeedback:
    """Tests for POST /api/v1/admin/feedback endpoint."""

    async def test_submit_feedback_nonexistent_clause(
        self, client: AsyncClient, reviewer_user: User, reviewer_token: str
    ):
        """Test submitting feedback for non-existent clause fails."""
        response = await client.post(
            "/api/v1/admin/feedback",
            json={
                "flagged_clause_id": str(uuid4()),
                "is_correct": True,
                "notes": "Test feedback",
            },
            headers=auth_headers(reviewer_token),
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["error"]["code"] == "NOT_FOUND"

    async def test_submit_feedback_unauthorized(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test submitting feedback as regular user fails."""
        response = await client.post(
            "/api/v1/admin/feedback",
            json={
                "flagged_clause_id": str(uuid4()),
                "is_correct": True,
            },
            headers=auth_headers(user_token),
        )

        assert response.status_code == 403

    async def test_submit_feedback_unauthenticated(self, client: AsyncClient):
        """Test submitting feedback without authentication fails."""
        response = await client.post(
            "/api/v1/admin/feedback",
            json={
                "flagged_clause_id": str(uuid4()),
                "is_correct": True,
            },
        )

        assert response.status_code == 401


class TestTriggerClauseSync:
    """Tests for POST /api/v1/admin/sync-clauses endpoint."""

    async def test_sync_clauses_as_admin(
        self, client: AsyncClient, admin_user: User, admin_token: str, mocker
    ):
        """Test triggering clause sync as admin."""
        # Mock the Celery task
        mock_task = mocker.MagicMock()
        mock_task.id = "test-task-id"
        mocker.patch(
            "tasks.sync.sync_prohibited_clauses.delay",
            return_value=mock_task,
        )

        response = await client.post(
            "/api/v1/admin/sync-clauses",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 202
        data = response.json()
        assert data["message"] == "Clause synchronization started"
        assert data["task_id"] == "test-task-id"
        assert data["status"] == "queued"

    async def test_sync_clauses_as_reviewer(
        self, client: AsyncClient, reviewer_user: User, reviewer_token: str
    ):
        """Test triggering clause sync as reviewer fails (admin only)."""
        response = await client.post(
            "/api/v1/admin/sync-clauses",
            headers=auth_headers(reviewer_token),
        )

        assert response.status_code == 403

    async def test_sync_clauses_as_regular_user(
        self, client: AsyncClient, test_user: User, user_token: str
    ):
        """Test triggering clause sync as regular user fails."""
        response = await client.post(
            "/api/v1/admin/sync-clauses",
            headers=auth_headers(user_token),
        )

        assert response.status_code == 403

    async def test_sync_clauses_unauthenticated(self, client: AsyncClient):
        """Test triggering clause sync without authentication fails."""
        response = await client.post("/api/v1/admin/sync-clauses")

        assert response.status_code == 401
