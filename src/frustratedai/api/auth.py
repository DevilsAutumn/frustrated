from __future__ import annotations

from collections.abc import Callable

from quater import AuthContext, AuthRequest, HTTPError

from frustratedai.services.auth import AuthService


def extract_bearer(value: str | None) -> str | None:
    if not value:
        return None
    if value.lower().startswith("bearer "):
        return value[7:].strip()
    return value.strip()


def build_surface_auth(auth_service: AuthService) -> Callable[[AuthRequest], object]:
    async def surface_auth(request: AuthRequest) -> AuthContext:
        token = extract_bearer(request.headers.get("authorization"))
        if not token:
            raise HTTPError("MCP and CLI access requires a bearer token.", status_code=401)

        user = await auth_service.authenticate_api_token(token)
        if user:
            return AuthContext(
                subject=user.id,
                metadata={
                    "email": user.email,
                    "display_name": user.display_name,
                    "path": request.path,
                },
            )
        raise HTTPError("MCP and CLI access requires a valid bearer token.", status_code=401)

    return surface_auth
