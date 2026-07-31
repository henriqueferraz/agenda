"""Integração F1: login → onboarding completo."""

from __future__ import annotations

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.organizations.models import Activity
from apps.organizations.services import activity as activity_services

VALID_CPF = "39053344705"


@pytest.mark.django_db
def test_f1_login_to_onboarding_complete(client) -> None:
    activity_services.seed_default_activities()
    activity = Activity.objects.get(slug="barbearia")
    password = "SenhaSegura123!"
    user = User.objects.create_user(
        email="onboard@example.com",
        password=password,
        name="Onboard",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])

    login = client.post(
        reverse("accounts:login"),
        {"email": "onboard@example.com", "password": password},
    )
    assert login.status_code == 302
    assert login.url == reverse("organizations:activity")

    step1 = client.post(
        reverse("organizations:activity"),
        {"activity": str(activity.pk)},
    )
    assert step1.status_code == 302
    assert step1.url == reverse("organizations:model")

    step2 = client.post(
        reverse("organizations:model"),
        {
            "person_type": "PF",
            "trade_name": "Barbearia Onboard",
            "cpf": VALID_CPF,
        },
    )
    assert step2.status_code == 302
    assert step2.url == reverse("organizations:address")

    step3 = client.post(
        reverse("organizations:address"),
        {
            "zip_code": "01310100",
            "street": "Av Paulista",
            "number": "1000",
            "complement": "",
            "neighborhood": "Bela Vista",
            "city": "São Paulo",
            "state": "SP",
            "country": "Brasil",
        },
    )
    assert step3.status_code == 302
    assert step3.url == reverse("organizations:hours")

    step4 = client.post(
        reverse("organizations:hours"),
        {
            "mon_times": "08:00\n09:00",
            "tue_times": "",
            "wed_times": "",
            "thu_times": "",
            "fri_times": "",
            "sat_times": "",
            "sun_times": "",
        },
    )
    assert step4.status_code == 302
    assert step4.url == reverse("dashboard:home")

    home = client.get(reverse("dashboard:home"))
    assert home.status_code == 200
