from __future__ import annotations

from quater import CORSConfig, Quater

from frustratedai.api.auth import build_route_auth, build_surface_auth
from frustratedai.api.routes import register_routes
from frustratedai.core.config import Settings
from frustratedai.db.session import DatabaseSessionManager
from frustratedai.services.auth import AuthService
from frustratedai.services.frustrations import FrustrationService


def create_app(settings: Settings | None = None) -> Quater:
    settings = settings or Settings.from_env()
    db = DatabaseSessionManager.create(settings.database_url)
    auth_service = AuthService(db.sessionmaker)
    frustration_service = FrustrationService(db.sessionmaker)
    surface_auth = build_surface_auth(auth_service)
    route_auth = build_route_auth(auth_service)
    app = Quater(
        name="frustratedai",
        debug=settings.debug,
        allowed_hosts=settings.allowed_hosts,
        cors=CORSConfig(
            allowed_origins=settings.cors_allowed_origins,
            allowed_headers=("Authorization", "Content-Type"),
            allow_credentials=False,
        ),
        mcp_auth=surface_auth,
        cli_auth=surface_auth,
        docs_path="/api/docs",
        openapi_path="/api/openapi.json",
    )
    app.state.db = db
    app.state.auth_service = auth_service
    app.state.frustration_service = frustration_service
    app.state.auto_create_tables = settings.auto_create_tables
    app.state.database_ready = False

    @app.on_startup
    async def startup() -> None:
        if settings.auto_create_tables and not app.state.database_ready:
            await db.create_tables()
            app.state.database_ready = True

    @app.on_shutdown
    async def shutdown() -> None:
        await db.dispose()

    register_routes(app, route_auth=route_auth)
    return app


app = create_app()
