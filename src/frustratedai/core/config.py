from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _csv(name: str, default: str) -> tuple[str, ...]:
    return tuple(value.strip() for value in os.getenv(name, default).split(",") if value.strip())


def _database_url(value: str) -> str:
    if value.startswith("postgresql://"):
        return value.replace("postgresql://", "postgresql+asyncpg://", 1)
    return value


@dataclass(frozen=True)
class Settings:
    database_url: str
    allowed_hosts: tuple[str, ...]
    cors_allowed_origins: tuple[str, ...]
    debug: bool
    auto_create_tables: bool

    @classmethod
    def from_env(cls) -> Settings:
        debug = os.getenv("FRUSTRATEDAI_DEBUG", "0") == "1"
        return cls(
            database_url=_database_url(
                os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://frustratedai:frustratedai@localhost:5432/frustratedai",
                )
            ),
            allowed_hosts=_csv("FRUSTRATEDAI_ALLOWED_HOSTS", "localhost,127.0.0.1"),
            cors_allowed_origins=_csv(
                "FRUSTRATEDAI_CORS_ALLOWED_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            ),
            debug=debug,
            auto_create_tables=os.getenv("FRUSTRATEDAI_AUTO_CREATE_TABLES", "0") == "1",
        )
