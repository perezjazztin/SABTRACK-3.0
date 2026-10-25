"""create initiatives, participation_claims, and points_ledger tables

Revision ID: 0006_gamification_and_points
Revises: 0005_announcements
Create Date: 2026-10-25 09:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0006_gamification_and_points'
down_revision: Union[str, None] = '0005_announcements'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Initiatives table
    op.create_table(
        'initiatives',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('points_reward', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('event_date', sa.String(length=50), nullable=False),
        sa.Column('location', sa.String(length=150), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_initiatives_is_active'), 'initiatives', ['is_active'], unique=False)

    # 2. Participation claims table
    op.create_table(
        'participation_claims',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('resident_id', sa.Integer(), nullable=False),
        sa.Column('initiative_id', sa.Integer(), nullable=True),
        sa.Column('activity_title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('evidence_url', sa.String(length=512), nullable=True),
        sa.Column('points_requested', sa.Integer(), nullable=False, server_default='25'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['resident_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['initiative_id'], ['initiatives.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_participation_claims_resident_id'), 'participation_claims', ['resident_id'], unique=False)
    op.create_index(op.f('ix_participation_claims_initiative_id'), 'participation_claims', ['initiative_id'], unique=False)
    op.create_index(op.f('ix_participation_claims_status'), 'participation_claims', ['status'], unique=False)

    # 3. Points ledger table (immutable double-entry)
    op.create_table(
        'points_ledger',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('resident_id', sa.Integer(), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(length=30), nullable=False),
        sa.Column('claim_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['resident_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['claim_id'], ['participation_claims.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_points_ledger_resident_id'), 'points_ledger', ['resident_id'], unique=False)
    op.create_index(op.f('ix_points_ledger_transaction_type'), 'points_ledger', ['transaction_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_points_ledger_transaction_type'), table_name='points_ledger')
    op.drop_index(op.f('ix_points_ledger_resident_id'), table_name='points_ledger')
    op.drop_table('points_ledger')
    op.drop_index(op.f('ix_participation_claims_status'), table_name='participation_claims')
    op.drop_index(op.f('ix_participation_claims_initiative_id'), table_name='participation_claims')
    op.drop_index(op.f('ix_participation_claims_resident_id'), table_name='participation_claims')
    op.drop_table('participation_claims')
    op.drop_index(op.f('ix_initiatives_is_active'), table_name='initiatives')
    op.drop_table('initiatives')
