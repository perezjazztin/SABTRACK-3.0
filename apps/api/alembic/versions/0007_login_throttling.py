"""create login_throttling table for persistent brute-force defense

Revision ID: 0007_login_throttling
Revises: 0006_gamification_and_points
Create Date: 2026-10-25 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0007_login_throttling'
down_revision: Union[str, None] = '0006_gamification_and_points'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'login_throttling',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_attempt_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_login_throttling_ip_address'), 'login_throttling', ['ip_address'], unique=False)
    op.create_index(op.f('ix_login_throttling_email'), 'login_throttling', ['email'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_login_throttling_email'), table_name='login_throttling')
    op.drop_index(op.f('ix_login_throttling_ip_address'), table_name='login_throttling')
    op.drop_table('login_throttling')
