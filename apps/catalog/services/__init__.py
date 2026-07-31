"""Services do app catalog."""

from __future__ import annotations

from apps.catalog.services import employees as employee_services
from apps.catalog.services import services as service_services

__all__ = [
    "employee_services",
    "service_services",
]
