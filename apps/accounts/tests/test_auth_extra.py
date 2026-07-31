from __future__ import annotations

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.accounts.services.auth import change_password, register_user
from apps.accounts.services.rate_limit import is_login_locked, record_login_attempt
from apps.accounts.services.tokens import LOGIN_MAX_FAILURES


@pytest.mark.django_db
def test_register_view_and_pages(client) -> None:
    assert client.get(reverse("accounts:register")).status_code == 200
    assert client.get(reverse("accounts:login")).status_code == 200
    assert client.get(reverse("accounts:forgot_password")).status_code == 200
    resp = client.post(
        reverse("accounts:register"),
        {
            "name": "Ana",
            "email": "view@example.com",
            "password": "SenhaSegura123!",
        },
    )
    assert resp.status_code == 302
    assert User.objects.filter(email="view@example.com").exists()


@pytest.mark.django_db
def test_change_password_service() -> None:
    user = User.objects.create_user(
        email="chg@example.com",
        password="SenhaAntiga123!",
        email_verified_at=timezone.now(),
    )
    bad = change_password(user=user, current_password="errada", new_password="SenhaNova1234!")
    assert not bad.ok
    ok = change_password(
        user=user,
        current_password="SenhaAntiga123!",
        new_password="SenhaNova1234!",
    )
    assert ok.ok
    user.refresh_from_db()
    assert user.check_password("SenhaNova1234!")


@pytest.mark.django_db
def test_login_lockout() -> None:
    email = "lock@example.com"
    User.objects.create_user(
        email=email,
        password="SenhaSegura123!",
        email_verified_at=timezone.now(),
    )
    for _ in range(LOGIN_MAX_FAILURES):
        record_login_attempt(email=email, ip_address="127.0.0.1", successful=False)
    assert is_login_locked(email)


@pytest.mark.django_db
def test_rate_limit_blocks(monkeypatch) -> None:
    from apps.accounts.services import rate_limit as rl

    monkeypatch.setattr(rl, "RATE_LIMIT_MAX_REQUESTS", 2)
    assert rl.check_rate_limit("1.2.3.4", "test_scope").allowed
    assert rl.check_rate_limit("1.2.3.4", "test_scope").allowed
    blocked = rl.check_rate_limit("1.2.3.4", "test_scope")
    assert not blocked.allowed


@pytest.mark.django_db
def test_master_users_view(client) -> None:
    master = User.objects.create_user(
        email="boss@example.com",
        password="SenhaSegura123!",
        role=UserRole.MASTER,
        email_verified_at=timezone.now(),
        is_staff=True,
    )
    client.force_login(master)
    resp = client.get(reverse("accounts:master_users"))
    assert resp.status_code == 200


@pytest.mark.django_db
def test_logout_view(client) -> None:
    user = User.objects.create_user(
        email="out@example.com",
        password="SenhaSegura123!",
        email_verified_at=timezone.now(),
    )
    client.force_login(user)
    resp = client.post(reverse("accounts:logout"))
    assert resp.status_code == 302


@pytest.mark.django_db
def test_duplicate_register_is_opaque(client) -> None:
    register_user(email="dup@example.com", password="SenhaSegura123!")
    again = register_user(email="dup@example.com", password="SenhaSegura123!")
    assert again.ok
    assert "Se o e-mail existir" in again.message
