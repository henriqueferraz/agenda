"""Testes unitários dos services de catálogo."""

from __future__ import annotations

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from apps.accounts.models import User
from apps.catalog.models import Employee, EmployeeService, Service
from apps.catalog.services import employees as employee_services
from apps.catalog.services import services as service_services
from apps.core.security import assert_same_owner, is_same_owner


@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        email="catalog@example.com",
        password="SenhaSegura123!",
        name="Catalog",
    )


@pytest.fixture
def other_user(db) -> User:
    return User.objects.create_user(
        email="other-catalog@example.com",
        password="SenhaSegura123!",
    )


@pytest.mark.django_db
def test_create_and_update_service(user: User) -> None:
    created = service_services.create_service(
        user=user,
        name="Corte",
        price=5000,
        duration=30,
    )
    assert created.ok and created.service is not None
    assert created.service.price == 5000
    assert created.service.duration == 30
    assert is_same_owner(user.pk, created.service)

    updated = service_services.update_service(
        user=user,
        service_id=created.service.pk,
        name="Corte + barba",
        price=8000,
        duration=45,
        status=True,
    )
    assert updated.ok
    assert updated.service is not None
    assert updated.service.name == "Corte + barba"
    assert updated.service.price == 8000


@pytest.mark.django_db
def test_service_validation(user: User) -> None:
    bad_name = service_services.create_service(user=user, name="  ", price=100, duration=10)
    assert not bad_name.ok
    bad_duration = service_services.create_service(user=user, name="X", price=100, duration=0)
    assert not bad_duration.ok


@pytest.mark.django_db
def test_soft_delete_service(user: User) -> None:
    created = service_services.create_service(user=user, name="Corte", price=5000, duration=30)
    assert created.service is not None
    deleted = service_services.soft_delete_service(user=user, service_id=created.service.pk)
    assert deleted.ok
    assert Service.objects.filter(pk=created.service.pk, deleted_at__isnull=False).exists()
    assert not Service.objects.filter(pk=created.service.pk, deleted_at__isnull=True).exists() or (
        Service.objects.get(pk=created.service.pk).deleted_at is not None
    )


@pytest.mark.django_db
def test_soft_delete_blocked_by_future_appointments(user: User) -> None:
    created = service_services.create_service(user=user, name="Corte", price=5000, duration=30)
    assert created.service is not None
    with patch(
        "apps.catalog.services.services.has_future_appointments",
        return_value=True,
    ):
        blocked = service_services.soft_delete_service(user=user, service_id=created.service.pk)
    assert not blocked.ok
    assert "agendamentos futuros" in blocked.message


@pytest.mark.django_db
def test_service_ownership(user: User, other_user: User) -> None:
    created = service_services.create_service(user=user, name="Corte", price=1000, duration=15)
    assert created.service is not None
    with pytest.raises(PermissionError):
        assert_same_owner(other_user.pk, created.service)
    foreign = service_services.update_service(
        user=other_user,
        service_id=created.service.pk,
        name="Hack",
        price=1,
        duration=1,
    )
    assert not foreign.ok


@pytest.mark.django_db
def test_employee_unique_email_per_tenant(user: User, other_user: User) -> None:
    a = employee_services.create_employee(
        user=user,
        name="Ana",
        email="ana@example.com",
        phone="11987654321",
    )
    assert a.ok
    dup = employee_services.create_employee(
        user=user,
        name="Ana 2",
        email="ana@example.com",
    )
    assert not dup.ok

    other = employee_services.create_employee(
        user=other_user,
        name="Ana Other",
        email="ana@example.com",
    )
    assert other.ok


@pytest.mark.django_db
def test_employee_service_link_same_tenant(user: User, other_user: User) -> None:
    svc = service_services.create_service(user=user, name="Corte", price=1000, duration=20)
    assert svc.service is not None
    foreign_svc = service_services.create_service(
        user=other_user,
        name="Outro",
        price=1000,
        duration=20,
    )
    assert foreign_svc.service is not None

    ok = employee_services.create_employee(
        user=user,
        name="Bob",
        email="bob@example.com",
        service_ids=[svc.service.pk],
    )
    assert ok.ok and ok.employee is not None
    assert EmployeeService.objects.filter(employee=ok.employee, service=svc.service).exists()

    bad = employee_services.create_employee(
        user=user,
        name="Carol",
        email="carol@example.com",
        service_ids=[foreign_svc.service.pk],
    )
    assert not bad.ok
    assert not Employee.objects.filter(email="carol@example.com", user=user).exists()


@pytest.mark.django_db
def test_employee_hours(user: User) -> None:
    created = employee_services.create_employee(
        user=user,
        name="Dan",
        email="dan@example.com",
    )
    assert created.employee is not None
    result = employee_services.update_employee_hours(
        user=user,
        employee_id=created.employee.pk,
        times_by_day={"mon_times": ["10:00", "09:00"], "tue_times": []},
    )
    assert result.ok
    employee = Employee.objects.get(pk=created.employee.pk)
    assert employee.mon_times == ["09:00", "10:00"]

    bad_hours = employee_services.update_employee_hours(
        user=user,
        employee_id=created.employee.pk,
        times_by_day={"mon_times": ["25:99"]},
    )
    assert not bad_hours.ok


@pytest.mark.django_db
def test_update_employee_and_soft_delete(user: User) -> None:
    svc = service_services.create_service(user=user, name="Corte", price=1000, duration=20)
    assert svc.service is not None
    created = employee_services.create_employee(
        user=user,
        name="Eve",
        email="eve@example.com",
    )
    assert created.employee is not None

    bad_phone = employee_services.update_employee(
        user=user,
        employee_id=created.employee.pk,
        name="Eve",
        email="eve@example.com",
        phone="123",
    )
    assert not bad_phone.ok

    updated = employee_services.update_employee(
        user=user,
        employee_id=created.employee.pk,
        name="Eve Atualizada",
        email="eve2@example.com",
        phone="11987654321",
        function="Barbeira",
        service_ids=[svc.service.pk],
    )
    assert updated.ok and updated.employee is not None
    assert updated.employee.name == "Eve Atualizada"
    assert updated.employee.services.filter(pk=svc.service.pk).exists()

    deleted = employee_services.soft_delete_employee(
        user=user,
        employee_id=created.employee.pk,
    )
    assert deleted.ok
    assert Employee.objects.get(pk=created.employee.pk).deleted_at is not None


@pytest.mark.django_db
def test_soft_delete_employee_blocked(user: User) -> None:
    created = employee_services.create_employee(
        user=user,
        name="Frank",
        email="frank@example.com",
    )
    assert created.employee is not None
    with patch(
        "apps.catalog.services.employees.has_future_appointments",
        return_value=True,
    ):
        blocked = employee_services.soft_delete_employee(
            user=user,
            employee_id=created.employee.pk,
        )
    assert not blocked.ok

    missing = employee_services.soft_delete_employee(user=user, employee_id=uuid4())
    assert not missing.ok


@pytest.mark.django_db
def test_has_future_appointments_without_scheduling_model(user: User) -> None:
    from apps.catalog.services.future_appointments import has_future_appointments

    assert has_future_appointments(user_id=user.pk, service_id=uuid4()) is False


@pytest.mark.django_db
def test_has_future_appointments_with_mock_model(user: User) -> None:
    from apps.catalog.services.future_appointments import has_future_appointments

    mock_model = MagicMock()
    mock_model.objects.filter.return_value.filter.return_value.exists.return_value = True
    with patch("apps.catalog.services.future_appointments.apps.get_model", return_value=mock_model):
        assert has_future_appointments(user_id=user.pk, service_id=uuid4()) is True
