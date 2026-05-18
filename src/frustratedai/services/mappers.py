from __future__ import annotations

from datetime import UTC, datetime

from frustratedai.db.models import FrustrationEntry, User
from frustratedai.schemas import Frustration, PublicUser, UserSession


def serialize_datetime(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def user_session(user: User, api_token: str | None = None) -> UserSession:
    return UserSession(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        api_token=api_token,
    )


def frustration_dto(
    entry: FrustrationEntry,
    *,
    display_name: str,
    reactions: dict[str, int],
) -> Frustration:
    return Frustration(
        id=entry.id,
        message=entry.message,
        source=entry.source,
        intensity=entry.intensity,
        tags=entry.tags,
        agent_name=entry.agent_name,
        created_at=serialize_datetime(entry.created_at),
        author=PublicUser(id=entry.user_id, display_name=display_name),
        reactions=reactions,
    )
