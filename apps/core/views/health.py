"""Healthcheck HTTP."""

from __future__ import annotations

from django.http import HttpRequest, HttpResponse, JsonResponse


def healthz(_request: HttpRequest) -> HttpResponse:
    """Liveness/readiness simples para deploy e CI."""
    return JsonResponse({"status": "ok"})
