"""URLConf raiz."""

from __future__ import annotations

from django.contrib import admin
from django.urls import include, path

from apps.core.views import healthz

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthz, name="healthz"),
    path("", include("apps.accounts.urls")),
    path("", include("apps.organizations.urls")),
    path("dashboard/", include("apps.dashboard.urls")),
]
