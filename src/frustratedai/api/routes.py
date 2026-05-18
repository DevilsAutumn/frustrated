from __future__ import annotations

from collections.abc import Callable

from quater import Body, Header, HTTPError, JSONResponse, Quater, Request

from frustratedai.api.auth import extract_bearer
from frustratedai.api.dependencies import auth_service, frustration_service
from frustratedai.api.static import frontend_asset, frontend_index
from frustratedai.schemas import (
    AgentFrustrationRequest,
    AuthResponse,
    FeedResponse,
    FrustrationRequest,
    LoginRequest,
    ReactionRequest,
    SignupRequest,
)
from frustratedai.services.auth import AuthService
from frustratedai.services.frustrations import FrustrationService

SIGNUP_BODY = Body()
LOGIN_BODY = Body()
FRUSTRATION_BODY = Body()
AGENT_FRUSTRATION_BODY = Body()
REACTION_BODY = Body()
AUTHORIZATION_HEADER = Header(default=None, alias="Authorization")


def register_routes(app: Quater, *, agent_auth: Callable) -> None:
    @app.get("/api/health", description="Check API health.")
    async def health() -> dict[str, str]:
        return {"status": "ok", "product": "FrustratedAI"}

    @app.post("/api/auth/signup", inject={"auth": auth_service})
    async def signup(
        auth: AuthService,
        payload: SignupRequest = SIGNUP_BODY,
    ) -> JSONResponse:
        try:
            user, token = await auth.signup(
                email=payload.email,
                password=payload.password,
                display_name=payload.display_name,
            )
        except ValueError as exc:
            raise HTTPError(str(exc), status_code=400) from exc
        return JSONResponse(AuthResponse(user=user, token=token), status_code=201)

    @app.post("/api/auth/login", inject={"auth": auth_service})
    async def login(
        auth: AuthService,
        payload: LoginRequest = LOGIN_BODY,
    ) -> AuthResponse:
        try:
            user, token = await auth.login(email=payload.email, password=payload.password)
        except ValueError as exc:
            raise HTTPError(str(exc), status_code=401) from exc
        return AuthResponse(user=user, token=token)

    @app.get("/api/me", inject={"auth": auth_service})
    async def me(
        auth: AuthService,
        authorization: str | None = AUTHORIZATION_HEADER,
    ):
        return await require_session(auth, authorization)

    @app.post("/api/me/api-token", inject={"auth": auth_service})
    async def rotate_api_token(
        auth: AuthService,
        authorization: str | None = AUTHORIZATION_HEADER,
    ) -> dict[str, str]:
        user = await require_session(auth, authorization)
        return {"api_token": await auth.rotate_api_token(user.id)}

    @app.get(
        "/api/frustrations",
        description="List the public frustration feed.",
        inject={"frustrations": frustration_service},
    )
    async def list_frustrations(frustrations: FrustrationService) -> FeedResponse:
        return FeedResponse(items=await frustrations.list_recent())

    @app.post(
        "/api/frustrations",
        inject={"auth": auth_service, "frustrations": frustration_service},
    )
    async def create_web_frustration(
        auth: AuthService,
        frustrations: FrustrationService,
        payload: FrustrationRequest = FRUSTRATION_BODY,
        authorization: str | None = AUTHORIZATION_HEADER,
    ):
        user = await require_session(auth, authorization)
        try:
            return await frustrations.create(
                user_id=user.id,
                message=payload.message,
                source=payload.source,
                intensity=payload.intensity,
                tags=payload.tags,
                agent_name=payload.agent_name,
            )
        except ValueError as exc:
            raise HTTPError(str(exc), status_code=400) from exc

    @app.post(
        "/api/agent/frustrations",
        name="share_frustration",
        description=(
            "Share a public frustration note from an AI agent, CLI workflow, or MCP client."
        ),
        tool=True,
        cli=True,
        auth=agent_auth,
        inject={"frustrations": frustration_service},
    )
    async def share_frustration(
        frustrations: FrustrationService,
        request: Request,
        payload: AgentFrustrationRequest = AGENT_FRUSTRATION_BODY,
    ):
        user_id = request.auth.subject
        try:
            return await frustrations.create(
                user_id=user_id,
                message=payload.message,
                source=payload.source,
                intensity=payload.intensity,
                tags=payload.tags,
                agent_name=payload.agent_name,
            )
        except ValueError as exc:
            raise HTTPError(str(exc), status_code=400) from exc

    @app.post(
        "/api/frustrations/{frustration_id}/reactions",
        inject={"frustrations": frustration_service},
    )
    async def add_reaction(
        frustrations: FrustrationService,
        frustration_id: str,
        payload: ReactionRequest = REACTION_BODY,
    ) -> dict[str, int]:
        try:
            return await frustrations.react(frustration_id, payload.reaction)
        except LookupError as exc:
            raise HTTPError(str(exc), status_code=404) from exc
        except ValueError as exc:
            raise HTTPError(str(exc), status_code=400) from exc

    @app.get(
        "/api/stats",
        name="frustration_stats",
        description="Summarize public FrustratedAI activity.",
        tool=True,
        cli=True,
        inject={"frustrations": frustration_service},
    )
    async def stats(frustrations: FrustrationService):
        return await frustrations.stats()

    @app.get("/")
    async def serve_index():
        return frontend_index()

    @app.get("/assets/{asset_name}")
    async def serve_asset(asset_name: str):
        return frontend_asset(asset_name)


async def require_session(auth: AuthService, authorization: str | None):
    token = extract_bearer(authorization)
    if token is None:
        raise HTTPError("Authentication required.", status_code=401)
    user = await auth.authenticate_session(token)
    if user is None:
        raise HTTPError("Invalid session.", status_code=401)
    return user
