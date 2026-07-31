"""Selectors de organizations."""

from __future__ import annotations

from apps.organizations.models import Activity, Address, OrganizationProfile


def active_activities() -> list[Activity]:
    return list(Activity.objects.filter(is_active=True).order_by("sort_order", "name"))


def all_activities() -> list[Activity]:
    return list(Activity.objects.all().order_by("sort_order", "name"))


def get_profile(user_id) -> OrganizationProfile | None:
    return OrganizationProfile.objects.filter(user_id=user_id).select_related("activity").first()


def get_address(user_id) -> Address | None:
    return Address.objects.filter(user_id=user_id).first()
