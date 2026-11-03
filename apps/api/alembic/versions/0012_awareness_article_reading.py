"""add server-tracked Awareness Hub article reading awards

Revision ID: 0012_awareness_article_reading
Revises: 0011_reward_voucher_copy
Create Date: 2026-11-01 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0012_awareness_article_reading"
down_revision: Union[str, None] = "0011_reward_voucher_copy"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "article_reading_sessions",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("resident_id", sa.Integer(), nullable=False),
        sa.Column("article_id", sa.String(length=100), nullable=False),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "consumed",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["resident_id"],
            ["users.id"],
            name="fk_article_reading_sessions_resident_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "resident_id",
            "article_id",
            name="uq_article_reading_session_resident_article",
        ),
    )
    op.create_index(
        op.f("ix_article_reading_sessions_resident_id"),
        "article_reading_sessions",
        ["resident_id"],
        unique=False,
    )

    op.create_table(
        "article_read_awards",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resident_id", sa.Integer(), nullable=False),
        sa.Column("article_id", sa.String(length=100), nullable=False),
        sa.Column("ledger_entry_id", sa.Integer(), nullable=False),
        sa.Column("awarded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["ledger_entry_id"],
            ["points_ledger.id"],
            name="fk_article_read_awards_ledger_entry_id_points_ledger",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["resident_id"],
            ["users.id"],
            name="fk_article_read_awards_resident_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "ledger_entry_id",
            name="uq_article_read_awards_ledger_entry_id",
        ),
        sa.UniqueConstraint(
            "resident_id",
            "article_id",
            name="uq_article_read_award_resident_article",
        ),
    )
    op.create_index(
        op.f("ix_article_read_awards_resident_id"),
        "article_read_awards",
        ["resident_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_article_read_awards_resident_id"),
        table_name="article_read_awards",
    )
    op.drop_table("article_read_awards")
    op.drop_index(
        op.f("ix_article_reading_sessions_resident_id"),
        table_name="article_reading_sessions",
    )
    op.drop_table("article_reading_sessions")
