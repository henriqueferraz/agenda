from __future__ import annotations

from django.apps import AppConfig


class PublicBookingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.public_booking"
    label = "public_booking"
