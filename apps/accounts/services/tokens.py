"""Constantes e hashing de tokens de auth."""

from __future__ import annotations

import hashlib
import secrets

from django.conf import settings

OTP_LENGTH = 6
OTP_TTL_SECONDS = 10 * 60
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60

RESET_TOKEN_BYTES = 32
RESET_TTL_SECONDS = 60 * 60

LOGIN_MAX_FAILURES = 5
LOGIN_LOCKOUT_SECONDS = 15 * 60

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 20

GENERIC_AUTH_MESSAGE = "Se o e-mail existir, enviamos as instruções."
GENERIC_OTP_MESSAGE = "Se o e-mail existir, enviamos um novo código."
OPAQUE_OTP_INVALID = "Código inválido ou expirado."
OPAQUE_RESET_INVALID = "Link inválido ou expirado."


def hash_secret(value: str) -> str:
    """Hash SHA-256 com pepper da SECRET_KEY."""
    material = f"{settings.SECRET_KEY}:{value}".encode()
    return hashlib.sha256(material).hexdigest()


def generate_otp_code() -> str:
    """Gera OTP numérico de alta entropia."""
    upper = 10**OTP_LENGTH
    return f"{secrets.randbelow(upper):0{OTP_LENGTH}d}"


def generate_reset_token() -> str:
    return secrets.token_urlsafe(RESET_TOKEN_BYTES)
