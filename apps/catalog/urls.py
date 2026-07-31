"""URLConf do app catalog."""

from __future__ import annotations

from django.urls import path

from apps.catalog import views

app_name = "catalog"

urlpatterns = [
    path("servicos/", views.services_list_view, name="services"),
    path("servicos/<uuid:service_id>/editar/", views.service_edit_view, name="service_edit"),
    path("servicos/<uuid:service_id>/excluir/", views.service_delete_view, name="service_delete"),
    path("funcionarios/", views.employees_list_view, name="employees"),
    path(
        "funcionarios/<uuid:employee_id>/editar/",
        views.employee_edit_view,
        name="employee_edit",
    ),
    path(
        "funcionarios/<uuid:employee_id>/excluir/",
        views.employee_delete_view,
        name="employee_delete",
    ),
    path(
        "funcionarios/<uuid:employee_id>/horarios/",
        views.employee_hours_view,
        name="employee_hours",
    ),
]
