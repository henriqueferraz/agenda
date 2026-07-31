"""Geração de tokens públicos de booking no perfil."""

from __future__ import annotations

import secrets
import string

from django.utils.text import slugify

from apps.organizations.models import OrganizationProfile

_ALPHABET = string.ascii_letters + string.digits


def _random_token(length: int = 32) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


def _random_code(length: int = 20) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


def ensure_booking_tokens(profile: OrganizationProfile) -> OrganizationProfile:
    """Garante be_called / token_called / booking_public_code únicos."""
    changed: list[str] = []
    if not profile.token_called:
        profile.token_called = _random_token(40)
        changed.append("token_called")
    if not profile.booking_public_code:
        profile.booking_public_code = _random_code(20)
        changed.append("booking_public_code")
    if not profile.be_called:
        base = slugify(profile.trade_name or profile.user.email.split("@")[0]) or "agenda"
        candidate = base[:50]
        suffix = 0
        while (
            OrganizationProfile.objects.filter(be_called=candidate).exclude(pk=profile.pk).exists()
        ):
            suffix += 1
            candidate = f"{base[:40]}-{suffix}"
        profile.be_called = candidate
        changed.append("be_called")
    if changed:
        profile.save(update_fields=[*changed, "updated_at"])
    return profile
