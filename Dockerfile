FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS runtime
WORKDIR /app
ENV UV_LINK_MODE=copy
COPY pyproject.toml README.md ./
COPY src ./src
COPY --from=frontend /app/frontend/dist ./src/frustratedai/web
RUN uv sync --no-dev
EXPOSE 8000
CMD ["uv", "run", "quater", "run", "src/frustratedai/app.py", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-reload"]
