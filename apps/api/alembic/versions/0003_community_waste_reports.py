"""create reports and report_status_history tables

Revision ID: 0003_community_waste_reports
Revises: 0002_identity_and_sessions
Create Date: 2026-10-24 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003_community_waste_reports'
down_revision: Union[str, None] = '0002_identity_and_sessions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('resident_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location_text', sa.String(length=255), nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('photo_url', sa.String(length=512), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='SUBMITTED'),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['resident_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_resident_id'), 'reports', ['resident_id'], unique=False)
    op.create_index(op.f('ix_reports_category'), 'reports', ['category'], unique=False)
    op.create_index(op.f('ix_reports_status'), 'reports', ['status'], unique=False)
    op.create_index(op.f('ix_reports_area_id'), 'reports', ['area_id'], unique=False)

    # 2. Report Status History table (immutable log)
    op.create_table(
        'report_status_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('previous_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('changed_by_user_id', sa.Integer(), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_report_status_history_report_id'), 'report_status_history', ['report_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_report_status_history_report_id'), table_name='report_status_history')
    op.drop_table('report_status_history')

    op.drop_index(op.f('ix_reports_area_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_status'), table_name='reports')
    op.drop_index(op.f('ix_reports_category'), table_name='reports')
    op.drop_index(op.f('ix_reports_resident_id'), table_name='reports')
    op.drop_table('reports')
