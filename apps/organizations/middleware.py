"""Middleware de onboarding — força ordem F1 no painel."""

from __future__ import annotations

from django.shortcuts import redirect

from apps.organizations.services.onboarding import next_onboarding_url

_ALLOWED_PREFIXES = (
    "/dashboard/configuracoes/",
    "/dashboard/upgrade",
    "/dashboard/conta/",
    "/dashboard/admin/",
    "/api/cep/",
    "/api/upload/logo/",
)


class OnboardingGateMiddleware:
    """Redireciona enterprise com onboarding incompleto para o próximo passo."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if (
            path.startswith("/dashboard/")
            and not any(path.startswith(p) for p in _ALLOWED_PREFIXES)
            and request.user.is_authenticated
            and not getattr(request.user, "is_master", False)
        ):
            nxt = next_onboarding_url(request.user)
            if nxt and path != nxt:
                # Evita loop se a URL resolvida for a mesma path
                current = path if path.endswith("/") else f"{path}/"
                target = nxt if nxt.endswith("/") else f"{nxt}/"
                if current != target:
                    return redirect(nxt)
        return self.get_response(request)
