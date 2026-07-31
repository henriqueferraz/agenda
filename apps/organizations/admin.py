from django.contrib import admin

from apps.organizations.models import Activity, Address, OrganizationProfile


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "trade_name", "person_type", "activity", "be_called")
    search_fields = ("user__email", "trade_name", "cpf", "cnpj")
    list_filter = ("person_type",)
    raw_id_fields = ("user", "activity")


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "state", "zip_code")
    search_fields = ("user__email", "city", "zip_code")
    raw_id_fields = ("user",)
