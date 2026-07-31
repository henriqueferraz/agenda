"""Views de configuração / onboarding da organização."""

from __future__ import annotations

from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.accounts.models import User
from apps.organizations import selectors
from apps.organizations.constants import WEEKDAY_TIME_FIELDS
from apps.organizations.forms import (
    ActivityChoiceForm,
    AddressForm,
    BusinessHoursForm,
    LogoUploadForm,
    MasterActivityForm,
    PersonModelForm,
)
from apps.organizations.models import Activity
from apps.organizations.services import activity as activity_services
from apps.organizations.services import address as address_services
from apps.organizations.services import hours as hours_services
from apps.organizations.services import logo as logo_services
from apps.organizations.services import onboarding as onboarding_services
from apps.organizations.services import profile as profile_services
from apps.organizations.services.cep import search_cep


def _is_master(user: object) -> bool:
    return bool(getattr(user, "is_authenticated", False) and getattr(user, "is_master", False))


def _user(request: HttpRequest) -> User:
    user = request.user
    assert isinstance(user, User)
    return user


def _is_htmx(request: HttpRequest) -> bool:
    return request.headers.get("HX-Request", "").lower() == "true"


@login_required
@require_http_methods(["GET", "POST"])
def activity_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    profile = profile_services.get_or_create_profile(user)
    activities = selectors.active_activities()
    form = ActivityChoiceForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        result = activity_services.set_user_activity(
            user=user,
            activity_id=form.cleaned_data["activity"],
        )
        if result.ok:
            messages.success(request, result.message)
            nxt = onboarding_services.next_onboarding_url(user)
            return redirect(nxt or "dashboard:home")
        messages.error(request, result.message)
    return render(
        request,
        "organizations/activity.html",
        {
            "form": form,
            "activities": activities,
            "profile": profile,
            "onboarding": onboarding_services.get_onboarding_status(user),
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def model_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    profile = profile_services.get_or_create_profile(user)
    initial = {
        "person_type": profile.person_type or "",
        "trade_name": profile.trade_name,
        "cpf": profile_services.display_cpf(profile),
        "cnpj": profile_services.display_cnpj(profile),
    }
    form = PersonModelForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        result = profile_services.update_person_model(
            user=user,
            person_type=form.cleaned_data["person_type"],
            trade_name=form.cleaned_data["trade_name"],
            cpf=form.cleaned_data.get("cpf") or "",
            cnpj=form.cleaned_data.get("cnpj") or "",
        )
        if result.ok:
            messages.success(request, result.message)
            nxt = onboarding_services.next_onboarding_url(user)
            return redirect(nxt or "dashboard:home")
        messages.error(request, result.message)
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "organizations/model.html",
            {"form": form, "profile": profile},
            status=status,
        )
    return render(
        request,
        "organizations/model.html",
        {"form": form, "profile": profile},
    )


@login_required
@require_http_methods(["GET", "POST"])
def address_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    address = address_services.get_or_create_address(user)
    initial = {
        "zip_code": address.zip_code,
        "street": address.street,
        "number": address.number,
        "complement": address.complement,
        "neighborhood": address.neighborhood,
        "city": address.city,
        "state": address.state or "SP",
        "country": address.country or "Brasil",
    }
    form = AddressForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        result = address_services.update_address(user=user, **form.cleaned_data)
        if result.ok:
            messages.success(request, result.message)
            nxt = onboarding_services.next_onboarding_url(user)
            return redirect(nxt or "dashboard:home")
        messages.error(request, result.message)
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "organizations/address.html",
            {"form": form, "address": address},
            status=status,
        )
    return render(request, "organizations/address.html", {"form": form, "address": address})


