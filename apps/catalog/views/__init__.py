"""Views HTMX do catálogo (serviços e funcionários)."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods, require_POST

from apps.accounts.models import User
from apps.catalog import selectors
from apps.catalog.forms import EmployeeForm, EmployeeHoursForm, ServiceForm
from apps.catalog.services import employees as employee_services
from apps.catalog.services import services as service_services
from apps.organizations.constants import WEEKDAY_TIME_FIELDS


def _user(request: HttpRequest) -> User:
    user = request.user
    assert isinstance(user, User)
    return user


def _is_htmx(request: HttpRequest) -> bool:
    return request.headers.get("HX-Request", "").lower() == "true"


def _service_choices(user: User) -> list[tuple[str, str]]:
    return [(str(s.pk), s.name) for s in selectors.list_services(user.pk)]


def _price_initial(cents: int) -> Decimal:
    return (Decimal(cents) / Decimal(100)).quantize(Decimal("0.01"))


# ---------------------------------------------------------------------------
# Serviços
# ---------------------------------------------------------------------------


@login_required
@require_http_methods(["GET", "POST"])
def services_list_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    if request.method == "POST":
        form = ServiceForm(request.POST)
        if form.is_valid():
            result = service_services.create_service(
                user=user,
                name=form.cleaned_data["name"],
                price=form.cleaned_price_cents(),
                duration=form.cleaned_data["duration"],
                status=bool(form.cleaned_data.get("status")),
            )
            if result.ok:
                messages.success(request, result.message)
                return redirect("catalog:services")
            messages.error(request, result.message)
            status = 422 if _is_htmx(request) else 200
            return render(
                request,
                "catalog/services.html",
                {
                    "form": form,
                    "services": selectors.list_services(user.pk),
                    "editing": None,
                },
                status=status,
            )
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "catalog/services.html",
            {
                "form": form,
                "services": selectors.list_services(user.pk),
                "editing": None,
            },
            status=status,
        )

    form = ServiceForm(initial={"status": True})
    return render(
        request,
        "catalog/services.html",
        {
            "form": form,
            "services": selectors.list_services(user.pk),
            "editing": None,
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def service_edit_view(request: HttpRequest, service_id: UUID) -> HttpResponse:
    user = _user(request)
    service = selectors.get_service(user.pk, service_id)
    if service is None:
        messages.error(request, "Serviço não encontrado.")
        return redirect("catalog:services")

    initial = {
        "name": service.name,
        "price_reais": _price_initial(service.price),
        "duration": service.duration,
        "status": service.status,
    }
    form = ServiceForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        result = service_services.update_service(
            user=user,
            service_id=service.pk,
            name=form.cleaned_data["name"],
            price=form.cleaned_price_cents(),
            duration=form.cleaned_data["duration"],
            status=bool(form.cleaned_data.get("status")),
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("catalog:services")
        messages.error(request, result.message)
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "catalog/services.html",
            {
                "form": form,
                "services": selectors.list_services(user.pk),
                "editing": service,
            },
            status=status,
        )

    return render(
        request,
        "catalog/services.html",
        {
            "form": form,
            "services": selectors.list_services(user.pk),
            "editing": service,
        },
    )


@login_required
@require_POST
def service_delete_view(request: HttpRequest, service_id: UUID) -> HttpResponse:
    user = _user(request)
    result = service_services.soft_delete_service(user=user, service_id=service_id)
    if result.ok:
        messages.success(request, result.message)
    else:
        messages.error(request, result.message)
    if _is_htmx(request):
        return render(
            request,
            "partials/_catalog_services_list.html",
            {"services": selectors.list_services(user.pk)},
            status=200 if result.ok else 422,
        )
    return redirect("catalog:services")


# ---------------------------------------------------------------------------
# Funcionários
# ---------------------------------------------------------------------------


@login_required
@require_http_methods(["GET", "POST"])
def employees_list_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    choices = _service_choices(user)
    if request.method == "POST":
        form = EmployeeForm(request.POST, service_choices=choices)
        if form.is_valid():
            service_ids = [UUID(sid) for sid in form.cleaned_data.get("services") or []]
            result = employee_services.create_employee(
                user=user,
                name=form.cleaned_data["name"],
                email=form.cleaned_data["email"],
                phone=form.cleaned_data.get("phone") or "",
                function=form.cleaned_data.get("function") or "",
                status=bool(form.cleaned_data.get("status")),
                service_ids=service_ids,
            )
            if result.ok:
                messages.success(request, result.message)
                return redirect("catalog:employees")
            messages.error(request, result.message)
            status = 422 if _is_htmx(request) else 200
            return render(
                request,
                "catalog/employees.html",
                {
                    "form": form,
                    "employees": selectors.list_employees(user.pk),
                    "editing": None,
                },
                status=status,
            )
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "catalog/employees.html",
            {
                "form": form,
                "employees": selectors.list_employees(user.pk),
                "editing": None,
            },
            status=status,
        )

    form = EmployeeForm(initial={"status": True}, service_choices=choices)
    return render(
        request,
        "catalog/employees.html",
        {
            "form": form,
            "employees": selectors.list_employees(user.pk),
            "editing": None,
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def employee_edit_view(request: HttpRequest, employee_id: UUID) -> HttpResponse:
    user = _user(request)
    employee = selectors.get_employee(user.pk, employee_id)
    if employee is None:
        messages.error(request, "Funcionário não encontrado.")
        return redirect("catalog:employees")

    choices = _service_choices(user)
    initial = {
        "name": employee.name,
        "email": employee.email,
        "phone": employee.phone,
        "function": employee.function,
        "status": employee.status,
        "services": [str(s.pk) for s in employee.services.filter(deleted_at__isnull=True)],
    }
    form = EmployeeForm(request.POST or None, initial=initial, service_choices=choices)
    if request.method == "POST" and form.is_valid():
        service_ids = [UUID(sid) for sid in form.cleaned_data.get("services") or []]
        result = employee_services.update_employee(
            user=user,
            employee_id=employee.pk,
            name=form.cleaned_data["name"],
            email=form.cleaned_data["email"],
            phone=form.cleaned_data.get("phone") or "",
            function=form.cleaned_data.get("function") or "",
            status=bool(form.cleaned_data.get("status")),
            service_ids=service_ids,
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("catalog:employees")
        messages.error(request, result.message)
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "catalog/employees.html",
            {
                "form": form,
                "employees": selectors.list_employees(user.pk),
                "editing": employee,
            },
            status=status,
        )

    return render(
        request,
        "catalog/employees.html",
        {
            "form": form,
            "employees": selectors.list_employees(user.pk),
            "editing": employee,
        },
    )


@login_required
@require_POST
def employee_delete_view(request: HttpRequest, employee_id: UUID) -> HttpResponse:
    user = _user(request)
    result = employee_services.soft_delete_employee(user=user, employee_id=employee_id)
    if result.ok:
        messages.success(request, result.message)
    else:
        messages.error(request, result.message)
    if _is_htmx(request):
        return render(
            request,
            "partials/_catalog_employees_list.html",
            {"employees": selectors.list_employees(user.pk)},
            status=200 if result.ok else 422,
        )
    return redirect("catalog:employees")


@login_required
@require_http_methods(["GET", "POST"])
def employee_hours_view(request: HttpRequest, employee_id: UUID) -> HttpResponse:
    user = _user(request)
    employee = selectors.get_employee(user.pk, employee_id)
    if employee is None:
        messages.error(request, "Funcionário não encontrado.")
        return redirect("catalog:employees")

    initial = {field: "\n".join(getattr(employee, field) or []) for field in WEEKDAY_TIME_FIELDS}
    form = EmployeeHoursForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        result = employee_services.update_employee_hours(
            user=user,
            employee_id=employee.pk,
            times_by_day=form.cleaned_times_by_day(),
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("catalog:employees")
        messages.error(request, result.message)
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "catalog/employee_hours.html",
            {"form": form, "employee": employee},
            status=status,
        )
    return render(
        request,
        "catalog/employee_hours.html",
        {"form": form, "employee": employee},
    )
