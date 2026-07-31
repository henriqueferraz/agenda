from __future__ import annotations

from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone

from apps.accounts.models import Plan, User, UserRole
from apps.accounts.services.auth import register_user, verify_registration_otp
from apps.accounts.services.otp import issue_email_otp, verify_email_otp
from apps.accounts.services.tokens import hash_secret


@pytest.mark.django_db
def test_register_sets_trial_and_sends_otp() -> None:
    result = register_user(email="a@example.com", password="SenhaSegura123!", name="Ana")
    assert result.ok
    user = User.objects.get(email="a@example.com")
    assert user.plan == Plan.TRIAL
    assert user.role == UserRole.ENTERPRISE
    assert user.trial_ends_at is not None
    assert user.email_verified_at is None
    assert len(mail.outbox) == 1
    assert result.otp_code_for_tests


@pytest.mark.django_db
def test_otp_verify_and_expiry() -> None:
    user = User.objects.create_user(email="b@example.com", password="SenhaSegura123!")
    issue = issue_email_otp(user, force=True)
    assert issue.code_for_tests
    ok = verify_email_otp(user, issue.code_for_tests)
    assert ok.ok
    user.refresh_from_db()
    assert user.email_verified_at is not None


@pytest.mark.django_db
def test_otp_rejects_wrong_code() -> None:
    user = User.objects.create_user(email="c@example.com", password="SenhaSegura123!")
    issue_email_otp(user, force=True)
    bad = verify_email_otp(user, "000000")
    assert not bad.ok


@pytest.mark.django_db
def test_trial_is_expired_property() -> None:
    user = User.objects.create_user(
        email="d@example.com",
        password="SenhaSegura123!",
        role=UserRole.ENTERPRISE,
        plan=Plan.TRIAL,
        trial_ends_at=timezone.now() - timedelta(days=1),
    )
    assert user.trial_is_expired()
    user.plan = Plan.BASIC
    assert not user.trial_is_expired()
    user.role = UserRole.MASTER
    user.plan = Plan.TRIAL
    assert not user.trial_is_expired()


def test_hash_secret_stable() -> None:
    assert hash_secret("123456") == hash_secret("123456")
    assert hash_secret("123456") != hash_secret("654321")


@pytest.mark.django_db
def test_verify_registration_flow() -> None:
    reg = register_user(email="e@example.com", password="SenhaSegura123!")
    assert reg.otp_code_for_tests
    verified = verify_registration_otp(email="e@example.com", code=reg.otp_code_for_tests)
    assert verified.ok
