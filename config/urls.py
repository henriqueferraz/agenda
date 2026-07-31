"""URLConf raiz."""

from __future__ import annotations

from django.contrib import admin
from django.urls import path

from apps.core.views import healthz

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthz, name="healthz"),
]
