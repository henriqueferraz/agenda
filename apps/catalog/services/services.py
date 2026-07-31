"""CRUD de serviços do tenant."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import Service
from apps.catalog.selectors import get_service
from apps.catalog.services.future_appointments import has_future_appointments
from apps.core.security import assert_same_owner


@dataclass(frozen=True, slots=True)
class ServiceResult:
    ok: bool
    message: str
    service: Service | None = None


def create_service(
    *,
    user: User,
    name: str,
    price: int,
    duration: int,
    status: bool = True,
) -> ServiceResult:
    clean_name = (name or "").strip()
    if not clean_name:
        return ServiceResult(ok=False, message="Informe o nome do serviço.")
    if price < 0:
        return ServiceResult(ok=False, message="Preço inválido.")
    if duration <= 0:
        return ServiceResult(ok=False, message="Duração deve ser maior que zero.")

    service = Service.objects.create(
        user=user,
        name=clean_name,
        price=price,
        duration=duration,
        status=status,
    )
    return ServiceResult(ok=True, message="Serviço criado.", service=service)


def update_service(
    *,
    user: User,
    service_id: UUID,
    name: str,
    price: int,
    duration: int,
    status: bool = True,
) -> ServiceResult:
    service = get_service(user.pk, service_id)
    if service is None:
        return ServiceResult(ok=False, message="Serviço não encontrado.")
    assert_same_owner(user.pk, service)

    clean_name = (name or "").strip()
    if not clean_name:
        return ServiceResult(ok=False, message="Informe o nome do serviço.")
    if price < 0:
        return ServiceResult(ok=False, message="Preço inválido.")
    if duration <= 0:
        return ServiceResult(ok=False, message="Duração deve ser maior que zero.")

    service.name = clean_name
    service.price = price
    service.duration = duration
    service.status = status
    service.save(update_fields=["name", "price", "duration", "status", "updated_at"])
    return ServiceResult(ok=True, message="Serviço atualizado.", service=service)


def soft_delete_service(*, user: User, service_id: UUID) -> ServiceResult:
    service = get_service(user.pk, service_id)
    if service is None:
        return ServiceResult(ok=False, message="Serviço não encontrado.")
    assert_same_owner(user.pk, service)

    if has_future_appointments(user_id=user.pk, service_id=service.pk):
        return ServiceResult(
            ok=False,
            message="Não é possível excluir: há agendamentos futuros vinculados a este serviço.",
            service=service,
        )

    service.deleted_at = timezone.now()
    service.status = False
    service.save(update_fields=["deleted_at", "status", "updated_at"])
    return ServiceResult(ok=True, message="Serviço excluído.", service=service)
