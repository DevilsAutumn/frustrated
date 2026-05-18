from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker

from frustratedai.core.security import hash_password, hash_token, make_token, verify_password
from frustratedai.db.models import User
from frustratedai.repositories.users import UserRepository
from frustratedai.schemas import UserSession
from frustratedai.services.mappers import user_session


def normalize_email(email: str) -> str:
    return email.strip().lower()


class AuthService:
    def __init__(self, sessionmaker: async_sessionmaker) -> None:
        self.sessionmaker = sessionmaker

    async def signup(
        self,
        *,
        email: str,
        password: str,
        display_name: str,
    ) -> tuple[UserSession, str]:
        email = normalize_email(email)
        display_name = display_name.strip()
        if not email or "@" not in email:
            raise ValueError("Enter a valid email address.")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not display_name:
            raise ValueError("Display name is required.")

        api_token = make_token("fai")
        user = User(
            email=email,
            password_hash=hash_password(password),
            display_name=display_name[:80],
            api_token_hash=hash_token(api_token),
        )

        try:
            async with self.sessionmaker() as session, session.begin():
                users = UserRepository(session)
                await users.add(user)
        except IntegrityError as exc:
            raise ValueError("An account already exists for that email.") from exc

        _, session_token = await self.login(email=email, password=password)
        return user_session(user, api_token), session_token

    async def login(self, *, email: str, password: str) -> tuple[UserSession, str]:
        async with self.sessionmaker() as session, session.begin():
            users = UserRepository(session)
            user = await users.get_by_email(normalize_email(email))
            if user is None or not verify_password(password, user.password_hash):
                raise ValueError("Invalid email or password.")

            token = make_token("session")
            await users.create_session(user.id, token)
            return user_session(user), token

    async def authenticate_session(self, token: str) -> UserSession | None:
        async with self.sessionmaker() as session:
            user = await UserRepository(session).get_by_session_token(token)
            return user_session(user) if user else None

    async def authenticate_api_token(self, token: str) -> UserSession | None:
        async with self.sessionmaker() as session:
            user = await UserRepository(session).get_by_api_token(token)
            return user_session(user) if user else None

    async def rotate_api_token(self, user_id: str) -> str:
        token = make_token("fai")
        async with self.sessionmaker() as session, session.begin():
            user = await UserRepository(session).get_by_id(user_id)
            if user is None:
                raise LookupError("User not found.")
            user.api_token_hash = hash_token(token)
        return token
