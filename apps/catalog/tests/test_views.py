"""Testes de views HTMX do catálogo."""

from __future__ import annotations

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import Employee, Service
from apps.catalog.services import employees as employee_services
from apps.catalog.services import services as service_services
from apps.organizations.models import Activity, PersonType
from apps.organizations.services import activity as activity_services
from apps.organizations.services import address as address_services
from apps.organizations.services import hours as hours_services
from apps.organizations.services import profile as profile_services

VALID_CPF = "39053344705"


@pytest.fixture
def enterprise_user(db) -> User:
    user = User.objects.create_user(
        email="cat-ent@example.com",
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
def test_services_crud_flow(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)

    resp = client.post(
        reverse("catalog:services"),
        {"name": "Corte", "price_reais": "50.00", "duration": "30", "status": "on"},
    )
    assert resp.status_code == 302
    service = Service.objects.get(user=enterprise_user, name="Corte")
    assert service.price == 5000

    resp = client.post(
        reverse("catalog:service_edit", args=[service.pk]),
        {"name": "Corte Premium", "price_reais": "70.00", "duration": "40", "status": "on"},
    )
    assert resp.status_code == 302
    service.refresh_from_db()
    assert service.name == "Corte Premium"
    assert service.price == 7000

    resp = client.post(reverse("catalog:service_delete", args=[service.pk]))
    assert resp.status_code == 302
    service.refresh_from_db()
    assert service.deleted_at is not None


@pytest.mark.django_db
def test_service_create_htmx_validation_error(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    resp = client.post(
        reverse("catalog:services"),
        {"name": "", "price_reais": "10", "duration": "10"},
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 422


@pytest.mark.django_db
def test_employees_crud_and_hours(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    svc = service_services.create_service(
        user=enterprise_user,
        name="Corte",
        price=3000,
        duration=30,
    )
    assert svc.service is not None

    resp = client.post(
        reverse("catalog:employees"),
        {
            "name": "Ana",
            "email": "ana@shop.com",
            "phone": "11987654321",
            "function": "Barbeira",
            "status": "on",
            "services": [str(svc.service.pk)],
        },
    )
    assert resp.status_code == 302
    employee = Employee.objects.get(user=enterprise_user, email="ana@shop.com")
    assert employee.services.filter(pk=svc.service.pk).exists()

    resp = client.post(
        reverse("catalog:employee_hours", args=[employee.pk]),
        {"mon_times": "09:00\n10:00", "tue_times": ""},
    )
    assert resp.status_code == 302
    employee.refresh_from_db()
    assert employee.mon_times == ["09:00", "10:00"]


@pytest.mark.django_db
def test_employee_unique_email_view(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    employee_services.create_employee(
        user=enterprise_user,
        name="Ana",
        email="ana@shop.com",
    )
    resp = client.post(
        reverse("catalog:employees"),
        {"name": "Ana 2", "email": "ana@shop.com", "status": "on"},
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 422


@pytest.mark.django_db
def test_employee_edit_and_htmx_delete(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    created = employee_services.create_employee(
        user=enterprise_user,
        name="Bob",
        email="bob@shop.com",
    )
    assert created.employee is not None

    resp = client.get(reverse("catalog:employee_edit", args=[created.employee.pk]))
    assert resp.status_code == 200

    resp = client.post(
        reverse("catalog:employee_edit", args=[created.employee.pk]),
        {
            "name": "Bob Edit",
            "email": "bob@shop.com",
            "phone": "11987654321",
            "function": "Aux",
            "status": "on",
        },
    )
    assert resp.status_code == 302
    created.employee.refresh_from_db()
    assert created.employee.name == "Bob Edit"

    resp = client.post(
        reverse("catalog:employee_delete", args=[created.employee.pk]),
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 200
    assert Employee.objects.get(pk=created.employee.pk).deleted_at is not None


@pytest.mark.django_db
def test_service_edit_get_and_htmx_delete(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    created = service_services.create_service(
        user=enterprise_user,
        name="Barba",
        price=2500,
        duration=20,
    )
    assert created.service is not None
    resp = client.get(reverse("catalog:service_edit", args=[created.service.pk]))
    assert resp.status_code == 200

    resp = client.post(
        reverse("catalog:service_delete", args=[created.service.pk]),
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 200
    assert Service.objects.get(pk=created.service.pk).deleted_at is not None
