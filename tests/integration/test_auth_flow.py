from __future__ import annotations

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import Plan, User, UserRole
from apps.accounts.services.auth import register_user


@pytest.mark.django_db
def test_f1_partial_register_otp_login(client) -> None:
    """Fluxo F1 parcial: cadastro → OTP → login (integração / e2e-light)."""
    password = "SenhaSegura123!"
    reg = register_user(email="flow@example.com", password=password, name="Flow")
    assert reg.otp_code_for_tests

    verify = client.post(
        reverse("accounts:verify_otp"),
        {"email": "flow@example.com", "code": reg.otp_code_for_tests},
    )
    assert verify.status_code == 302

    login_resp = client.post(
        reverse("accounts:login"),
        {"email": "flow@example.com", "password": password},
    )
    assert login_resp.status_code == 302
    assert login_resp.url == reverse("dashboard:home")

    home = client.get(reverse("dashboard:home"))
    assert home.status_code == 200


@pytest.mark.django_db
def test_login_requires_verified_email(client) -> None:
    User.objects.create_user(email="nov@example.com", password="SenhaSegura123!")
    resp = client.post(
        reverse("accounts:login"),
        {"email": "nov@example.com", "password": "SenhaSegura123!"},
    )
    assert resp.status_code == 200
    assert b"Confirme seu e-mail" in resp.content


@pytest.mark.django_db
def test_trial_middleware_redirects_to_upgrade(client) -> None:
    user = User.objects.create_user(
        email="trial@example.com",
        password="SenhaSegura123!",
        role=UserRole.ENTERPRISE,
        plan=Plan.TRIAL,
        trial_ends_at=timezone.now() - timedelta(hours=1),
        email_verified_at=timezone.now(),
    )
    client.force_login(user)
    resp = client.get(reverse("dashboard:home"))
    assert resp.status_code == 302
    assert resp.url == reverse("accounts:upgrade")


@pytest.mark.django_db
def test_master_bypasses_trial_gate(client) -> None:
    user = User.objects.create_user(
        email="master@example.com",
        password="SenhaSegura123!",
        role=UserRole.MASTER,
        plan=Plan.TRIAL,
        trial_ends_at=timezone.now() - timedelta(hours=1),
        email_verified_at=timezone.now(),
    )
    client.force_login(user)
    resp = client.get(reverse("dashboard:home"))
    assert resp.status_code == 200


@pytest.mark.django_db
def test_forgot_and_reset_password(client) -> None:
    user = User.objects.create_user(
        email="reset@example.com",
        password="SenhaAntiga123!",
        email_verified_at=timezone.now(),
    )
    from apps.accounts.services.auth import request_password_reset, reset_password

    result = request_password_reset(email=user.email)
    assert result.otp_code_for_tests
    done = reset_password(token=result.otp_code_for_tests, new_password="SenhaNova1234!")
    assert done.ok
    user.refresh_from_db()
    assert user.check_password("SenhaNova1234!")
