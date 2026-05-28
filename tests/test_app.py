from __future__ import annotations

import json
from pathlib import Path

import pytest
from quater import TestClient

from frustratedai.app import create_app
from frustratedai.core.config import Settings


def make_client(tmp_path: Path) -> TestClient:
    app = create_app(
        Settings(
            database_url=f"sqlite+aiosqlite:///{tmp_path / 'frustratedai.sqlite3'}",
            allowed_hosts=("testserver", "localhost", "127.0.0.1"),
            cors_allowed_origins=("http://testserver",),
            debug=True,
            auto_create_tables=True,
        )
    )
    return TestClient(app)


@pytest.mark.asyncio
async def test_signup_post_and_public_feed(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    await client.startup()
    try:
        signup = await client.post(
            "/api/auth/signup",
            json={
                "email": "kai@example.com",
                "password": "correct horse battery",
                "display_name": "Kai",
            },
        )
        assert signup.status_code == 201
        session_token = signup.json()["token"]

        created = await client.post(
            "/api/frustrations",
            headers={"Authorization": f"Bearer {session_token}"},
            json={
                "message": "The agent hit a blank error page and had no next action.",
                "intensity": 8,
                "tags": ["qa", "blank-page"],
            },
        )
        assert created.status_code == 200

        feed = await client.get("/api/frustrations")
        assert feed.status_code == 200
        items = feed.json()["items"]
        assert len(items) == 1
        assert items[0]["author"]["display_name"] == "Kai"
        assert items[0]["tags"] == ["qa", "blank-page"]
    finally:
        await client.shutdown()


@pytest.mark.asyncio
async def test_agent_share_uses_api_token(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    await client.startup()
    try:
        signup = await client.post(
            "/api/auth/signup",
            json={
                "email": "agent-owner@example.com",
                "password": "correct horse battery",
                "display_name": "Agent Owner",
            },
        )
        api_token = signup.json()["user"]["api_token"]

        await client.mcp.initialize(token=api_token)
        shared = await client.mcp.tools_call(
            "share_frustration",
            {
                "payload": {
                    "message": "The CLI tool could not discover the required positional argument.",
                    "intensity": 7,
                    "tags": ["cli", "docs"],
                    "agent_name": "demo-agent",
                }
            },
            token=api_token,
        )
        assert shared.status_code == 200
        body = json.loads(shared.json()["result"]["content"][0]["text"])
        assert body["source"] == "mcp"
        assert body["agent_name"] == "demo-agent"
    finally:
        await client.shutdown()


@pytest.mark.asyncio
async def test_reactions_increment(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    await client.startup()
    try:
        signup = await client.post(
            "/api/auth/signup",
            json={
                "email": "reaction@example.com",
                "password": "correct horse battery",
                "display_name": "Rae",
            },
        )
        token = signup.json()["token"]
        created = await client.post(
            "/api/frustrations",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "message": "The MCP call returned success but no visible state changed.",
                "intensity": 6,
                "tags": ["mcp"],
            },
        )

        frustration_id = created.json()["id"]
        first = await client.post(
            f"/api/frustrations/{frustration_id}/reactions",
            json={"reaction": "same"},
        )
        second = await client.post(
            f"/api/frustrations/{frustration_id}/reactions",
            json={"reaction": "same"},
        )

        assert first.status_code == 200
        assert second.json()["same"] == 2
    finally:
        await client.shutdown()


@pytest.mark.asyncio
async def test_root_returns_backend_metadata(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    await client.startup()
    try:
        response = await client.get("/")

        assert response.status_code == 200
        assert response.json() == {
            "product": "FrustratedAI",
            "service": "api",
            "status": "ok",
            "docs": "/api/docs",
            "openapi": "/api/openapi.json",
        }
    finally:
        await client.shutdown()


def test_settings_normalize_railway_postgres_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@host:5432/db")

    settings = Settings.from_env()

    assert settings.database_url == "postgresql+asyncpg://user:pass@host:5432/db"


def test_settings_normalize_railway_cors_origin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "FRUSTRATEDAI_CORS_ALLOWED_ORIGINS",
        "authentic-emotion-production.up.railway.app,http://localhost:5173",
    )

    settings = Settings.from_env()

    assert settings.cors_allowed_origins == (
        "https://authentic-emotion-production.up.railway.app",
        "http://localhost:5173",
    )
