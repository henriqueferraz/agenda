"""URLConf do app organizations."""

from __future__ import annotations

from django.urls import path

from apps.organizations import views

app_name = "organizations"

urlpatterns = [
    path(
        "dashboard/configuracoes/atividade/",
        views.activity_view,
        name="activity",
    ),
    path(
        "dashboard/configuracoes/modelo/",
        views.model_view,
        name="model",
    ),
    path(
        "dashboard/configuracoes/endereco/",
        views.address_view,
        name="address",
    ),
    path(
        "dashboard/configuracoes/horarios/",
        views.hours_view,
        name="hours",
    ),
    path("api/cep/", views.cep_lookup_view, name="cep_lookup"),
    path("api/upload/logo/", views.logo_upload_view, name="logo_upload"),
    path(
        "dashboard/admin/atividades/",
        views.master_activities_view,
        name="master_activities",
    ),
    path(
        "dashboard/admin/atividades/<uuid:activity_id>/toggle/",
        views.master_activity_toggle_view,
        name="master_activity_toggle",
    ),
    path(
        "dashboard/admin/atividades/<uuid:activity_id>/editar/",
        views.master_activity_edit_view,
        name="master_activity_edit",
    ),
]