@login_required
@require_GET
def cep_lookup_view(request: HttpRequest) -> HttpResponse:
    """Partial HTMX: preenche campos de endereço a partir do CEP (?cep=)."""
    cep = request.GET.get("cep") or request.GET.get("zip_code") or ""
    result = search_cep(cep)
    template = "partials/_organizations_cep_fields.html"
    if not result.success or result.data is None:
        return render(
            request,
            template,
            {
                "error": result.error or "CEP não encontrado.",
                "street": "",
                "neighborhood": "",
                "city": "",
                "state": "",
                "zip_code": cep,
                "complement": "",
            },
            status=422,
        )
    data = result.data
    return render(
        request,
        template,
        {
            "error": None,
            "street": data.logradouro,
            "neighborhood": data.bairro,
            "city": data.localidade,
            "state": data.uf,
            "zip_code": data.cep,
            "complement": data.complemento,
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def hours_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    profile = profile_services.get_or_create_profile(user)
    initial = {field: "\n".join(getattr(profile, field) or []) for field in WEEKDAY_TIME_FIELDS}
    form = BusinessHoursForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        result = hours_services.update_business_hours(
            user=user,
            times_by_day=form.cleaned_times_by_day(),
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("dashboard:home")
        messages.error(request, result.message)
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "organizations/hours.html",
            {"form": form, "profile": profile},
            status=status,
        )
    return render(request, "organizations/hours.html", {"form": form, "profile": profile})


@login_required
@require_http_methods(["POST", "DELETE"])
def logo_upload_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    if request.method == "DELETE" or request.POST.get("_method") == "DELETE":
        result = logo_services.clear_logo(user=user)
        messages.info(request, result.message)
        if _is_htmx(request):
            profile = profile_services.get_or_create_profile(user)
            return render(
                request,
                "partials/_organizations_logo.html",
                {"profile": profile},
            )
        return redirect("organizations:model")

    form = LogoUploadForm(request.POST, request.FILES)
    if not form.is_valid():
        messages.error(request, "Envie um arquivo de logo.")
        if _is_htmx(request):
            profile = profile_services.get_or_create_profile(user)
            return render(
                request,
                "partials/_organizations_logo.html",
                {"profile": profile, "error": "Envie um arquivo de logo."},
                status=422,
            )
        return redirect("organizations:model")

    uploaded = form.cleaned_data["logo"]
    content = uploaded.read()
    result = logo_services.upload_logo(user=user, content=content, filename=uploaded.name)
    if result.ok:
        messages.success(request, result.message)
    else:
        messages.error(request, result.message)
    profile = profile_services.get_or_create_profile(user)
    if _is_htmx(request):
        return render(
            request,
            "partials/_organizations_logo.html",
            {"profile": profile, "error": None if result.ok else result.message},
            status=200 if result.ok else 422,
        )
    return redirect("organizations:model")


@login_required
@user_passes_test(_is_master)
@require_http_methods(["GET", "POST"])
def master_activities_view(request: HttpRequest) -> HttpResponse:
    form = MasterActivityForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        result = activity_services.create_activity(
            name=form.cleaned_data["name"],
            sort_order=form.cleaned_data.get("sort_order") or 0,
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("organizations:master_activities")
        messages.error(request, result.message)
    return render(
        request,
        "organizations/master_activities.html",
        {"form": form, "activities": selectors.all_activities()},
    )


@login_required
@user_passes_test(_is_master)
@require_POST
def master_activity_toggle_view(request: HttpRequest, activity_id) -> HttpResponse:
    activity = get_object_or_404(Activity, pk=activity_id)
    result = activity_services.update_activity(
        activity_id=activity.pk,
        is_active=not activity.is_active,
    )
    messages.info(request, result.message)
    return redirect("organizations:master_activities")


@login_required
@user_passes_test(_is_master)
@require_POST
def master_activity_edit_view(request: HttpRequest, activity_id) -> HttpResponse:
    form = MasterActivityForm(request.POST)
    if form.is_valid():
        result = activity_services.update_activity(
            activity_id=activity_id,
            name=form.cleaned_data["name"],
            sort_order=form.cleaned_data.get("sort_order") or 0,
            is_active=bool(form.cleaned_data.get("is_active")),
        )
        messages.info(request, result.message)
    else:
        messages.error(request, "Dados inválidos.")
    return redirect("organizations:master_activities")
