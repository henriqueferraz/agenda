"""Smoke mínimo — apps carregam."""

from __future__ import annotations

from django.apps import apps


def test_domain_apps_are_installed() -> None:
    expected = {
        "accounts",
        "organizations",
        "catalog",
        "scheduling",
        "clients",
        "messaging",
        "dashboard",
        "billing",
        "public_booking",
        "core",
    }
    installed = {config.label for config in apps.get_app_configs()}
    assert expected.issubset(installed)
