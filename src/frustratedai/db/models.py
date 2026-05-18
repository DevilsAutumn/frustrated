from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    return datetime.now(UTC).replace(microsecond=0)


def new_id() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    api_token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    sessions: Mapped[list[AuthSession]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    frustrations: Mapped[list[FrustrationEntry]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan",
    )


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="sessions")


class FrustrationEntry(Base):
    __tablename__ = "frustrations"
    __table_args__ = (
        Index("ix_frustrations_created_at_id", "created_at", "id"),
        Index("ix_frustrations_source_created_at", "source", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str] = mapped_column(String(560), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    intensity: Mapped[int] = mapped_column(Integer, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    agent_name: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    author: Mapped[User] = relationship(back_populates="frustrations")
    reactions: Mapped[list[Reaction]] = relationship(
        back_populates="frustration",
        cascade="all, delete-orphan",
    )


class Reaction(Base):
    __tablename__ = "reactions"
    __table_args__ = (UniqueConstraint("frustration_id", "reaction", name="uq_reaction_kind"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    frustration_id: Mapped[str] = mapped_column(
        ForeignKey("frustrations.id", ondelete="CASCADE"),
        index=True,
    )
    reaction: Mapped[str] = mapped_column(String(24), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    frustration: Mapped[FrustrationEntry] = relationship(back_populates="reactions")
