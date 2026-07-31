"""Testes de views HTMX de clientes."""

from __future__ import annotations

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.clients.models import Client
from apps.clients.services import clients as client_services
from apps.organizations.models import Activity, PersonType
from apps.organizations.services import activity as activity_services
from apps.organizations.services import address as address_services
from apps.organizations.services import hours as hours_services
from apps.organizations.services import profile as profile_services

VALID_CPF = "39053344705"
OTHER_CPF = "52998224725"


@pytest.fixture
def enterprise_user(db) -> User:
    user = User.objects.create_user(
        email="cli-ent@example.com",
        password="SenhaSegura123!",
        name="Ent",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    return user


def _complete_onboarding(user: User) -> Activity:
    activity_services.seed_default_activities()
    activity = Activity.objects.get(slug="barbearia")
    activity_services.set_user_activity(user=user, activity_id=activity.pk)
    profile_services.update_person_model(
        user=user,
        person_type=PersonType.PF,
        trade_name="Shop",
        cpf=VALID_CPF,
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
    hours_services.update_business_hours(
        user=user,
        times_by_day={"mon_times": ["09:00"]},
    )
    return activity


@pytest.mark.django_db
def test_clients_crud_flow(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)

    resp = client.post(
        reverse("clients:list"),
        {
            "name": "João",
            "email": "joao@cliente.com",
            "phone": "11987654321",
            "cpf": VALID_CPF,
            "notes": "VIP",
        },
    )
    assert resp.status_code == 302
    row = Client.objects.get(user=enterprise_user, email="joao@cliente.com")
    assert row.cpf == VALID_CPF

    resp = client.post(
        reverse("clients:edit", args=[row.pk]),
        {
            "name": "João Silva",
            "email": "joao@cliente.com",
            "phone": "11987654321",
            "cpf": VALID_CPF,
            "notes": "",
        },
    )
    assert resp.status_code == 302
    row.refresh_from_db()
    assert row.name == "João Silva"

    resp = client.post(
        reverse("clients:delete", args=[row.pk]),
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 200
    assert not Client.objects.filter(pk=row.pk).exists()


@pytest.mark.django_db
def test_client_unique_email_htmx_422(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    client_services.create_client(
        user=enterprise_user,
        name="A",
        email="a@cliente.com",
        cpf=VALID_CPF,
    )
    resp = client.post(
        reverse("clients:list"),
        {
            "name": "B",
            "email": "a@cliente.com",
            "cpf": OTHER_CPF,
        },
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 422


@pytest.mark.django_db
def test_client_invalid_cpf_form(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    resp = client.post(
        reverse("clients:list"),
        {
            "name": "X",
            "email": "x@cliente.com",
            "cpf": "11111111111",
        },
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 422


@pytest.mark.django_db
def test_client_edit_get(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    created = client_services.create_client(
        user=enterprise_user,
        name="Y",
        email="y@cliente.com",
        cpf=OTHER_CPF,
    )
    assert created.client is not None
    resp = client.get(reverse("clients:edit", args=[created.client.pk]))
    assert resp.status_code == 200
