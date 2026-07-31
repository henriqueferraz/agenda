"""Admin do catálogo."""

from django.contrib import admin

from apps.catalog.models import Employee, EmployeeService, Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "price", "duration", "status", "deleted_at")
    list_filter = ("status",)
    search_fields = ("name",)
    raw_id_fields = ("user",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "user", "function", "status", "deleted_at")
    list_filter = ("status",)
    search_fields = ("name", "email")
    raw_id_fields = ("user",)


@admin.register(EmployeeService)
class EmployeeServiceAdmin(admin.ModelAdmin):
    list_display = ("employee", "service", "created_at")
    raw_id_fields = ("employee", "service")
