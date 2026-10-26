"""create announcements table

Revision ID: 0005_announcements
Revises: 0004_collection_schedules
Create Date: 2026-10-25 00:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0005_announcements'
down_revision: Union[str, None] = '0004_collection_schedules'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=30), nullable=False, server_default='GENERAL'),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_announcements_category'), 'announcements', ['category'], unique=False)
    op.create_index(op.f('ix_announcements_is_pinned'), 'announcements', ['is_pinned'], unique=False)
    op.create_index(op.f('ix_announcements_is_active'), 'announcements', ['is_active'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_announcements_is_active'), table_name='announcements')
    op.drop_index(op.f('ix_announcements_is_pinned'), table_name='announcements')
    op.drop_index(op.f('ix_announcements_category'), table_name='announcements')
    op.drop_table('announcements')
