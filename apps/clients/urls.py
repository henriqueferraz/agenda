"""URLConf do app clients."""

from __future__ import annotations

from django.urls import path

from apps.clients import views

app_name = "clients"

urlpatterns = [
    path("", views.clients_list_view, name="list"),
    path("<uuid:client_id>/editar/", views.client_edit_view, name="edit"),
    path("<uuid:client_id>/excluir/", views.client_delete_view, name="delete"),
]
