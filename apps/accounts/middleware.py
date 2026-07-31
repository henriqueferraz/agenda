"""Middleware de trial — bloqueia painel após trial sem plano pago."""

from __future__ import annotations

from django.shortcuts import redirect
from django.urls import reverse


class TrialGateMiddleware:
    """Redirect para upgrade se trial expirou (exceto master e rota de upgrade)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if (
            path.startswith("/dashboard/")
            and not path.startswith("/dashboard/upgrade")
            and request.user.is_authenticated
            and getattr(request.user, "trial_is_expired", lambda: False)()
        ):
            return redirect(reverse("accounts:upgrade"))
        return self.get_response(request)
