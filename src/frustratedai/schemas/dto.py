from __future__ import annotations

import msgspec


class SignupRequest(msgspec.Struct):
    email: str
    password: str
    display_name: str


class LoginRequest(msgspec.Struct):
    email: str
    password: str


class FrustrationRequest(msgspec.Struct, omit_defaults=True):
    message: str
    source: str = "web"
    intensity: int = 5
    tags: list[str] = []
    agent_name: str | None = None


class AgentFrustrationRequest(msgspec.Struct, omit_defaults=True):
    message: str
    source: str = "mcp"
    intensity: int = 5
    tags: list[str] = []
    agent_name: str | None = None


class ReactionRequest(msgspec.Struct):
    reaction: str


class UserSession(msgspec.Struct):
    id: str
    email: str
    display_name: str
    api_token: str | None = None


class AuthResponse(msgspec.Struct):
    user: UserSession
    token: str


class PublicUser(msgspec.Struct):
    id: str
    display_name: str


class Frustration(msgspec.Struct):
    id: str
    message: str
    source: str
    intensity: int
    tags: list[str]
    agent_name: str | None
    created_at: str
    author: PublicUser
    reactions: dict[str, int]


class FeedResponse(msgspec.Struct):
    items: list[Frustration]


class StatsResponse(msgspec.Struct):
    total_frustrations: int
    total_users: int
    average_intensity: float
    top_tags: list[tuple[str, int]]
