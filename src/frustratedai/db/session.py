from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from frustratedai.db.models import Base


@dataclass(frozen=True)
class DatabaseSessionManager:
    engine: AsyncEngine
    sessionmaker: async_sessionmaker[AsyncSession]

    @classmethod
    def create(cls, database_url: str) -> DatabaseSessionManager:
        engine = create_async_engine(database_url, pool_pre_ping=True)
        return cls(
            engine=engine,
            sessionmaker=async_sessionmaker(engine, expire_on_commit=False),
        )

    async def create_tables(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    async def dispose(self) -> None:
        await self.engine.dispose()
