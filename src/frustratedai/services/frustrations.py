from __future__ import annotations

from collections import Counter

from sqlalchemy.ext.asyncio import async_sessionmaker

from frustratedai.db.models import FrustrationEntry
from frustratedai.repositories.frustrations import FrustrationRepository
from frustratedai.repositories.users import UserRepository
from frustratedai.schemas import Frustration, StatsResponse
from frustratedai.services.mappers import frustration_dto

VALID_REACTIONS = {"same", "ouch", "fixed", "curious"}


def normalize_tags(tags: list[str]) -> list[str]:
    clean: list[str] = []
    for tag in tags:
        value = tag.strip().lower().replace(" ", "-")
        if value and value not in clean:
            clean.append(value[:32])
    return clean[:6]


class FrustrationService:
    def __init__(self, sessionmaker: async_sessionmaker) -> None:
        self.sessionmaker = sessionmaker

    async def create(
        self,
        *,
        user_id: str,
        message: str,
        source: str,
        intensity: int,
        tags: list[str],
        agent_name: str | None,
    ) -> Frustration:
        message = message.strip()
        source = source.strip().lower()[:32] or "web"
        intensity = max(1, min(10, int(intensity)))
        if len(message) < 8:
            raise ValueError("Frustration message must be at least 8 characters.")
        if len(message) > 560:
            raise ValueError("Frustration message must stay under 560 characters.")

        async with self.sessionmaker() as session, session.begin():
            users = UserRepository(session)
            user = await users.get_by_id(user_id)
            if user is None:
                raise LookupError("User not found.")

            entry = FrustrationEntry(
                author=user,
                message=message,
                source=source,
                intensity=intensity,
                tags=normalize_tags(tags),
                agent_name=agent_name.strip()[:80] if agent_name else None,
            )
            await FrustrationRepository(session).add(entry)
            return frustration_dto(entry, display_name=user.display_name, reactions={})

    async def list_recent(self, limit: int = 40) -> list[Frustration]:
        limit = max(1, min(limit, 100))
        async with self.sessionmaker() as session:
            repository = FrustrationRepository(session)
            entries = await repository.list_recent(limit)
            reactions = await repository.reaction_counts([entry.id for entry in entries])
            return [
                frustration_dto(
                    entry,
                    display_name=entry.author.display_name,
                    reactions=reactions.get(entry.id, {}),
                )
                for entry in entries
            ]

    async def react(self, frustration_id: str, reaction: str) -> dict[str, int]:
        reaction = reaction.strip().lower()
        if reaction not in VALID_REACTIONS:
            raise ValueError("Unsupported reaction.")

        async with self.sessionmaker() as session:
            repository = FrustrationRepository(session)
            async with session.begin():
                entry = await repository.get(frustration_id)
                if entry is None:
                    raise LookupError("Frustration not found.")
                await repository.increment_reaction(frustration_id, reaction)
            return (await repository.reaction_counts([frustration_id])).get(frustration_id, {})

    async def stats(self) -> StatsResponse:
        async with self.sessionmaker() as session:
            repository = FrustrationRepository(session)
            total_frustrations = await repository.total_count()
            average = await repository.average_intensity()
            tag_rows = await repository.all_tags()
            total_users = await UserRepository(session).total_count()

        counter: Counter[str] = Counter()
        for tags in tag_rows:
            counter.update(tags)
        return StatsResponse(
            total_frustrations=total_frustrations,
            total_users=int(total_users or 0),
            average_intensity=round(average, 2),
            top_tags=counter.most_common(8),
        )
