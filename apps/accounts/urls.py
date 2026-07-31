"""URLConf do app accounts."""

from __future__ import annotations

from django.urls import path

from apps.accounts import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.register_view, name="register"),
    path("register/verificar-otp/", views.verify_otp_view, name="verify_otp"),
    path("register/reenviar-otp/", views.resend_otp_view, name="resend_otp"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("esqueci-senha/", views.forgot_password_view, name="forgot_password"),
    path("redefinir-senha/", views.reset_password_view, name="reset_password"),
    path("dashboard/conta/senha/", views.change_password_view, name="change_password"),
    path("dashboard/upgrade/", views.upgrade_view, name="upgrade"),
    path("dashboard/admin/usuarios/", views.master_users_view, name="master_users"),
    path(
        "dashboard/admin/usuarios/<uuid:user_id>/reset-senha/",
        views.master_reset_password_view,
        name="master_reset_password",
    ),
]
