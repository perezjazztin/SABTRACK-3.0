"""clarify academic-only reward voucher descriptions

Revision ID: 0011_reward_voucher_copy
Revises: 0010_report_task_eligibility
Create Date: 2026-11-01 08:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0011_reward_voucher_copy"
down_revision: Union[str, None] = "0010_report_task_eligibility"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_UPDATED_DESCRIPTION = (
    "In-app academic demonstration only. This voucher is recorded for academic "
    "demonstration and does not issue mobile credit or physical goods."
)

_SEEDED_DESCRIPTIONS = {
    "₱100 Mobile Load": (
        "Prepaid mobile load credited directly to your registered mobile number."
    ),
    "5kg Rice": (
        "Premium 5kg sack of rice. Present your claim voucher at the Barangay Sabang Hall."
    ),
    "10kg Rice": (
        "Premium 10kg sack of rice. Present your claim voucher at the Barangay Sabang Hall."
    ),
    "₱500 Worth of Groceries": (
        "Essential grocery voucher pack redeemable at Barangay Sabang partner cooperative store."
    ),
}


def upgrade() -> None:
    connection = op.get_bind()
    update = sa.text(
        "UPDATE reward_items SET description = :new_description "
        "WHERE name = :name AND is_demo_data = :is_demo_data "
        "AND description = :old_description"
    )
    for name, old_description in _SEEDED_DESCRIPTIONS.items():
        connection.execute(
            update,
            {
                "new_description": _UPDATED_DESCRIPTION,
                "name": name,
                "is_demo_data": True,
                "old_description": old_description,
            },
        )


def downgrade() -> None:
    # Keep the corrective disclosure rather than restore misleading fulfillment claims.
    pass
