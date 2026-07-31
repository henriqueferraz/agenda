"""Admin de clientes."""

from django.contrib import admin

from apps.clients.models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "cpf", "phone", "user")
    search_fields = ("name", "email", "cpf")
    raw_id_fields = ("user",)
