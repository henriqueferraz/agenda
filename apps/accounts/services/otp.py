"""Serviços de OTP por e-mail."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import EmailOtp, User
from apps.accounts.services.tokens import (
    OPAQUE_OTP_INVALID,
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_SECONDS,
    OTP_TTL_SECONDS,
    generate_otp_code,
    hash_secret,
)
from apps.core.security import timing_safe_equal


@dataclass(frozen=True, slots=True)
class OtpIssueResult:
    issued: bool
    cooldown_seconds: int = 0
    code_for_tests: str | None = None  # só preenchido em DEBUG/test


@dataclass(frozen=True, slots=True)
class OtpVerifyResult:
    ok: bool
    error: str | None = None


def _send_otp_email(user: User, code: str) -> None:
    send_mail(
        subject="Seu código de verificação — Agenda",
        message=f"Olá{f' {user.name}' if user.name else ''}!\n\nSeu código é: {code}\n",
        from_email=None,
        recipient_list=[user.email],
        fail_silently=False,
    )


@transaction.atomic
def issue_email_otp(user: User, *, force: bool = False) -> OtpIssueResult:
    """Gera/reenvia OTP hasheado. Respeita cooldown salvo ``force``."""
    now = timezone.now()
    latest = (
        EmailOtp.objects.select_for_update()
        .filter(user=user, consumed_at__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if latest and not force:
        elapsed = (now - latest.last_sent_at).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            return OtpIssueResult(
                issued=False,
                cooldown_seconds=int(OTP_RESEND_COOLDOWN_SECONDS - elapsed),
            )

    code = generate_otp_code()
    EmailOtp.objects.create(
        user=user,
        code_hash=hash_secret(code),
        expires_at=now + timedelta(seconds=OTP_TTL_SECONDS),
        last_sent_at=now,
    )
    _send_otp_email(user, code)
    from django.conf import settings

    expose = settings.DEBUG or getattr(settings, "OTP_EXPOSE_IN_TESTS", False)
    return OtpIssueResult(
        issued=True,
        code_for_tests=code if expose else None,
    )


@transaction.atomic
def verify_email_otp(user: User, code: str) -> OtpVerifyResult:
    now = timezone.now()
    otp = (
        EmailOtp.objects.select_for_update()
        .filter(user=user, consumed_at__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if otp is None or otp.expires_at < now:
        return OtpVerifyResult(ok=False, error=OPAQUE_OTP_INVALID)
    if otp.attempts >= OTP_MAX_ATTEMPTS:
        return OtpVerifyResult(ok=False, error=OPAQUE_OTP_INVALID)

    otp.attempts += 1
    otp.save(update_fields=["attempts"])

    if not timing_safe_equal(otp.code_hash, hash_secret(code.strip())):
        return OtpVerifyResult(ok=False, error=OPAQUE_OTP_INVALID)

    otp.consumed_at = now
    otp.save(update_fields=["consumed_at"])
    user.email_verified_at = now
    user.save(update_fields=["email_verified_at"])
    return OtpVerifyResult(ok=True)
