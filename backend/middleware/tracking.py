"""Middleware for tracking user sessions and updating metrics."""
import hashlib
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Set
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from monitoring.metrics import record_visitor_session, update_active_users


class UserTrackingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track user sessions and active users.
    
    Tracks:
    - Unique visitor sessions (based on user_id or IP hash)
    - Active users in different time windows (5m, 1h, 24h)
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store active sessions with timestamps
        self.sessions: Dict[str, datetime] = {}
        # Track active users per time window
        self.active_users_5m: Set[str] = set()
        self.active_users_1h: Set[str] = set()
        self.active_users_24h: Set[str] = set()
        # Last cleanup time
        self.last_cleanup = datetime.now()
    
    async def dispatch(self, request: Request, call_next):
        """Process request and track user activity."""
        # Get user identifier
        user_id = self._get_user_identifier(request)
        
        # Track session if new
        if user_id not in self.sessions:
            user_type = "authenticated" if self._is_authenticated(request) else "guest"
            record_visitor_session(user_type)
            self.sessions[user_id] = datetime.now()
        else:
            # Update last seen time
            self.sessions[user_id] = datetime.now()
        
        # Add to active users sets
        self.active_users_5m.add(user_id)
        self.active_users_1h.add(user_id)
        self.active_users_24h.add(user_id)
        
        # Cleanup old sessions periodically (every 5 minutes)
        if (datetime.now() - self.last_cleanup).seconds > 300:
            self._cleanup_old_sessions()
            self.last_cleanup = datetime.now()
        
        # Process request
        response = await call_next(request)
        
        return response
    
    def _get_user_identifier(self, request: Request) -> str:
        """
        Get unique identifier for user.
        Uses user_id from JWT if authenticated, otherwise IP hash.
        """
        # Try to get user_id from JWT token
        user_id = self._extract_user_from_token(request)
        if user_id:
            return f"user_{user_id}"
        
        # Fallback to IP hash for guests
        client_ip = self._get_client_ip(request)
        ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
        return f"guest_{ip_hash}"
    
    def _is_authenticated(self, request: Request) -> bool:
        """Check if request is from authenticated user."""
        return self._extract_user_from_token(request) is not None
    
    def _extract_user_from_token(self, request: Request) -> str | None:
        """
        Extract user_id from JWT token in Authorization header.
        Returns None if no valid token found.
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        try:
            # Note: This is a simplified version
            # In production, you should properly decode and validate the JWT
            # For now, we'll just return a placeholder
            # TODO: Implement proper JWT decoding when auth is fully implemented
            token = auth_header.split(" ")[1]
            if token:
                return hashlib.sha256(token.encode()).hexdigest()[:8]
        except Exception:
            pass
        
        return None
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Get client IP address from request.
        Considers X-Forwarded-For header for proxied requests.
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Get first IP from X-Forwarded-For chain
            return forwarded.split(",")[0].strip()
        
        # Fallback to direct connection IP
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _cleanup_old_sessions(self):
        """Remove old sessions and update active users metrics."""
        now = datetime.now()
        
        # Remove sessions older than 24 hours
        expired_sessions = [
            user_id for user_id, last_seen in self.sessions.items()
            if (now - last_seen).total_seconds() > 86400  # 24 hours
        ]
        for user_id in expired_sessions:
            del self.sessions[user_id]
        
        # Update active users for each time window
        active_5m = set()
        active_1h = set()
        active_24h = set()
        
        for user_id, last_seen in self.sessions.items():
            seconds_ago = (now - last_seen).total_seconds()
            if seconds_ago <= 300:  # 5 minutes
                active_5m.add(user_id)
            if seconds_ago <= 3600:  # 1 hour
                active_1h.add(user_id)
            if seconds_ago <= 86400:  # 24 hours
                active_24h.add(user_id)
        
        # Update sets and metrics
        self.active_users_5m = active_5m
        self.active_users_1h = active_1h
        self.active_users_24h = active_24h
        
        update_active_users("5m", len(self.active_users_5m))
        update_active_users("1h", len(self.active_users_1h))
        update_active_users("24h", len(self.active_users_24h))
