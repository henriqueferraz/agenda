"""Rate limit e lockout por IP/e-mail."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import IpRateLimit, LoginAttempt
from apps.accounts.services.tokens import (
    LOGIN_LOCKOUT_SECONDS,
    LOGIN_MAX_FAILURES,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
)


@dataclass(frozen=True, slots=True)
class RateLimitResult:
    allowed: bool
    retry_after_seconds: int = 0


def client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR")
    if not forwarded:
        return None
    return forwarded.split(",")[0].strip()


@transaction.atomic
def check_rate_limit(ip_address: str | None, scope: str) -> RateLimitResult:
    if not ip_address:
        return RateLimitResult(allowed=True)
    now = timezone.now()
    row, _ = IpRateLimit.objects.select_for_update().get_or_create(
        ip_address=ip_address,
        scope=scope,
        defaults={"window_started_at": now, "count": 0},
    )
    if now - row.window_started_at >= timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS):
        row.window_started_at = now
        row.count = 0
    if row.count >= RATE_LIMIT_MAX_REQUESTS:
        elapsed = (now - row.window_started_at).total_seconds()
        retry = max(1, int(RATE_LIMIT_WINDOW_SECONDS - elapsed))
        return RateLimitResult(allowed=False, retry_after_seconds=retry)
    row.count += 1
    row.save(update_fields=["window_started_at", "count"])
    return RateLimitResult(allowed=True)


def record_login_attempt(*, email: str, ip_address: str | None, successful: bool) -> None:
    LoginAttempt.objects.create(email=email.lower(), ip_address=ip_address, successful=successful)


def is_login_locked(email: str) -> bool:
    since = timezone.now() - timedelta(seconds=LOGIN_LOCKOUT_SECONDS)
    failures = LoginAttempt.objects.filter(
        email=email.lower(),
        successful=False,
        created_at__gte=since,
    ).count()
    return failures >= LOGIN_MAX_FAILURES
