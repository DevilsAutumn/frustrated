from __future__ import annotations

from collections.abc import AsyncIterator

from quater import Request, Resource

from frustratedai.services.auth import AuthService
from frustratedai.services.frustrations import FrustrationService


async def auth_service_resource(request: Request) -> AsyncIterator[AuthService]:
    await ensure_database_ready(request)
    yield request.app.state.auth_service


async def frustration_service_resource(request: Request) -> AsyncIterator[FrustrationService]:
    await ensure_database_ready(request)
    yield request.app.state.frustration_service


async def ensure_database_ready(request: Request) -> None:
    if request.app.state.auto_create_tables and not request.app.state.database_ready:
        await request.app.state.db.create_tables()
        request.app.state.database_ready = True


auth_service = Resource(auth_service_resource)
frustration_service = Resource(frustration_service_resource)
