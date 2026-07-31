"""Views de autenticação e trial."""

from __future__ import annotations

from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from apps.accounts.forms import (
    ChangePasswordForm,
    ForgotPasswordForm,
    LoginForm,
    OtpVerifyForm,
    RegisterForm,
    ResendOtpForm,
    ResetPasswordForm,
)
from apps.accounts.models import User
from apps.accounts.services import auth as auth_services


def _is_master(user: object) -> bool:
    return bool(getattr(user, "is_authenticated", False) and getattr(user, "is_master", False))


@require_http_methods(["GET", "POST"])
def register_view(request: HttpRequest) -> HttpResponse:
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        result = auth_services.register_user(
            email=form.cleaned_data["email"],
            password=form.cleaned_data["password"],
            name=form.cleaned_data.get("name", ""),
            request=request,
        )
        messages.info(request, result.message)
        if result.ok:
            request.session["pending_otp_email"] = form.cleaned_data["email"].lower()
            if result.otp_code_for_tests:
                request.session["otp_code_for_tests"] = result.otp_code_for_tests
            return redirect("accounts:verify_otp")
    return render(request, "accounts/register.html", {"form": form})


@require_http_methods(["GET", "POST"])
def verify_otp_view(request: HttpRequest) -> HttpResponse:
    initial = {"email": request.session.get("pending_otp_email", "")}
    form = OtpVerifyForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        result = auth_services.verify_registration_otp(
            email=form.cleaned_data["email"],
            code=form.cleaned_data["code"],
            request=request,
        )
        if result.ok:
            messages.success(request, result.message)
            request.session.pop("pending_otp_email", None)
            request.session.pop("otp_code_for_tests", None)
            return redirect("accounts:login")
        messages.error(request, result.message)
    return render(
        request,
        "accounts/verify_otp.html",
        {"form": form, "otp_code_for_tests": request.session.get("otp_code_for_tests")},
    )


@require_http_methods(["POST"])
def resend_otp_view(request: HttpRequest) -> HttpResponse:
    form = ResendOtpForm(request.POST)
    if form.is_valid():
        result = auth_services.resend_otp(email=form.cleaned_data["email"], request=request)
        messages.info(request, result.message)
        if result.otp_code_for_tests:
            request.session["otp_code_for_tests"] = result.otp_code_for_tests
    return redirect("accounts:verify_otp")


@require_http_methods(["GET", "POST"])
def login_view(request: HttpRequest) -> HttpResponse:
    if request.user.is_authenticated:
        return redirect("dashboard:home")
    form = LoginForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        result = auth_services.login_user(
            request=request,
            email=form.cleaned_data["email"],
            password=form.cleaned_data["password"],
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("dashboard:home")
        messages.error(request, result.message)
    return render(request, "accounts/login.html", {"form": form})


@require_http_methods(["POST"])
def logout_view(request: HttpRequest) -> HttpResponse:
    auth_services.logout_user(request)
    messages.info(request, "Você saiu da conta.")
    return redirect("accounts:login")


@require_http_methods(["GET", "POST"])
def forgot_password_view(request: HttpRequest) -> HttpResponse:
    form = ForgotPasswordForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        result = auth_services.request_password_reset(
            email=form.cleaned_data["email"],
            request=request,
        )
        messages.info(request, result.message)
        if result.otp_code_for_tests:
            request.session["reset_token_for_tests"] = result.otp_code_for_tests
    return render(request, "accounts/forgot_password.html", {"form": form})


@require_http_methods(["GET", "POST"])
def reset_password_view(request: HttpRequest) -> HttpResponse:
    token = request.GET.get("token") or request.POST.get("token") or ""
    form = ResetPasswordForm(request.POST or None, initial={"token": token})
    if request.method == "POST" and form.is_valid():
        result = auth_services.reset_password(
            token=form.cleaned_data["token"],
            new_password=form.cleaned_data["password"],
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("accounts:login")
        messages.error(request, result.message)
    return render(request, "accounts/reset_password.html", {"form": form})


@login_required
@require_http_methods(["GET", "POST"])
def change_password_view(request: HttpRequest) -> HttpResponse:
    form = ChangePasswordForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = request.user
        assert isinstance(user, User)
        result = auth_services.change_password(
            user=user,
            current_password=form.cleaned_data["current_password"],
            new_password=form.cleaned_data["new_password"],
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("dashboard:home")
        messages.error(request, result.message)
    return render(request, "accounts/change_password.html", {"form": form})


@login_required
@require_http_methods(["GET"])
def upgrade_view(request: HttpRequest) -> HttpResponse:
    return render(request, "accounts/upgrade.html")


@login_required
@user_passes_test(_is_master)
@require_http_methods(["GET"])
def master_users_view(request: HttpRequest) -> HttpResponse:
    users = User.objects.all()[:200]
    return render(request, "accounts/master_users.html", {"users": users})


@login_required
@user_passes_test(_is_master)
@require_http_methods(["POST"])
def master_reset_password_view(request: HttpRequest, user_id) -> HttpResponse:
    target = get_object_or_404(User, pk=user_id)
    result = auth_services.request_password_reset(email=target.email, request=request)
    messages.info(request, result.message)
    return redirect("accounts:master_users")
