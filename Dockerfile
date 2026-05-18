FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS runtime
WORKDIR /app
ENV UV_LINK_MODE=copy
ENV PYTHONPATH=/app/src
COPY pyproject.toml uv.lock README.md alembic.ini ./
COPY src ./src
COPY migrations ./migrations
RUN uv sync --no-dev
EXPOSE 8000
CMD ["sh", "-c", "uv run quater run frustratedai.app:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --no-reload"]
