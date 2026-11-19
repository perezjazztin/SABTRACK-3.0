"""add civic task eligibility marker to reports

Revision ID: 0010_report_task_eligibility
Revises: 0009_civic_task_awards
Create Date: 2026-11-01 08:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0010_report_task_eligibility"
down_revision: Union[str, None] = "0009_civic_task_awards"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reports",
        sa.Column(
            "civic_task_eligible",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("reports", "civic_task_eligible")
