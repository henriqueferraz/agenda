"""Gestão de atividades (seed + master + escolha do tenant)."""

from __future__ import annotations

from dataclasses import dataclass

from django.db import IntegrityError
from django.utils.text import slugify

from apps.accounts.models import User
from apps.organizations.constants import DEFAULT_ACTIVITIES
from apps.organizations.models import Activity
from apps.organizations.services.profile import get_or_create_profile


@dataclass(frozen=True, slots=True)
class ActivityResult:
    ok: bool
    message: str
    activity: Activity | None = None


def seed_default_activities() -> int:
    """Idempotente: cria atividades do seed se ainda não existirem."""
    created = 0
    for slug, name, order in DEFAULT_ACTIVITIES:
        _, was_created = Activity.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "sort_order": order, "is_active": True},
        )
        if was_created:
            created += 1
    return created


def set_user_activity(*, user: User, activity_id) -> ActivityResult:
    try:
        activity = Activity.objects.get(pk=activity_id, is_active=True)
    except Activity.DoesNotExist:
        return ActivityResult(ok=False, message="Atividade inválida ou inativa.")
    profile = get_or_create_profile(user)
    profile.activity = activity
    profile.save(update_fields=["activity", "updated_at"])
    return ActivityResult(ok=True, message="Atividade salva.", activity=activity)


def create_activity(*, name: str, sort_order: int = 0) -> ActivityResult:
    clean = name.strip()
    if not clean:
        return ActivityResult(ok=False, message="Informe o nome da atividade.")
    slug = slugify(clean) or "atividade"
    base = slug
    n = 0
    while Activity.objects.filter(slug=slug).exists():
        n += 1
        slug = f"{base}-{n}"
    try:
        activity = Activity.objects.create(
            name=clean,
            slug=slug,
            sort_order=sort_order,
            is_active=True,
        )
    except IntegrityError:
        return ActivityResult(ok=False, message="Não foi possível criar a atividade.")
    return ActivityResult(ok=True, message="Atividade criada.", activity=activity)


def update_activity(
    *,
    activity_id,
    name: str | None = None,
    is_active: bool | None = None,
    sort_order: int | None = None,
) -> ActivityResult:
    try:
        activity = Activity.objects.get(pk=activity_id)
    except Activity.DoesNotExist:
        return ActivityResult(ok=False, message="Atividade não encontrada.")
    fields: list[str] = []
    if name is not None:
        clean = name.strip()
        if not clean:
            return ActivityResult(ok=False, message="Informe o nome da atividade.")
        activity.name = clean
        fields.append("name")
    if is_active is not None:
        activity.is_active = is_active
        fields.append("is_active")
    if sort_order is not None:
        activity.sort_order = sort_order
        fields.append("sort_order")
    if fields:
        fields.append("updated_at")
        activity.save(update_fields=fields)
    return ActivityResult(ok=True, message="Atividade atualizada.", activity=activity)
