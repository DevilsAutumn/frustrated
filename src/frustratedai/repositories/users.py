from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from frustratedai.core.security import hash_token
from frustratedai.db.models import AuthSession, User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, user: User) -> None:
        self.session.add(user)
        await self.session.flush()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str) -> User | None:
        return await self.session.get(User, user_id)

    async def get_by_api_token(self, token: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.api_token_hash == hash_token(token))
        )
        return result.scalar_one_or_none()

    async def get_by_session_token(self, token: str) -> User | None:
        result = await self.session.execute(
            select(User)
            .join(AuthSession, AuthSession.user_id == User.id)
            .where(AuthSession.token_hash == hash_token(token))
        )
        return result.scalar_one_or_none()

    async def create_session(self, user_id: str, token: str) -> None:
        self.session.add(AuthSession(token_hash=hash_token(token), user_id=user_id))

    async def total_count(self) -> int:
        return int(await self.session.scalar(select(func.count(User.id))) or 0)
