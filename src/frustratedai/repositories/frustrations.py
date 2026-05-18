from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from frustratedai.db.models import FrustrationEntry, Reaction


class FrustrationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, entry: FrustrationEntry) -> None:
        self.session.add(entry)
        await self.session.flush()

    async def get(self, frustration_id: str) -> FrustrationEntry | None:
        return await self.session.get(FrustrationEntry, frustration_id)

    async def list_recent(self, limit: int) -> list[FrustrationEntry]:
        result = await self.session.execute(
            select(FrustrationEntry)
            .options(selectinload(FrustrationEntry.author))
            .order_by(FrustrationEntry.created_at.desc(), FrustrationEntry.id.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def reaction_counts(self, frustration_ids: list[str]) -> dict[str, dict[str, int]]:
        if not frustration_ids:
            return {}
        result = await self.session.execute(
            select(Reaction).where(Reaction.frustration_id.in_(frustration_ids))
        )
        grouped: dict[str, dict[str, int]] = {}
        for reaction in result.scalars():
            grouped.setdefault(reaction.frustration_id, {})[reaction.reaction] = reaction.count
        return grouped

    async def increment_reaction(self, frustration_id: str, reaction_name: str) -> None:
        result = await self.session.execute(
            select(Reaction).where(
                Reaction.frustration_id == frustration_id,
                Reaction.reaction == reaction_name,
            )
        )
        reaction = result.scalar_one_or_none()
        if reaction:
            reaction.count += 1
            return
        self.session.add(
            Reaction(frustration_id=frustration_id, reaction=reaction_name, count=1)
        )

    async def total_count(self) -> int:
        return int(await self.session.scalar(select(func.count(FrustrationEntry.id))) or 0)

    async def average_intensity(self) -> float:
        value = await self.session.scalar(
            select(func.coalesce(func.avg(FrustrationEntry.intensity), 0))
        )
        return float(value or 0)

    async def all_tags(self) -> list[list[str]]:
        result = await self.session.execute(select(FrustrationEntry.tags))
        return list(result.scalars().all())
