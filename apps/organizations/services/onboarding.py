"""Estado e próximos passos do onboarding F1."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from django.urls import reverse

from apps.accounts.models import User
from apps.organizations.models import Address
from apps.organizations.services.profile import get_or_create_profile


class OnboardingStep(StrEnum):
    ACTIVITY = "activity"
    MODEL = "model"
    ADDRESS = "address"
    HOURS = "hours"
    DONE = "done"


@dataclass(frozen=True, slots=True)
class OnboardingStatus:
    step: OnboardingStep
    url_name: str | None

    @property
    def is_complete(self) -> bool:
        return self.step == OnboardingStep.DONE


_STEP_URLS: dict[OnboardingStep, str | None] = {
    OnboardingStep.ACTIVITY: "organizations:activity",
    OnboardingStep.MODEL: "organizations:model",
    OnboardingStep.ADDRESS: "organizations:address",
    OnboardingStep.HOURS: "organizations:hours",
    OnboardingStep.DONE: None,
}


def get_onboarding_status(user: User) -> OnboardingStatus:
    """Ordem F1: atividade → modelo → endereço → horários."""
    if getattr(user, "is_master", False):
        return OnboardingStatus(step=OnboardingStep.DONE, url_name=None)

    profile = get_or_create_profile(user)
    if not profile.has_activity():
        return OnboardingStatus(
            step=OnboardingStep.ACTIVITY,
            url_name=_STEP_URLS[OnboardingStep.ACTIVITY],
        )
    if not profile.has_model():
        return OnboardingStatus(
            step=OnboardingStep.MODEL,
            url_name=_STEP_URLS[OnboardingStep.MODEL],
        )
    address = Address.objects.filter(user_id=user.pk).first()
    if address is None or not address.is_complete():
        return OnboardingStatus(
            step=OnboardingStep.ADDRESS,
            url_name=_STEP_URLS[OnboardingStep.ADDRESS],
        )
    if not profile.has_hours():
        return OnboardingStatus(
            step=OnboardingStep.HOURS,
            url_name=_STEP_URLS[OnboardingStep.HOURS],
        )
    return OnboardingStatus(step=OnboardingStep.DONE, url_name=None)


def next_onboarding_url(user: User) -> str | None:
    status = get_onboarding_status(user)
    if status.url_name is None:
        return None
    return reverse(status.url_name)
