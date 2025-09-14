FROM python:3.10

ENV PYTHONUNBUFFERED=1
# Set a longer timeout for UV HTTP operations (default is 30s)
ENV UV_HTTP_TIMEOUT=120

WORKDIR /app/

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Copy dependency specification files first for better layer caching
COPY ./pyproject.toml ./uv.lock ./Makefile /app/

# Install dependencies with retry mechanism for network resilience
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    for i in 1 2 3; do \
      echo "Attempt $i: Installing dependencies..." && \
      uv sync --frozen --no-install-project && break || \
      echo "Attempt $i failed, retrying in 5 seconds..." && \
      sleep 5; \
    done

ENV PYTHONPATH=/app

# Copy application code after dependencies are installed
COPY ./app /app/app

# Install the project (development install)
RUN --mount=type=cache,target=/root/.cache/uv \
    for i in 1 2 3; do \
      echo "Attempt $i: Installing project..." && \
      uv sync && break || \
      echo "Attempt $i failed, retrying in 5 seconds..." && \
      sleep 5; \
    done

# Production configuration settings with defaults that can be overridden at runtime
# - LOG_LEVEL controls uvicorn's log verbosity
ENV LOG_LEVEL=info

# Use shell form to allow environment variable expansion
# The exec-form (JSON array) doesn't expand ${VARS}
# Use default values with the :- syntax in case ENV vars aren't set
CMD bash -c "uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level ${LOG_LEVEL:-info}"
