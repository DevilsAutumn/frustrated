FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS runtime
WORKDIR /app
ENV UV_LINK_MODE=copy
ENV PYTHONPATH=/app/src
COPY pyproject.toml uv.lock README.md alembic.ini ./
COPY src ./src
COPY migrations ./migrations
RUN uv sync --no-dev
EXPOSE 8000
CMD ["uv", "run", "quater", "run", "src/frustratedai/app.py", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-reload"]
