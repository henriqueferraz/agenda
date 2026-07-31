"""Settings de produção."""

from __future__ import annotations

from .base import *  # noqa: F403
from .base import env

DEBUG = False

SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
if SMTP_HOST:  # noqa: F405
    EMAIL_HOST = SMTP_HOST  # noqa: F405
    EMAIL_PORT = SMTP_PORT  # noqa: F405
    EMAIL_HOST_USER = SMTP_USER  # noqa: F405
    EMAIL_HOST_PASSWORD = SMTP_PASS  # noqa: F405
    EMAIL_USE_TLS = True
    DEFAULT_FROM_EMAIL = SMTP_FROM or MAILTRAP_SENDER_EMAIL  # noqa: F405
