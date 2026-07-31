"""CRUD de funcionários + horários + vínculo com serviços."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import Employee, EmployeeService, Service
from apps.catalog.selectors import get_employee, get_service
from apps.catalog.services.future_appointments import has_future_appointments
from apps.core.br_phone import is_valid_phone, unformat_phone
from apps.core.security import assert_same_owner
from apps.organizations.constants import WEEKDAY_TIME_FIELDS
from apps.organizations.services.hours import clean_times


@dataclass(frozen=True, slots=True)
class EmployeeResult:
    ok: bool
    message: str
    employee: Employee | None = None


def create_employee(
    *,
    user: User,
    name: str,
    email: str,
    phone: str = "",
    function: str = "",
    status: bool = True,
    service_ids: list[UUID] | None = None,
) -> EmployeeResult:
    clean_name = (name or "").strip()
    clean_email = (email or "").strip().lower()
    if not clean_name:
        return EmployeeResult(ok=False, message="Informe o nome do funcionário.")
    if not clean_email:
        return EmployeeResult(ok=False, message="Informe o e-mail do funcionário.")

    phone_clean = unformat_phone(phone) if phone else ""
    if phone and not is_valid_phone(phone):
        return EmployeeResult(ok=False, message="Telefone inválido.")

    try:
        with transaction.atomic():
            employee = Employee.objects.create(
                user=user,
                name=clean_name,
                email=clean_email,
                phone=phone_clean,
                function=(function or "").strip(),
                status=status,
            )
            link_error = _set_services(user=user, employee=employee, service_ids=service_ids or [])
            if link_error:
                raise ValueError(link_error)
    except IntegrityError:
        return EmployeeResult(ok=False, message="Já existe um funcionário com este e-mail.")
    except ValueError as exc:
        return EmployeeResult(ok=False, message=str(exc))

    return EmployeeResult(ok=True, message="Funcionário criado.", employee=employee)


def update_employee(
    *,
    user: User,
    employee_id: UUID,
    name: str,
    email: str,
    phone: str = "",
    function: str = "",
    status: bool = True,
    service_ids: list[UUID] | None = None,
) -> EmployeeResult:
    employee = get_employee(user.pk, employee_id)
    if employee is None:
        return EmployeeResult(ok=False, message="Funcionário não encontrado.")
    assert_same_owner(user.pk, employee)

    clean_name = (name or "").strip()
    clean_email = (email or "").strip().lower()
    if not clean_name:
        return EmployeeResult(ok=False, message="Informe o nome do funcionário.")
    if not clean_email:
        return EmployeeResult(ok=False, message="Informe o e-mail do funcionário.")

    phone_clean = unformat_phone(phone) if phone else ""
    if phone and not is_valid_phone(phone):
        return EmployeeResult(ok=False, message="Telefone inválido.")

    try:
        with transaction.atomic():
            employee.name = clean_name
            employee.email = clean_email
            employee.phone = phone_clean
            employee.function = (function or "").strip()
            employee.status = status
            employee.save(
                update_fields=["name", "email", "phone", "function", "status", "updated_at"]
            )
            if service_ids is not None:
                link_error = _set_services(user=user, employee=employee, service_ids=service_ids)
                if link_error:
                    raise ValueError(link_error)
    except IntegrityError:
        return EmployeeResult(ok=False, message="Já existe um funcionário com este e-mail.")
    except ValueError as exc:
        return EmployeeResult(ok=False, message=str(exc))

    return EmployeeResult(ok=True, message="Funcionário atualizado.", employee=employee)


def soft_delete_employee(*, user: User, employee_id: UUID) -> EmployeeResult:
    employee = get_employee(user.pk, employee_id)
    if employee is None:
        return EmployeeResult(ok=False, message="Funcionário não encontrado.")
    assert_same_owner(user.pk, employee)

    if has_future_appointments(user_id=user.pk, employee_id=employee.pk):
        return EmployeeResult(
            ok=False,
            message=(
                "Não é possível excluir: há agendamentos futuros vinculados a este funcionário."
            ),
            employee=employee,
        )

    employee.deleted_at = timezone.now()
    employee.status = False
    employee.save(update_fields=["deleted_at", "status", "updated_at"])
    return EmployeeResult(ok=True, message="Funcionário excluído.", employee=employee)


def update_employee_hours(
    *,
    user: User,
    employee_id: UUID,
    times_by_day: dict[str, list[str]],
) -> EmployeeResult:
    employee = get_employee(user.pk, employee_id)
    if employee is None:
        return EmployeeResult(ok=False, message="Funcionário não encontrado.")
    assert_same_owner(user.pk, employee)

    updates: dict[str, list[str]] = {}
    try:
        for field in WEEKDAY_TIME_FIELDS:
            updates[field] = clean_times(times_by_day.get(field, []))
    except ValueError as exc:
        return EmployeeResult(ok=False, message=str(exc), employee=employee)

    for field, value in updates.items():
        setattr(employee, field, value)
    employee.save(update_fields=[*WEEKDAY_TIME_FIELDS, "updated_at"])
    return EmployeeResult(ok=True, message="Horários do funcionário salvos.", employee=employee)


def _set_services(*, user: User, employee: Employee, service_ids: list[UUID]) -> str | None:
    """Substitui vínculos N:N; ambos devem pertencer ao mesmo tenant."""
    unique_ids = list(dict.fromkeys(service_ids))
    services: list[Service] = []
    for sid in unique_ids:
        service = get_service(user.pk, sid)
        if service is None:
            return "Serviço inválido ou de outro estabelecimento."
        assert_same_owner(user.pk, service)
        if service.user_id != employee.user_id:
            return "Serviço e funcionário devem pertencer ao mesmo estabelecimento."
        services.append(service)

    EmployeeService.objects.filter(employee=employee).delete()
    EmployeeService.objects.bulk_create(
        [EmployeeService(employee=employee, service=svc) for svc in services]
    )
    return None
