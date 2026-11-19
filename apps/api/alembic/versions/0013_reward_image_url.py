"""add image_url column to reward_items

Revision ID: 0013_reward_image_url
Revises: 0012_awareness_article_reading
Create Date: 2026-11-02 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0013_reward_image_url"
down_revision: Union[str, None] = "0012_awareness_article_reading"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reward_items", sa.Column("image_url", sa.String(length=512), nullable=True))

    # Update default rewards with their image URLs
    op.execute(
        sa.text(
            "UPDATE reward_items SET image_url = '/images/rewards/load_100.jpg' WHERE name = '₱100 Mobile Load'"
        )
    )
    op.execute(
        sa.text(
            "UPDATE reward_items SET image_url = '/images/rewards/rice_5kg.jpg' WHERE name = '5kg Rice'"
        )
    )
    op.execute(
        sa.text(
            "UPDATE reward_items SET image_url = '/images/rewards/rice_10kg.jpg' WHERE name = '10kg Rice'"
        )
    )
    op.execute(
        sa.text(
            "UPDATE reward_items SET image_url = '/images/rewards/grocery_500.jpg' WHERE name = '₱500 Worth of Groceries'"
        )
    )


def downgrade() -> None:
    op.drop_column("reward_items", "image_url")

