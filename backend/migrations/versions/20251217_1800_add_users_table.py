"""Add users table for authentication

Revision ID: a1b2c3d4e5f6
Revises: 4be0b326d758
Create Date: 2025-12-17 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "4be0b326d758"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add users table."""
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("google_id", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_reviewer", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_google_id"), "users", ["google_id"], unique=True)

    # Add foreign key from documents.user_id to users.id
    op.create_foreign_key(
        "fk_documents_user_id", "documents", "users", ["user_id"], ["id"], ondelete="SET NULL"
    )

    # Add foreign key from analysis_feedback.reviewer_id to users.id
    op.create_foreign_key(
        "fk_analysis_feedback_reviewer_id",
        "analysis_feedback",
        "users",
        ["reviewer_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Remove users table and foreign keys."""
    op.drop_constraint("fk_analysis_feedback_reviewer_id", "analysis_feedback", type_="foreignkey")
    op.drop_constraint("fk_documents_user_id", "documents", type_="foreignkey")
    op.drop_index(op.f("ix_users_google_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
