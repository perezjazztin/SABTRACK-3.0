"""add verified civic task award identity

Revision ID: 0009_civic_task_awards
Revises: 0008_rewards_and_redemptions
Create Date: 2026-11-01 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0009_civic_task_awards"
down_revision: Union[str, None] = "0008_rewards_and_redemptions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "participation_claims",
        sa.Column(
            "activity_type",
            sa.String(length=30),
            server_default="OTHER",
            nullable=False,
        ),
    )
    op.add_column(
        "points_ledger",
        sa.Column("task_key", sa.String(length=80), nullable=True),
    )
    op.add_column(
        "points_ledger",
        sa.Column("task_source_id", sa.String(length=64), nullable=True),
    )
    op.create_unique_constraint(
        "uq_points_ledger_resident_task_source",
        "points_ledger",
        ["resident_id", "task_key", "task_source_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_points_ledger_resident_task_source",
        "points_ledger",
        type_="unique",
    )
    op.drop_column("points_ledger", "task_source_id")
    op.drop_column("points_ledger", "task_key")
    op.drop_column("participation_claims", "activity_type")
