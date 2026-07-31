"""Integração: catálogo + clientes com ownership e unicidade."""

from __future__ import annotations

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import Employee, Service
from apps.clients.models import Client
from apps.organizations.models import Activity, PersonType
from apps.organizations.services import activity as activity_services
from apps.organizations.services import address as address_services
from apps.organizations.services import hours as hours_services
from apps.organizations.services import profile as profile_services

VALID_CPF = "39053344705"
OTHER_CPF = "52998224725"


def _onboard(user: User) -> None:
    activity_services.seed_default_activities()
    activity = Activity.objects.get(slug="barbearia")
    activity_services.set_user_activity(user=user, activity_id=activity.pk)
    profile_services.update_person_model(
        user=user,
        person_type=PersonType.PF,
        trade_name="Shop",
        cpf=VALID_CPF if user.email.startswith("owner") else OTHER_CPF,
    )
    address_services.update_address(
        user=user,
        street="Rua 1",
        number="1",
        neighborhood="Centro",
        city="São Paulo",
        state="SP",
        zip_code="01310100",
    )
    hours_services.update_business_hours(user=user, times_by_day={"mon_times": ["09:00"]})


@pytest.fixture
def owner(db) -> User:
    user = User.objects.create_user(
        email="owner@example.com",
        password="SenhaSegura123!",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    _onboard(user)
    return user


@pytest.fixture
def stranger(db) -> User:
    user = User.objects.create_user(
        email="stranger@example.com",
        password="SenhaSegura123!",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    _onboard(user)
    return user


@pytest.mark.django_db
def test_catalog_clients_ownership_isolation(client, owner: User, stranger: User) -> None:
    client.force_login(owner)
    assert (
        client.post(
            reverse("catalog:services"),
            {"name": "Corte", "price_reais": "40.00", "duration": "30", "status": "on"},
        ).status_code
        == 302
    )
    service = Service.objects.get(user=owner, name="Corte")

    assert (
        client.post(
            reverse("catalog:employees"),
            {
                "name": "Ana",
                "email": "ana@shop.com",
                "status": "on",
                "services": [str(service.pk)],
            },
        ).status_code
        == 302
    )
    employee = Employee.objects.get(user=owner, email="ana@shop.com")

    assert (
        client.post(
            reverse("clients:list"),
            {
                "name": "Cliente",
                "email": "cli@shop.com",
                "cpf": VALID_CPF,
            },
        ).status_code
        == 302
    )
    row = Client.objects.get(user=owner, email="cli@shop.com")

    client.force_login(stranger)
    assert client.get(reverse("catalog:service_edit", args=[service.pk])).status_code == 302
    assert client.get(reverse("catalog:employee_edit", args=[employee.pk])).status_code == 302
    assert client.get(reverse("clients:edit", args=[row.pk])).status_code == 302

    assert Service.objects.filter(pk=service.pk, user=owner).exists()
    assert not Service.objects.filter(pk=service.pk, user=stranger).exists()
    assert Client.objects.filter(pk=row.pk, user=owner).exists()
