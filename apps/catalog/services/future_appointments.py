"""Helpers compartilhados do catálogo (agendamentos futuros)."""

from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from django.apps import apps

from apps.core.datetime_sp import get_now_in_sao_paulo


def today_in_sp() -> date:
    return get_now_in_sao_paulo().date()


def has_future_appointments(
    *,
    user_id: Any,
    service_id: UUID | None = None,
    employee_id: UUID | None = None,
) -> bool:
    """True se existir Appointment confirmed futuro (quando o app scheduling existir)."""
    try:
        Appointment = apps.get_model("scheduling", "Appointment")
    except LookupError:
        return False

    qs = Appointment.objects.filter(
        user_id=user_id,
        status="confirmed",
        appointment_date__gte=today_in_sp(),
    )
    if service_id is not None:
        qs = qs.filter(service_id=service_id)
    if employee_id is not None:
        qs = qs.filter(employee_id=employee_id)
    return qs.exists()
