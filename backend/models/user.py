"""User model."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database.connection import Base

if TYPE_CHECKING:
    from models.document import Document


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    # Primary key
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Authentication
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # OAuth
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)

    # Profile
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Permissions
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_reviewer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(onupdate=func.now(), nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="user",
        foreign_keys="Document.user_id",
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<User(id={self.id}, email={self.email}, is_admin={self.is_admin})>"
