"""Initial product schema.

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-18
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("api_token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_api_token_hash"), "users", ["api_token_hash"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "auth_sessions",
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("token_hash"),
    )
    op.create_index(op.f("ix_auth_sessions_user_id"), "auth_sessions", ["user_id"])

    op.create_table(
        "frustrations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("message", sa.String(length=560), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("intensity", sa.Integer(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("agent_name", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_frustrations_created_at_id", "frustrations", ["created_at", "id"])
    op.create_index("ix_frustrations_source_created_at", "frustrations", ["source", "created_at"])
    op.create_index(op.f("ix_frustrations_user_id"), "frustrations", ["user_id"])

    op.create_table(
        "reactions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("frustration_id", sa.String(length=36), nullable=False),
        sa.Column("reaction", sa.String(length=24), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["frustration_id"], ["frustrations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("frustration_id", "reaction", name="uq_reaction_kind"),
    )
    op.create_index(op.f("ix_reactions_frustration_id"), "reactions", ["frustration_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_reactions_frustration_id"), table_name="reactions")
    op.drop_table("reactions")
    op.drop_index(op.f("ix_frustrations_user_id"), table_name="frustrations")
    op.drop_index("ix_frustrations_source_created_at", table_name="frustrations")
    op.drop_index("ix_frustrations_created_at_id", table_name="frustrations")
    op.drop_table("frustrations")
    op.drop_index(op.f("ix_auth_sessions_user_id"), table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_api_token_hash"), table_name="users")
    op.drop_table("users")
