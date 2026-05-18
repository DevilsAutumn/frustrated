from __future__ import annotations

import mimetypes
from pathlib import Path

from quater import BytesResponse, HTMLResponse, HTTPError


def frontend_dist() -> Path:
    return Path(__file__).resolve().parents[1] / "web"


def frontend_index() -> HTMLResponse:
    index_path = frontend_dist() / "index.html"
    if not index_path.exists():
        return HTMLResponse(
            "<h1>FrustratedAI API is running</h1>"
            "<p>Build the frontend with <code>cd frontend && npm run build</code>.</p>"
        )
    return HTMLResponse(index_path.read_text(encoding="utf-8"))


def frontend_asset(asset_name: str) -> BytesResponse:
    asset_path = (frontend_dist() / "assets" / asset_name).resolve()
    assets_dir = (frontend_dist() / "assets").resolve()
    if assets_dir not in asset_path.parents or not asset_path.exists():
        raise HTTPError("Asset not found.", status_code=404)
    content_type = mimetypes.guess_type(asset_path.name)[0] or "application/octet-stream"
    return BytesResponse(asset_path.read_bytes(), content_type=content_type)
