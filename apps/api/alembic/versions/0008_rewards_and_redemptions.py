"""create reward_items and redemption_requests tables

Revision ID: 0008_rewards_and_redemptions
Revises: 0007_login_throttling
Create Date: 2026-10-31 23:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0008_rewards_and_redemptions'
down_revision: Union[str, None] = '0007_login_throttling'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Reward items catalog table
    reward_items_table = op.create_table(
        'reward_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('points_required', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='GOODS'),
        sa.Column('stock_quantity', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reward_items_points_required'), 'reward_items', ['points_required'], unique=False)
    op.create_index(op.f('ix_reward_items_is_active'), 'reward_items', ['is_active'], unique=False)

    # 2. Redemption requests table
    op.create_table(
        'redemption_requests',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('resident_id', sa.Integer(), nullable=False),
        sa.Column('reward_id', sa.Integer(), nullable=False),
        sa.Column('points_spent', sa.Integer(), nullable=False),
        sa.Column('claim_code', sa.String(length=32), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('fulfilled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_demo_data', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['resident_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reward_id'], ['reward_items.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_redemption_requests_resident_id'), 'redemption_requests', ['resident_id'], unique=False)
    op.create_index(op.f('ix_redemption_requests_reward_id'), 'redemption_requests', ['reward_id'], unique=False)
    op.create_index(op.f('ix_redemption_requests_claim_code'), 'redemption_requests', ['claim_code'], unique=True)
    op.create_index(op.f('ix_redemption_requests_status'), 'redemption_requests', ['status'], unique=False)

    # 3. Seed default civic rewards
    op.bulk_insert(
        reward_items_table,
        [
            {
                'name': '₱100 Mobile Load',
                'description': 'In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.',
                'points_required': 500,
                'category': 'DIGITAL',
                'stock_quantity': 50,
                'is_active': True,
                'is_demo_data': True,
            },
            {
                'name': '5kg Rice',
                'description': 'In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.',
                'points_required': 1000,
                'category': 'GOODS',
                'stock_quantity': 30,
                'is_active': True,
                'is_demo_data': True,
            },
            {
                'name': '10kg Rice',
                'description': 'In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.',
                'points_required': 2000,
                'category': 'GOODS',
                'stock_quantity': 20,
                'is_active': True,
                'is_demo_data': True,
            },
            {
                'name': '₱500 Worth of Groceries',
                'description': 'In-app academic demonstration only. This voucher is recorded for academic demonstration and does not issue mobile credit or physical goods.',
                'points_required': 2500,
                'category': 'VOUCHER',
                'stock_quantity': 15,
                'is_active': True,
                'is_demo_data': True,
            },
        ]
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_redemption_requests_status'), table_name='redemption_requests')
    op.drop_index(op.f('ix_redemption_requests_claim_code'), table_name='redemption_requests')
    op.drop_index(op.f('ix_redemption_requests_reward_id'), table_name='redemption_requests')
    op.drop_index(op.f('ix_redemption_requests_resident_id'), table_name='redemption_requests')
    op.drop_table('redemption_requests')
    op.drop_index(op.f('ix_reward_items_is_active'), table_name='reward_items')
    op.drop_index(op.f('ix_reward_items_points_required'), table_name='reward_items')
    op.drop_table('reward_items')
