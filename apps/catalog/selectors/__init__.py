"""Queries de leitura do catálogo."""

from __future__ import annotations

from uuid import UUID

from apps.catalog.models import Employee, Service


def list_services(user_id, *, include_deleted: bool = False) -> list[Service]:
    qs = Service.objects.filter(user_id=user_id)
    if not include_deleted:
        qs = qs.filter(deleted_at__isnull=True)
    return list(qs.order_by("name"))


def get_service(user_id, service_id: UUID, *, include_deleted: bool = False) -> Service | None:
    qs = Service.objects.filter(user_id=user_id, pk=service_id)
    if not include_deleted:
        qs = qs.filter(deleted_at__isnull=True)
    return qs.first()


def list_employees(user_id, *, include_deleted: bool = False) -> list[Employee]:
    qs = Employee.objects.filter(user_id=user_id).prefetch_related("services")
    if not include_deleted:
        qs = qs.filter(deleted_at__isnull=True)
    return list(qs.order_by("name"))


def get_employee(user_id, employee_id: UUID, *, include_deleted: bool = False) -> Employee | None:
    qs = Employee.objects.filter(user_id=user_id, pk=employee_id).prefetch_related("services")
    if not include_deleted:
        qs = qs.filter(deleted_at__isnull=True)
    return qs.first()
