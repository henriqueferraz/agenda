"""Views do dashboard (home mínima na Fase 2)."""

from __future__ import annotations

from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET


@login_required
@require_GET
def home(request: HttpRequest) -> HttpResponse:
    return render(request, "dashboard/home.html", {"user": request.user})
