"""Add feedback and metrics tables for admin panel

Revision ID: 4be0b326d758
Revises: cd1f7a259c7b
Create Date: 2025-12-17 11:56:15.937012

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4be0b326d758'
down_revision: Union[str, None] = 'cd1f7a259c7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add feedback and metrics tables."""
    # Create analysis_feedback table
    op.create_table(
        'analysis_feedback',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('flagged_clause_id', sa.UUID(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False, comment='Was this a true positive?'),
        sa.Column('reviewer_id', sa.UUID(), nullable=True, comment='Admin user who reviewed'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['flagged_clause_id'], ['flagged_clauses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analysis_feedback_flagged_clause_id'), 'analysis_feedback', ['flagged_clause_id'], unique=False)

    # Create model_metrics table
    op.create_table(
        'model_metrics',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('true_positives', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('false_positives', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('true_negatives', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('false_negatives', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('precision', sa.Float(), nullable=True),
        sa.Column('recall', sa.Float(), nullable=True),
        sa.Column('f1_score', sa.Float(), nullable=True),
        sa.Column('accuracy', sa.Float(), nullable=True),
        sa.Column('total_reviews', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date')
    )
    op.create_index(op.f('ix_model_metrics_date'), 'model_metrics', ['date'], unique=True)


def downgrade() -> None:
    """Remove feedback and metrics tables."""
    op.drop_index(op.f('ix_model_metrics_date'), table_name='model_metrics')
    op.drop_table('model_metrics')
    op.drop_index(op.f('ix_analysis_feedback_flagged_clause_id'), table_name='analysis_feedback')
    op.drop_table('analysis_feedback')
