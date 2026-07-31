"""Settings para pytest."""

from __future__ import annotations

from .base import *  # noqa: F403

DEBUG = False

MIDDLEWARE = [
    mw
    for mw in MIDDLEWARE  # noqa: F405
    if mw != "whitenoise.middleware.WhiteNoiseMiddleware"
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    },
}

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.InMemoryStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
