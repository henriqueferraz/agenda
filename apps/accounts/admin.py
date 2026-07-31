from django.contrib import admin

from apps.accounts.models import EmailOtp, IpRateLimit, LoginAttempt, PasswordResetToken, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    ordering = ("email",)
    list_display = ("email", "name", "role", "plan", "trial_ends_at", "is_active", "is_staff")
    search_fields = ("email", "name")
    list_filter = ("role", "plan", "is_active", "is_staff")
    readonly_fields = ("id", "date_joined", "email_verified_at")


admin.site.register(EmailOtp)
admin.site.register(PasswordResetToken)
admin.site.register(LoginAttempt)
admin.site.register(IpRateLimit)
