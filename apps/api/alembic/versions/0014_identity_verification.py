"""create identity_verifications table

Revision ID: 0014_identity_verification
Revises: 0013_reward_image_url
Create Date: 2026-11-22 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_identity_verification"
down_revision: Union[str, None] = "0013_reward_image_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "identity_verifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("id_type", sa.String(length=50), nullable=False),
        sa.Column("id_number_hash", sa.String(length=64), nullable=False),
        sa.Column("id_number_masked", sa.String(length=50), nullable=False),
        sa.Column("ocr_full_name", sa.String(length=150), nullable=False),
        sa.Column("submitted_full_name", sa.String(length=150), nullable=False),
        sa.Column("is_user_corrected", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("dob_extracted", sa.Date(), nullable=True),
        sa.Column("address_extracted", sa.Text(), nullable=True),
        sa.Column("match_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="PENDING"),
        sa.Column("verification_token_hash", sa.String(length=64), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_demo_data", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_identity_verifications_id_number_hash"), "identity_verifications", ["id_number_hash"], unique=True)
    op.create_index(op.f("ix_identity_verifications_user_id"), "identity_verifications", ["user_id"], unique=False)
    op.create_index(op.f("ix_identity_verifications_status"), "identity_verifications", ["status"], unique=False)
    op.create_index(op.f("ix_identity_verifications_verification_token_hash"), "identity_verifications", ["verification_token_hash"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_identity_verifications_verification_token_hash"), table_name="identity_verifications")
    op.drop_index(op.f("ix_identity_verifications_status"), table_name="identity_verifications")
    op.drop_index(op.f("ix_identity_verifications_user_id"), table_name="identity_verifications")
    op.drop_index(op.f("ix_identity_verifications_id_number_hash"), table_name="identity_verifications")
    op.drop_table("identity_verifications")
