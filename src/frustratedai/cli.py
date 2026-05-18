from __future__ import annotations

import sys


def main() -> None:
    sys.stdout.write(
        "FrustratedAI is a Quater product app.\n\n"
        "Run the backend:\n"
        "  uv run quater dev src/frustratedai/app.py\n\n"
        "Run the frontend:\n"
        "  cd frontend && npm run dev\n\n"
        "List CLI actions:\n"
        "  uv run quater --app frustratedai.app:app actions list\n"
    )
