"""Logging configuration module for the FastAPI Backend using Loguru."""
import os
import sys

# Import Sentry SDK and Loguru directly
import sentry_sdk
from loguru import logger as loguru_logger
from sentry_sdk.integrations.loguru import LoguruIntegration

# Initialize Sentry SDK with Loguru integration
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    environment=os.getenv("ENVIRONMENT", "local"),
    traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
    profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
    integrations=[
        LoguruIntegration(),
    ],
    send_default_pii=False,  # GDPR compliant default
)

# Remove default handler
loguru_logger.remove()

# Determine environment
env = os.getenv("ENVIRONMENT", "local").lower()
is_prod = env in ("production", "staging")

# Add console handler with environment-specific format
if is_prod:
    # Simple format for production - no colors, no timestamp, just the message
    # The cloud logging service will handle timestamps and formatting
    loguru_logger.add(
        sys.stderr,
        format="{message}",
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        colorize=False,
        backtrace=True,
        diagnose=True,
    )
else:
    # Detailed colorized format for development
    loguru_logger.add(
        sys.stderr,
        format="<level>{level}</level> | <green>{time:YYYY-MM-DD HH:mm:ss}</green> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        colorize=True,
        backtrace=True,  # Detailed exception information
        diagnose=True,   # Display variables in all frames
    )

# Create a logger instance that can be imported by other modules
logger = loguru_logger.bind(app_name="fastapi_backend")
