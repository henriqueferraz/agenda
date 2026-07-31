"""Horários de funcionamento da empresa."""

from __future__ import annotations

from dataclasses import dataclass

from apps.accounts.models import User
from apps.organizations.constants import TIME_HHMM_RE, WEEKDAY_TIME_FIELDS
from apps.organizations.models import OrganizationProfile
from apps.organizations.services.profile import get_or_create_profile


@dataclass(frozen=True, slots=True)
class HoursResult:
    ok: bool
    message: str
    profile: OrganizationProfile | None = None


def clean_times(values: list[str] | None) -> list[str]:
    """Valida HH:MM, remove duplicatas e ordena."""
    if not values:
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in values:
        slot = (raw or "").strip()
        if not TIME_HHMM_RE.match(slot):
            raise ValueError(f"Horário inválido: {raw!r}")
        if slot not in seen:
            seen.add(slot)
            cleaned.append(slot)
    return sorted(cleaned)


def update_business_hours(*, user: User, times_by_day: dict[str, list[str]]) -> HoursResult:
    profile = get_or_create_profile(user)
    updates: dict[str, list[str]] = {}
    try:
        for field in WEEKDAY_TIME_FIELDS:
            updates[field] = clean_times(times_by_day.get(field, []))
    except ValueError as exc:
        return HoursResult(ok=False, message=str(exc))

    if not any(updates.values()):
        return HoursResult(ok=False, message="Informe ao menos um horário de funcionamento.")

    for field, value in updates.items():
        setattr(profile, field, value)
    profile.save(update_fields=[*WEEKDAY_TIME_FIELDS, "updated_at"])
    return HoursResult(ok=True, message="Horários salvos.", profile=profile)
