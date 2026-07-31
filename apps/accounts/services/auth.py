"""Casos de uso de registro, login e reset de senha."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import PasswordResetToken, Plan, User, UserRole
from apps.accounts.services.otp import issue_email_otp, verify_email_otp
from apps.accounts.services.rate_limit import (
    check_rate_limit,
    client_ip,
    is_login_locked,
    record_login_attempt,
)
from apps.accounts.services.tokens import (
    GENERIC_AUTH_MESSAGE,
    GENERIC_OTP_MESSAGE,
    OPAQUE_OTP_INVALID,
    OPAQUE_RESET_INVALID,
    RESET_TTL_SECONDS,
    generate_reset_token,
    hash_secret,
)
from apps.core.security import timing_safe_equal


@dataclass(frozen=True, slots=True)
class AuthMessageResult:
    ok: bool
    message: str
    user: User | None = None
    otp_code_for_tests: str | None = None


@transaction.atomic
def register_user(*, email: str, password: str, name: str = "", request=None) -> AuthMessageResult:
    ip = client_ip(request) if request is not None else None
    limit = check_rate_limit(ip, "register")
    if not limit.allowed:
        return AuthMessageResult(ok=False, message="Muitas tentativas. Aguarde e tente novamente.")

    normalized = email.strip().lower()
    existing = User.objects.filter(email__iexact=normalized).first()
    if existing:
        if existing.email_verified_at is None:
            issue = issue_email_otp(existing)
            return AuthMessageResult(
                ok=True,
                message=GENERIC_AUTH_MESSAGE,
                otp_code_for_tests=issue.code_for_tests,
            )
        return AuthMessageResult(ok=True, message=GENERIC_AUTH_MESSAGE)

    user = User(
        email=normalized,
        name=name.strip(),
        role=UserRole.ENTERPRISE,
        plan=Plan.TRIAL,
        trial_ends_at=timezone.now() + timedelta(days=30),
        is_active=True,
    )
    user.set_password(password)
    user.save()
    issue = issue_email_otp(user)
    return AuthMessageResult(
        ok=True,
        message=GENERIC_AUTH_MESSAGE,
        user=user,
        otp_code_for_tests=issue.code_for_tests,
    )


def resend_otp(*, email: str, request=None) -> AuthMessageResult:
    ip = client_ip(request) if request is not None else None
    limit = check_rate_limit(ip, "otp_resend")
    if not limit.allowed:
        return AuthMessageResult(ok=False, message="Muitas tentativas. Aguarde e tente novamente.")

    user = User.objects.filter(email__iexact=email.strip().lower()).first()
    if user is None or user.email_verified_at is not None:
        return AuthMessageResult(ok=True, message=GENERIC_OTP_MESSAGE)

    issue = issue_email_otp(user)
    if not issue.issued:
        return AuthMessageResult(
            ok=False,
            message=f"Aguarde {issue.cooldown_seconds}s para reenviar o código.",
        )
    return AuthMessageResult(
        ok=True,
        message=GENERIC_OTP_MESSAGE,
        otp_code_for_tests=issue.code_for_tests,
    )


def verify_registration_otp(*, email: str, code: str, request=None) -> AuthMessageResult:
    ip = client_ip(request) if request is not None else None
    limit = check_rate_limit(ip, "otp_verify")
    if not limit.allowed:
        return AuthMessageResult(ok=False, message="Muitas tentativas. Aguarde e tente novamente.")

    user = User.objects.filter(email__iexact=email.strip().lower()).first()
    if user is None:
        return AuthMessageResult(ok=False, message=OPAQUE_OTP_INVALID)

    result = verify_email_otp(user, code)
    if not result.ok:
        return AuthMessageResult(ok=False, message=result.error or OPAQUE_OTP_INVALID)
    return AuthMessageResult(ok=True, message="E-mail verificado. Você já pode entrar.", user=user)


def login_user(*, request, email: str, password: str) -> AuthMessageResult:
    ip = client_ip(request)
    limit = check_rate_limit(ip, "login")
    if not limit.allowed:
        return AuthMessageResult(ok=False, message="Muitas tentativas. Aguarde e tente novamente.")

    normalized = email.strip().lower()
    if is_login_locked(normalized):
        return AuthMessageResult(
            ok=False,
            message="Conta temporariamente bloqueada. Tente mais tarde.",
        )

    user = authenticate(request, username=normalized, password=password)
    if user is None:
        record_login_attempt(email=normalized, ip_address=ip, successful=False)
        return AuthMessageResult(ok=False, message="E-mail ou senha inválidos.")

    if user.email_verified_at is None:
        return AuthMessageResult(ok=False, message="Confirme seu e-mail antes de entrar.")

    login(request, user)
    request.session.cycle_key()
    record_login_attempt(email=normalized, ip_address=ip, successful=True)
    return AuthMessageResult(ok=True, message="Login realizado.", user=user)


def logout_user(request) -> None:
    logout(request)


def request_password_reset(*, email: str, request=None) -> AuthMessageResult:
    ip = client_ip(request) if request is not None else None
    limit = check_rate_limit(ip, "forgot")
    if not limit.allowed:
        return AuthMessageResult(ok=False, message="Muitas tentativas. Aguarde e tente novamente.")

    normalized = email.strip().lower()
    user = User.objects.filter(email__iexact=normalized).first()
    if user is None:
        return AuthMessageResult(ok=True, message=GENERIC_AUTH_MESSAGE)

    raw = generate_reset_token()
    PasswordResetToken.objects.create(
        user=user,
        token_hash=hash_secret(raw),
        expires_at=timezone.now() + timedelta(seconds=RESET_TTL_SECONDS),
    )
    reset_url = f"{settings.PUBLIC_APP_URL.rstrip('/')}/redefinir-senha/?token={raw}"
    send_mail(
        subject="Redefinição de senha — Agenda",
        message=f"Use o link para redefinir sua senha (válido por 1h):\n{reset_url}\n",
        from_email=None,
        recipient_list=[user.email],
        fail_silently=False,
    )
    expose = settings.DEBUG or getattr(settings, "OTP_EXPOSE_IN_TESTS", False)
    return AuthMessageResult(
        ok=True,
        message=GENERIC_AUTH_MESSAGE,
        otp_code_for_tests=raw if expose else None,
    )


@transaction.atomic
def reset_password(*, token: str, new_password: str) -> AuthMessageResult:
    now = timezone.now()
    token_hash = hash_secret(token)
    row = (
        PasswordResetToken.objects.select_for_update()
        .filter(used_at__isnull=True, expires_at__gte=now, token_hash=token_hash)
        .select_related("user")
        .first()
    )
    if row is None or not timing_safe_equal(row.token_hash, token_hash):
        return AuthMessageResult(ok=False, message=OPAQUE_RESET_INVALID)

    user = row.user
    user.set_password(new_password)
    user.save(update_fields=["password"])
    row.used_at = now
    row.save(update_fields=["used_at"])
    return AuthMessageResult(ok=True, message="Senha atualizada. Faça login.", user=user)


def change_password(*, user: User, current_password: str, new_password: str) -> AuthMessageResult:
    if not user.check_password(current_password):
        return AuthMessageResult(ok=False, message="Senha atual incorreta.")
    user.set_password(new_password)
    user.save(update_fields=["password"])
    return AuthMessageResult(ok=True, message="Senha alterada com sucesso.", user=user)
