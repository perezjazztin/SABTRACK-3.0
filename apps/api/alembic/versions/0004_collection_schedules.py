"""create schedules and schedule_advisories tables

Revision ID: 0004_collection_schedules
Revises: 0003_community_waste_reports
Create Date: 2026-10-24 22:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0004_collection_schedules'
down_revision: Union[str, None] = '0003_community_waste_reports'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Schedules table
    op.create_table(
        'schedules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=False),
        sa.Column('day_of_week', sa.String(length=20), nullable=False),
        sa.Column('waste_type', sa.String(length=30), nullable=False),
        sa.Column('start_time', sa.String(length=20), nullable=False),
        sa.Column('end_time', sa.String(length=20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_schedules_area_id'), 'schedules', ['area_id'], unique=False)
    op.create_index(op.f('ix_schedules_day_of_week'), 'schedules', ['day_of_week'], unique=False)
    op.create_index(op.f('ix_schedules_waste_type'), 'schedules', ['waste_type'], unique=False)

    # 2. Schedule Advisories table
    op.create_table(
        'schedule_advisories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('advisory_type', sa.String(length=30), nullable=False, server_default='DELAY'),
        sa.Column('effective_date', sa.String(length=30), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_schedule_advisories_area_id'), 'schedule_advisories', ['area_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_schedule_advisories_area_id'), table_name='schedule_advisories')
    op.drop_table('schedule_advisories')
    op.drop_index(op.f('ix_schedules_waste_type'), table_name='schedules')
    op.drop_index(op.f('ix_schedules_day_of_week'), table_name='schedules')
    op.drop_index(op.f('ix_schedules_area_id'), table_name='schedules')
    op.drop_table('schedules')
